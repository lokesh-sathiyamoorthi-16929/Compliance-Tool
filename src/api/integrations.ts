import { createAd360Api } from './ad360';
import {
  createLog360Api,
  getLog360DebugCalls,
  loadObfuscatedConfig,
  loadSessionToken,
  tokenExpiresInSeconds,
} from './log360';

export * as log360 from './log360';
export * as ad360 from './ad360';

export interface Log360Health {
  configured: boolean;
  ok: boolean;
  productVersion?: string;
  user?: string;
  error?: string;
}

export interface Log360Source {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'unknown';
  lastSeenAt?: string;
}

export interface Log360Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  status: 'open' | 'closed' | 'unknown';
  createdAt: string;
  title: string;
}

export interface Log360ScoreBreakdown {
  score: number;
  weight: number;
  reason: string;
}

export interface Log360Summary {
  configured: boolean;
  ok: boolean;
  productVersion?: string;
  fetchedAt: string;
  sources: { total: number; online: number; offline: number; unknown: number; samples: Log360Source[] };
  alerts: { total: number; open: number; closed: number; bySeverity: Record<string, number>; samples: Log360Alert[] };
  retention: { retentionDays: number; archiveEnabled: boolean };
  score: {
    overall: number;
    breakdown: {
      health: Log360ScoreBreakdown;
      coverage: Log360ScoreBreakdown;
      detection: Log360ScoreBreakdown;
      response: Log360ScoreBreakdown;
      retention: Log360ScoreBreakdown;
    };
    band: 'compliant' | 'attention' | 'at-risk';
  };
  errors: string[];
}

function getLiveLog360Api() {
  const config = loadObfuscatedConfig() ?? undefined;
  return createLog360Api(config);
}

function normalizeSourceStatus(value: string | undefined): 'online' | 'offline' | 'unknown' {
  const status = (value ?? '').toLowerCase();
  if (status === 'online' || status === 'active' || status === 'healthy') return 'online';
  if (status === 'offline' || status === 'inactive' || status === 'down') return 'offline';
  return 'unknown';
}

function normalizeAlertSeverity(value: string | undefined): 'low' | 'medium' | 'high' | 'critical' | 'unknown' {
  const severity = (value ?? '').toLowerCase();
  if (severity === 'low' || severity === 'medium' || severity === 'high' || severity === 'critical') return severity;
  return 'unknown';
}

function normalizeAlertStatus(value: string | undefined): 'open' | 'closed' | 'unknown' {
  const status = (value ?? '').toLowerCase();
  if (status === 'open' || status === 'closed') return status;
  return 'unknown';
}

async function buildSummary(): Promise<Log360Summary> {
  const api = getLiveLog360Api();
  const fetchedAt = new Date().toISOString();

  const [user, sourcesResponse, alertsResponse, reportProfiles] = await Promise.all([
    api.metadata.getCurrentUser(),
    api.logSources.list({ limit: 50 }),
    api.alerts.list({ limit: 50 }),
    api.reports.listProfiles({ limit: 100 }),
  ]);

  const sourceSamples: Log360Source[] = sourcesResponse.items.slice(0, 5).map((source) => ({
    id: source.id,
    name: source.log_source,
    status: normalizeSourceStatus(source.status),
  }));

  const sources = {
    total: sourcesResponse.total,
    online: sourceSamples.filter((s) => s.status === 'online').length,
    offline: sourceSamples.filter((s) => s.status === 'offline').length,
    unknown: sourceSamples.filter((s) => s.status === 'unknown').length,
    samples: sourceSamples,
  };

  const alertSamples: Log360Alert[] = alertsResponse.items.slice(0, 5).map((alert) => ({
    id: alert.alert_id,
    title: alert.name,
    severity: normalizeAlertSeverity(alert.severity),
    status: normalizeAlertStatus(alert.status),
    createdAt: alert.created_time ?? fetchedAt,
  }));

  const bySeverity: Record<string, number> = {};
  for (const alert of alertsResponse.items) {
    const sev = normalizeAlertSeverity(alert.severity);
    bySeverity[sev] = (bySeverity[sev] ?? 0) + 1;
  }

  const openAlerts = alertsResponse.items.filter((a) => normalizeAlertStatus(a.status) === 'open').length;
  const retentionDays = reportProfiles.reduce((best, profile) => Math.max(best, Number(profile.retention_days ?? 0)), 0);

  const coverageScore = Math.min(100, Math.round((sources.total > 0 ? sources.online / Math.max(1, sources.total) : 0) * 100));
  const detectionScore = Math.min(100, alertsResponse.total > 0 ? 80 : 60);
  const responseScore = alertsResponse.total > 0 ? Math.max(30, 100 - openAlerts * 5) : 50;
  const retentionScore = retentionDays >= 180 ? 100 : retentionDays >= 90 ? 80 : retentionDays >= 30 ? 60 : 40;
  const healthScore = user ? 100 : 70;
  const overall = Math.round((healthScore + coverageScore + detectionScore + responseScore + retentionScore) / 5);

  return {
    configured: true,
    ok: true,
    fetchedAt,
    productVersion: 'Log360 v2',
    sources,
    alerts: {
      total: alertsResponse.total,
      open: openAlerts,
      closed: Math.max(0, alertsResponse.total - openAlerts),
      bySeverity,
      samples: alertSamples,
    },
    retention: {
      retentionDays,
      archiveEnabled: retentionDays > 0,
    },
    score: {
      overall,
      breakdown: {
        health: { score: healthScore, weight: 20, reason: user ? 'Connected user verified.' : 'Connected but user metadata unavailable.' },
        coverage: { score: coverageScore, weight: 20, reason: 'Coverage based on online log-source ratio.' },
        detection: { score: detectionScore, weight: 20, reason: 'Detection based on alert stream availability.' },
        response: { score: responseScore, weight: 20, reason: 'Response score decreases with open alert backlog.' },
        retention: { score: retentionScore, weight: 20, reason: 'Retention inferred from report profile retention_days.' },
      },
      band: overall >= 80 ? 'compliant' : overall >= 60 ? 'attention' : 'at-risk',
    },
    errors: [],
  };
}

export const log360Api = {
  async health(): Promise<Log360Health> {
    try {
      const config = loadObfuscatedConfig();
      if (!config) {
        return { configured: false, ok: false, error: 'Log360 is not configured.' };
      }
      const api = createLog360Api(config);
      const user = await api.metadata.getCurrentUser();
      return {
        configured: true,
        ok: true,
        user: user?.display_name ?? user?.username,
        productVersion: 'Log360 v2',
      };
    } catch (error) {
      return {
        configured: true,
        ok: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  },

  summary(): Promise<Log360Summary> {
    return buildSummary();
  },

  debugCalls: getLog360DebugCalls,
  tokenExpiresInSeconds: () => tokenExpiresInSeconds(loadSessionToken()),
};

export const ad360Api = createAd360Api();
