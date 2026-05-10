import type { Agent, Incident, LogSource, ReportProfile } from '../api/log360';

export interface Log360ApiLike {
  logSources: {
    list: (params?: { from?: number; limit?: number }) => Promise<{ items: LogSource[]; total: number }>;
    listGroups: () => Promise<Array<{ id: string; name: string; member_count?: number; log_source_ids?: string[] }>>;
    listAgents: () => Promise<Agent[]>;
  };
  reports: {
    listProfiles: (params?: { from?: number; limit?: number }) => Promise<ReportProfile[]>;
    getReportData: (profileId: string, params?: { from_time?: string; to_time?: string; limit?: number }) => Promise<{ response: unknown; meta?: Record<string, unknown> }>;
  };
  incidents: {
    list: (params?: { from?: number; limit?: number }) => Promise<{ items: Incident[]; total: number }>;
  };
  alerts: {
    list: (params?: { from?: number; limit?: number }) => Promise<{ items: Array<Record<string, unknown>>; total: number }>;
  };
}

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
    inScopeCoverage: {
      scopedHosts: string[];
      coveredHosts: string[];
      coverageRatio: number;
    };
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
  retention: {
    retentionDays: number;
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
    criticalLast7d: number;
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
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.rows)) return obj.rows as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
}

function normalizeStatus(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function pickLatestTimestamp(rows: unknown[]): string | null {
  const candidates: string[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const record = row as Record<string, unknown>;
    for (const key of ['time_generated', 'generated_time', 'timestamp', 'created_time', 'event_time']) {
      const value = record[key];
      if (typeof value === 'string') {
        candidates.push(value);
      }
    }
  }

  if (!candidates.length) return null;
  return candidates.sort().reverse()[0];
}

function findReportForKey(allProfiles: ReportProfile[], key: string): ReportProfile | undefined {
  const needle = key.toLowerCase();
  return allProfiles.find((profile) => {
    const uniqueKey = String(profile.unique_key ?? '').toLowerCase();
    const name = String(profile.name ?? '').toLowerCase();
    return uniqueKey.includes(needle) || name.includes(needle.replace(/_/g, ' '));
  });
}

function getErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Unknown error';
}

function toIncidentStatus(value: unknown): 'open' | 'closed' {
  const status = normalizeStatus(value);
  return status === 'closed' || status === 'resolved' ? 'closed' : 'open';
}

function normalizeType(source: LogSource): string {
  return String(source.type ?? source.log_type ?? 'unknown').toLowerCase();
}

function estimateInScopeCoverage(names: string[]): { scopedHosts: string[]; coveredHosts: string[]; coverageRatio: number } {
  const configuredHosts = localStorage.getItem('complianceiq-in-scope-hosts');
  const scopedHosts = configuredHosts
    ? configuredHosts.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean)
    : names.map((name) => name.toLowerCase());
  const normalized = names.map((name) => name.toLowerCase());
  const coveredHosts = scopedHosts.filter((host) => normalized.some((name) => name.includes(host)));
  return {
    scopedHosts,
    coveredHosts,
    coverageRatio: scopedHosts.length ? coveredHosts.length / scopedHosts.length : 0,
  };
}

function isWithinLast7Days(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000;
}

export async function collectEvidence(log360: Log360ApiLike): Promise<Evidence> {
  const collectedAt = new Date().toISOString();

  const [logSourcesResult, groupsResult, agentsResult, profilesResult, incidentsResult, alertsResult] = await Promise.allSettled([
    log360.logSources.list({ from: 0, limit: 200 }),
    log360.logSources.listGroups(),
    log360.logSources.listAgents(),
    log360.reports.listProfiles({ from: 0, limit: 200 }),
    log360.incidents.list({ from: 0, limit: 200 }),
    log360.alerts.list({ from: 0, limit: 200 }),
  ]);

  const errors: EvidenceErrors = {};

  const logSources = logSourcesResult.status === 'fulfilled' ? logSourcesResult.value.items : [];
  if (logSourcesResult.status === 'rejected') errors.logSources = getErrorMessage(logSourcesResult.reason);

  const groups = groupsResult.status === 'fulfilled' ? groupsResult.value : [];
  if (groupsResult.status === 'rejected') errors.logSourceGroups = getErrorMessage(groupsResult.reason);

  const agents = agentsResult.status === 'fulfilled' ? agentsResult.value : [];
  if (agentsResult.status === 'rejected') errors.agents = getErrorMessage(agentsResult.reason);

  const profiles = profilesResult.status === 'fulfilled' ? profilesResult.value : [];
  if (profilesResult.status === 'rejected') errors.reportProfiles = getErrorMessage(profilesResult.reason);

  const incidents = incidentsResult.status === 'fulfilled' ? incidentsResult.value.items : [];
  if (incidentsResult.status === 'rejected') errors.incidents = getErrorMessage(incidentsResult.reason);

  const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value.items : [];
  if (alertsResult.status === 'rejected') errors.alerts = getErrorMessage(alertsResult.reason);

  const byType: Record<string, number> = {};
  for (const source of logSources) {
    const type = normalizeType(source);
    byType[type] = (byType[type] ?? 0) + 1;
  }

  const healthy = agents.filter((agent) => ['healthy', 'online', 'active'].includes(normalizeStatus(agent.status))).length;
  const unhealthy = agents
    .filter((agent) => !['healthy', 'online', 'active'].includes(normalizeStatus(agent.status)))
    .map((agent) => String(agent.name ?? agent.id ?? 'Unknown Agent'));

  const reportProfilesByUniqueKey: Record<string, ReportProfile> = {};
  for (const profile of profiles) {
    const key = String(profile.unique_key ?? '').trim();
    if (key) {
      reportProfilesByUniqueKey[key] = profile;
    }
  }

  const reportSamples: Record<string, ReportSample> = {};
  const now = new Date();
  const fromTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const toTime = now.toISOString();

  const reportResults = await Promise.all(
    CURATED_REPORT_KEYS.map(async (key) => {
      const report = findReportForKey(profiles, key);
      if (!report?.profile_id) return null;

      try {
        const data = await log360.reports.getReportData(report.profile_id, { from_time: fromTime, to_time: toTime, limit: 100 });
        return { key, report, data };
      } catch (error) {
        errors.reports = errors.reports ?? getErrorMessage(error);
        return null;
      }
    }),
  );

  for (const result of reportResults) {
    if (!result) continue;
    const rows = toArray<Record<string, unknown>>((result.data as { response?: unknown }).response);
    reportSamples[result.key] = {
      reportId: result.report.profile_id,
      reportName: result.report.name,
      uniqueKey: String(result.report.unique_key ?? result.key),
      totalItems: Number((result.data.meta?.total as number | undefined) ?? rows.length),
      sampleCount: rows.length,
      latestTimestamp: pickLatestTimestamp(rows),
    };
  }

  const incidentsBySeverity: Record<string, number> = {};
  let openIncidents = 0;
  let closedIncidents = 0;
  for (const incident of incidents) {
    const severity = String(incident.severity ?? 'unknown').toLowerCase();
    incidentsBySeverity[severity] = (incidentsBySeverity[severity] ?? 0) + 1;
    if (toIncidentStatus(incident.status) === 'closed') closedIncidents += 1;
    else openIncidents += 1;
  }

  const criticalLast7d = alerts.filter((alert) => {
    const severity = normalizeStatus((alert as { severity?: string }).severity);
    const createdTime = (alert as { created_time?: string }).created_time;
    return severity === 'critical' && isWithinLast7Days(createdTime);
  }).length;
  const logSourceNames = logSources.map((source) => String(source.log_source ?? source.id ?? 'unknown'));
  const inScopeCoverage = estimateInScopeCoverage(logSourceNames);
  const retentionDays = profiles.reduce((best, profile) => Math.max(best, Number(profile.retention_days ?? 0)), 0);

  return {
    logSources: {
      count: logSources.length,
      byType,
      names: logSourceNames,
      items: logSources,
      inScopeCoverage,
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
      all: profiles,
    },
    retention: {
      retentionDays,
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
      total: alerts.length,
      criticalLast7d,
    },
    collectedAt,
    partialSuccess: Object.keys(errors).length > 0,
    errors,
  };
}
