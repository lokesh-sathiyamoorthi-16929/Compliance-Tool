import {
  Agent,
  Incident,
  Log360Client,
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

export async function collectEvidence(client: Log360Client): Promise<Evidence> {
  const collectedAt = new Date().toISOString();

  const [
    logSourcesResult,
    groupsResult,
    agentsResult,
    profilesResult,
    incidentsResult,
    alertsResult,
  ] = await Promise.allSettled([
    client.getLogSources(),
    client.getLogSourceGroups(),
    client.getAgents(),
    client.getReportProfiles({ from: 0, limit: 100 }),
    client.getIncidents({ response_type: 'client' }),
    client.getAlerts(),
  ]);

  const errors: EvidenceErrors = {};

  const logSources = logSourcesResult.status === 'fulfilled' ? logSourcesResult.value : [];
  if (logSourcesResult.status === 'rejected') errors.logSources = getErrorMessage(logSourcesResult.reason);

  const groups = groupsResult.status === 'fulfilled' ? groupsResult.value : [];
  if (groupsResult.status === 'rejected') errors.logSourceGroups = getErrorMessage(groupsResult.reason);

  const agents = agentsResult.status === 'fulfilled' ? agentsResult.value : [];
  if (agentsResult.status === 'rejected') errors.agents = getErrorMessage(agentsResult.reason);

  const modules =
    profilesResult.status === 'fulfilled'
      ? toArray<Record<string, unknown>>(profilesResult.value.response?.modules)
      : [];
  if (profilesResult.status === 'rejected') errors.reportProfiles = getErrorMessage(profilesResult.reason);

  const incidents = incidentsResult.status === 'fulfilled' ? incidentsResult.value : [];
  if (incidentsResult.status === 'rejected') errors.incidents = getErrorMessage(incidentsResult.reason);

  const alertsPayload = alertsResult.status === 'fulfilled' ? alertsResult.value : undefined;
  if (alertsResult.status === 'rejected') errors.alerts = getErrorMessage(alertsResult.reason);

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

      return client
        .getReportData(report.report_id, {
          startTime: start24h,
          endTime: end,
        })
        .then((data) => ({ key, report, data }))
        .catch((error) => ({ key, report, error }));
    })
    .filter(Boolean) as Array<Promise<{ key: string; report: ReportProfile; data?: { response?: unknown; meta?: { total_items?: number; items_in_current_page?: number } }; error?: unknown }>>;

  const reportResults = await Promise.all(reportPromises);

  for (const result of reportResults) {
    if (result.error) {
      errors.reports = errors.reports ?? 'Some report samples failed to load.';
      continue;
    }

    const rows = toArray<Record<string, unknown>>(result.data?.response);
    reportSamples[result.key] = {
      reportId: result.report.report_id,
      reportName: result.report.report_name,
      uniqueKey: String(result.report.unique_key ?? result.key),
      totalItems: Number(result.data?.meta?.total_items ?? rows.length ?? 0),
      sampleCount: Math.min(100, Number(result.data?.meta?.items_in_current_page ?? rows.length ?? 0)),
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
    collectedAt,
    partialSuccess: hasErrors,
    errors,
  };
}
