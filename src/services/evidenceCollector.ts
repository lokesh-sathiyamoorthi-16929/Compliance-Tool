import {
  Agent,
  Incident,
  Log360Client,
  Log360ClientError,
  LogSource,
  ReportProfile,
} from './log360Client';

export interface ReportSample {
  reportId: string;
  reportName: string;
  uniqueKey: string;
  totalItems: number;
  sampleCount: number;
  latestTimestamp: string | null;
}

export interface EndpointSyncResult {
  key: string;
  method: 'GET' | 'POST';
  path: string;
  latencyMs: number;
  ok: boolean;
  statusCode?: number;
  statusText: string;
  summary: string;
  reason?: string;
  unavailableOnBuild?: boolean;
  networkError?: boolean;
  timeout?: boolean;
}

export interface EvidenceErrors {
  logSources?: string;
  agents?: string;
  logSourceGroups?: string;
  reportProfiles?: string;
  reports?: string;
  incidents?: string;
  alerts?: string;
}

export interface Evidence {
  logSources: {
    count: number;
    byType: Record<string, number>;
    names: string[];
    items: LogSource[];
  };
  agents: {
    total: number;
    healthy: number;
    unhealthy: string[];
    items: Agent[];
  };
  logSourceGroups: {
    name: string;
    memberCount: number;
  }[];
  reportProfiles: {
    byUniqueKey: Record<string, ReportProfile>;
    all: ReportProfile[];
  };
  recentReportSamples: Record<string, ReportSample>;
  incidents: {
    total: number;
    open: number;
    closed: number;
    bySeverity: Record<string, number>;
    items: Incident[];
  };
  alerts: {
    total: number;
  };
  diagnostics: EndpointSyncResult[];
  collectedAt: string;
  partialSuccess: boolean;
  errors: EvidenceErrors;
}

const CURATED_REPORT_KEYS = [
  'windows_logon_success',
  'windows_logon_failure',
  'privileged_user_activity',
  'object_access',
  'account_management',
  'file_integrity',
  'change',
];

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

function flattenProfiles(modules: unknown[]): ReportProfile[] {
  const flattened: ReportProfile[] = [];

  for (const module of modules) {
    if (!module || typeof module !== 'object') continue;
    const categories = toArray<Record<string, unknown>>((module as Record<string, unknown>).categories);
    for (const category of categories) {
      const groups = toArray<Record<string, unknown>>(category.groups);
      for (const group of groups) {
        const reports = toArray<ReportProfile>(group.reports);
        flattened.push(...reports);
      }
    }
  }

  return flattened;
}

function normalizeStatus(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function pickLatestTimestamp(rows: unknown[]): string | null {
  const candidates: string[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    for (const key of ['time_generated', 'generated_time', 'timestamp', 'created_time', 'event_time']) {
      const value = r[key];
      if (typeof value === 'string') {
        candidates.push(value);
      }
    }
  }

  if (candidates.length === 0) return null;
  return candidates.sort().reverse()[0];
}

function findReportForKey(allProfiles: ReportProfile[], key: string): ReportProfile | undefined {
  const lcKey = key.toLowerCase();
  return allProfiles.find((report) => {
    const uniqueKey = String(report.unique_key ?? '').toLowerCase();
    const reportName = String(report.report_name ?? '').toLowerCase();
    return uniqueKey.includes(lcKey) || reportName.includes(lcKey.replace(/_/g, ' '));
  });
}

function getErrorMessage(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  return 'Unknown error';
}

function parseDiagnosticError(error: unknown): Pick<EndpointSyncResult, 'statusCode' | 'statusText' | 'reason' | 'unavailableOnBuild' | 'networkError' | 'timeout'> {
  if (error instanceof Log360ClientError) {
    if (error.kind === 'NETWORK_ERROR') {
      return {
        statusText: 'CORS blocked / network error',
        reason: error.message,
        networkError: true,
      };
    }

    if (error.kind === 'TIMEOUT') {
      return {
        statusText: 'Timeout',
        reason: error.message,
        timeout: true,
      };
    }

    if (error.status === 404) {
      return {
        statusCode: 404,
        statusText: 'Not Found',
        reason: error.message,
        unavailableOnBuild: true,
      };
    }

    const statusText = error.kind === 'UNAUTHORIZED' ? 'Unauthorized' : 'Error';

    return {
      statusCode: error.status,
      statusText,
      reason: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      statusText: 'Error',
      reason: error.message,
    };
  }

  return {
    statusText: 'Error',
    reason: 'Unknown error',
  };
}

type EndpointCallResult<T> = {
  value?: T;
  error?: unknown;
  diagnostic: EndpointSyncResult;
};

async function callEndpoint<T>(params: {
  key: string;
  method: 'GET' | 'POST';
  path: string;
  summary: (value: T) => string;
  fn: () => Promise<T>;
}): Promise<EndpointCallResult<T>> {
  const startedAt = performance.now();
  try {
    const value = await params.fn();
    return {
      value,
      diagnostic: {
        key: params.key,
        method: params.method,
        path: params.path,
        latencyMs: Math.round(performance.now() - startedAt),
        ok: true,
        statusCode: 200,
        statusText: '200 OK',
        summary: params.summary(value),
      },
    };
  } catch (error) {
    const parsed = parseDiagnosticError(error);
    return {
      error,
      diagnostic: {
        key: params.key,
        method: params.method,
        path: params.path,
        latencyMs: Math.round(performance.now() - startedAt),
        ok: false,
        statusCode: parsed.statusCode,
        statusText: parsed.statusCode ? `${parsed.statusCode} ${parsed.statusText}` : parsed.statusText,
        summary: parsed.reason ?? 'Request failed',
        reason: parsed.reason,
        unavailableOnBuild: parsed.unavailableOnBuild,
        networkError: parsed.networkError,
        timeout: parsed.timeout,
      },
    };
  }
}

export async function collectEvidence(client: Log360Client): Promise<Evidence> {
  const collectedAt = new Date().toISOString();

  const [
    logSourcesResult,
    groupsResult,
    agentsResult,
    profilesResult,
    incidentsResult,
    alertsResult,
  ] = await Promise.all([
    callEndpoint({
      key: 'logSources',
      method: 'GET',
      path: '/api/v2/log-sources',
      fn: () => client.getLogSources(),
      summary: (items) => `${items.length} log sources`,
    }),
    callEndpoint({
      key: 'logSourceGroups',
      method: 'GET',
      path: '/api/v2/log-sources/log-source-groups',
      fn: () => client.getLogSourceGroups(),
      summary: (items) => `${items.length} source groups`,
    }),
    callEndpoint({
      key: 'agents',
      method: 'GET',
      path: '/api/v2/log-sources/agents',
      fn: () => client.getAgents(),
      summary: (items) => `${items.length} agents`,
    }),
    callEndpoint({
      key: 'reportProfiles',
      method: 'POST',
      path: '/api/v2/report/profiles',
      fn: () => client.getReportProfiles({ from: 0, limit: 100 }),
      summary: () => 'report profiles loaded',
    }),
    callEndpoint({
      key: 'incidents',
      method: 'GET',
      path: '/api/v2/incident?response_type=client',
      fn: () => client.getIncidents({ response_type: 'client' }),
      summary: (items) => `${items.length} incidents`,
    }),
    callEndpoint({
      key: 'alerts',
      method: 'GET',
      path: '/api/v2/alerts',
      fn: () => client.getAlerts(),
      summary: (payload) => `${toArray((payload as { response?: unknown })?.response).length} alerts`,
    }),
  ]);

  const diagnostics: EndpointSyncResult[] = [
    logSourcesResult.diagnostic,
    groupsResult.diagnostic,
    agentsResult.diagnostic,
    profilesResult.diagnostic,
    incidentsResult.diagnostic,
    alertsResult.diagnostic,
  ];

  const errors: EvidenceErrors = {};

  const logSources = logSourcesResult.value ?? [];
  if (logSourcesResult.error) errors.logSources = getErrorMessage(logSourcesResult.error);

  const groups = groupsResult.value ?? [];
  if (groupsResult.error) errors.logSourceGroups = getErrorMessage(groupsResult.error);

  const agents = agentsResult.value ?? [];
  if (agentsResult.error) errors.agents = getErrorMessage(agentsResult.error);

  const modules = profilesResult.value
    ? toArray<Record<string, unknown>>(profilesResult.value.response?.modules)
    : [];
  if (profilesResult.error) errors.reportProfiles = getErrorMessage(profilesResult.error);

  const incidents = incidentsResult.value ?? [];
  if (incidentsResult.error) errors.incidents = getErrorMessage(incidentsResult.error);

  const alertsPayload = alertsResult.value;
  if (alertsResult.error) errors.alerts = getErrorMessage(alertsResult.error);

  const byType: Record<string, number> = {};
  for (const source of logSources) {
    const type = String(source.log_type ?? 'unknown');
    byType[type] = (byType[type] ?? 0) + 1;
  }

  const healthy = agents.filter((agent) => {
    const status = normalizeStatus(agent.health_status ?? agent.status);
    return status === 'healthy' || status === 'online' || status === 'active';
  }).length;

  const unhealthy = agents
    .filter((agent) => {
      const status = normalizeStatus(agent.health_status ?? agent.status);
      return status && !['healthy', 'online', 'active'].includes(status);
    })
    .map((agent) => String(agent.name ?? agent.id ?? 'Unknown Agent'));

  const allProfiles = flattenProfiles(modules);
  const reportProfilesByUniqueKey: Record<string, ReportProfile> = {};
  for (const profile of allProfiles) {
    const key = String(profile.unique_key ?? '').trim();
    if (key) {
      reportProfilesByUniqueKey[key] = profile;
    }
  }

  const reportSamples: Record<string, ReportSample> = {};

  const now = new Date();
  const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const end = now.toISOString();

  const reportPromises = CURATED_REPORT_KEYS
    .map((key) => {
      const report = findReportForKey(allProfiles, key);
      if (!report?.report_id) return null;

      return callEndpoint({
        key: `reportData:${key}`,
        method: 'POST',
        path: `/api/v2/report/data/${report.report_id}`,
        fn: () => client.getReportData(report.report_id, {
          startTime: start24h,
          endTime: end,
        }),
        summary: (data) => {
          const rows = toArray<Record<string, unknown>>(data.response);
          return `${rows.length} rows for ${report.report_name}`;
        },
      }).then((result) => ({ key, report, result }));
    })
    .filter(Boolean) as Array<Promise<{ key: string; report: ReportProfile; result: EndpointCallResult<{ response?: unknown; meta?: { total_items?: number; items_in_current_page?: number } }> }>>;

  const reportResults = await Promise.all(reportPromises);

  for (const reportResult of reportResults) {
    diagnostics.push(reportResult.result.diagnostic);

    if (reportResult.result.error || !reportResult.result.value) {
      errors.reports = errors.reports ?? 'Some report samples failed to load.';
      continue;
    }

    const rows = toArray<Record<string, unknown>>(reportResult.result.value.response);
    reportSamples[reportResult.key] = {
      reportId: reportResult.report.report_id,
      reportName: reportResult.report.report_name,
      uniqueKey: String(reportResult.report.unique_key ?? reportResult.key),
      totalItems: Number(reportResult.result.value.meta?.total_items ?? rows.length ?? 0),
      sampleCount: Math.min(100, Number(reportResult.result.value.meta?.items_in_current_page ?? rows.length ?? 0)),
      latestTimestamp: pickLatestTimestamp(rows),
    };
  }

  const incidentsBySeverity: Record<string, number> = {};
  let openIncidents = 0;
  let closedIncidents = 0;

  for (const incident of incidents) {
    const severity = String(incident.severity ?? 'unknown').toLowerCase();
    incidentsBySeverity[severity] = (incidentsBySeverity[severity] ?? 0) + 1;

    const status = normalizeStatus(incident.status);
    if (['closed', 'resolved'].includes(status)) {
      closedIncidents += 1;
    } else {
      openIncidents += 1;
    }
  }

  const alertItems = toArray<Record<string, unknown>>((alertsPayload as { response?: unknown })?.response);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    logSources: {
      count: logSources.length,
      byType,
      names: logSources.map((source) => String(source.name ?? source.id ?? 'Unknown Source')),
      items: logSources,
    },
    agents: {
      total: agents.length,
      healthy,
      unhealthy,
      items: agents,
    },
    logSourceGroups: groups.map((group) => ({
      name: String(group.name ?? group.id ?? 'Unknown Group'),
      memberCount: Number(group.member_count ?? group.log_source_ids?.length ?? 0),
    })),
    reportProfiles: {
      byUniqueKey: reportProfilesByUniqueKey,
      all: allProfiles,
    },
    recentReportSamples: reportSamples,
    incidents: {
      total: incidents.length,
      open: openIncidents,
      closed: closedIncidents,
      bySeverity: incidentsBySeverity,
      items: incidents,
    },
    alerts: {
      total: alertItems.length,
    },
    diagnostics,
    collectedAt,
    partialSuccess: hasErrors,
    errors,
  };
}
