import { Log360Client, Log360ClientError } from './log360Client';

export type Log360MetricKey = 'health' | 'coverage' | 'detection' | 'response';
export type Log360ScoreBand = 'compliant' | 'attention' | 'at-risk';

export interface Log360ScoreBreakdown {
  score: number;
  weight: number;
  reason: string;
}

export interface Log360EndpointDiagnostic {
  key: Log360MetricKey;
  label: string;
  method: 'GET' | 'POST';
  logicalPath: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  responseSummary: string;
  failureCategory?: string;
  errorMessage?: string;
}

export interface Log360Overview {
  configured: boolean;
  ok: boolean;
  fetchedAt: string;
  totals: {
    logFields: number;
    logSources: number;
    alerts: number;
    alertProfiles: number;
  };
  score: {
    overall: number;
    band: Log360ScoreBand;
    breakdown: Record<Log360MetricKey, Log360ScoreBreakdown>;
  };
  diagnostics: Log360EndpointDiagnostic[];
  errors: string[];
}

type EndpointProbeResult<T> = {
  value?: T;
  diagnostic: Log360EndpointDiagnostic;
  error?: Log360ClientError;
};

function getFailureCategory(kind: Log360ClientError['kind']): string {
  switch (kind) {
    case 'UNAUTHORIZED':
      return 'Unauthorized';
    case 'NOT_CONFIGURED':
      return 'Not configured';
    case 'NETWORK_ERROR':
      return 'Network error';
    case 'TIMEOUT':
      return 'Timeout';
    case 'BAD_REQUEST':
      return 'Bad request';
    case 'SERVER_ERROR':
      return 'Server error';
    default:
      return 'Unknown error';
  }
}

function countResponseItems(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.response)) {
      return record.response.length;
    }
    if (record.response && typeof record.response === 'object') {
      const nested = record.response as Record<string, unknown>;
      for (const key of ['items', 'data', 'alerts']) {
        if (Array.isArray(nested[key])) {
          return nested[key].length;
        }
      }
    }
  }
  return 0;
}

async function probeEndpoint<T>(
  key: Log360MetricKey,
  label: string,
  method: 'GET' | 'POST',
  logicalPath: string,
  request: () => Promise<T>,
  summarize: (value: T) => string,
): Promise<EndpointProbeResult<T>> {
  const startedAt = performance.now();

  try {
    const value = await request();
    return {
      value,
      diagnostic: {
        key,
        label,
        method,
        logicalPath,
        ok: true,
        status: 200,
        latencyMs: Math.round(performance.now() - startedAt),
        responseSummary: summarize(value),
      },
    };
  } catch (error) {
    const clientError =
      error instanceof Log360ClientError
        ? error
        : new Log360ClientError('UNKNOWN', error instanceof Error ? error.message : 'Unexpected Log360 API error.');

    return {
      error: clientError,
      diagnostic: {
        key,
        label,
        method,
        logicalPath,
        ok: false,
        status: clientError.status ?? 0,
        latencyMs: Math.round(performance.now() - startedAt),
        responseSummary: clientError.message,
        failureCategory: getFailureCategory(clientError.kind),
        errorMessage: clientError.message,
      },
    };
  }
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildMetricBreakdown(overview: Log360Overview['totals'], diagnostics: Record<Log360MetricKey, Log360EndpointDiagnostic>) {
  const healthScore = !diagnostics.health.ok
    ? 0
    : diagnostics.health.latencyMs <= 250
      ? 100
      : diagnostics.health.latencyMs <= 500
        ? 95
        : diagnostics.health.latencyMs <= 1000
          ? 90
          : diagnostics.health.latencyMs <= 2500
            ? 80
            : 70;

  const coverageScore = !diagnostics.coverage.ok
    ? 0
    : overview.logSources === 0
      ? 0
      : clampScore(55 + overview.logSources * 5);

  const detectionScore = !diagnostics.detection.ok
    ? 0
    : overview.alerts === 0
      ? 40
      : clampScore(70 + overview.alerts * 2);

  const responseScore = !diagnostics.response.ok
    ? 0
    : overview.alertProfiles === 0
      ? 40
      : clampScore(70 + overview.alertProfiles * 5);

  return {
    health: {
      score: healthScore,
      weight: 0.25,
      reason: diagnostics.health.ok
        ? `${diagnostics.health.method} ${diagnostics.health.logicalPath} responded in ${diagnostics.health.latencyMs} ms.`
        : diagnostics.health.errorMessage ?? 'Health probe failed.',
    },
    coverage: {
      score: coverageScore,
      weight: 0.25,
      reason: diagnostics.coverage.ok
        ? `${overview.logSources} log source${overview.logSources === 1 ? '' : 's'} returned by ${diagnostics.coverage.method} ${diagnostics.coverage.logicalPath}.`
        : diagnostics.coverage.errorMessage ?? 'Coverage query failed.',
    },
    detection: {
      score: detectionScore,
      weight: 0.25,
      reason: diagnostics.detection.ok
        ? `${overview.alerts} alert${overview.alerts === 1 ? '' : 's'} returned by ${diagnostics.detection.method} ${diagnostics.detection.logicalPath}.`
        : diagnostics.detection.errorMessage ?? 'Detection query failed.',
    },
    response: {
      score: responseScore,
      weight: 0.25,
      reason: diagnostics.response.ok
        ? `${overview.alertProfiles} alert profile${overview.alertProfiles === 1 ? '' : 's'} returned by ${diagnostics.response.method} ${diagnostics.response.logicalPath}.`
        : diagnostics.response.errorMessage ?? 'Response query failed.',
    },
  } satisfies Record<Log360MetricKey, Log360ScoreBreakdown>;
}

function getBand(score: number): Log360ScoreBand {
  if (score >= 80) return 'compliant';
  if (score >= 60) return 'attention';
  return 'at-risk';
}

export async function collectLog360Overview(client: Log360Client = new Log360Client()): Promise<Log360Overview> {
  const [logFieldsResult, logSourcesResult, alertsResult, alertProfilesResult] = await Promise.all([
    probeEndpoint(
      'health',
      'Health',
      'GET',
      '/api/v2/meta/log-fields',
      () => client.getLogFields(),
      (value) => `${value.length} log fields`,
    ),
    probeEndpoint(
      'coverage',
      'Coverage',
      'GET',
      '/api/v2/log-sources',
      () => client.getLogSources(),
      (value) => `${value.length} log sources`,
    ),
    probeEndpoint(
      'detection',
      'Detection',
      'POST',
      '/api/v2/alerts',
      () => client.getAlerts(),
      (value) => `${countResponseItems(value)} alerts`,
    ),
    probeEndpoint(
      'response',
      'Response',
      'GET',
      '/api/v2/alerts/profile',
      () => client.getAlertProfiles(),
      (value) => `${value.length} alert profiles`,
    ),
  ]);

  const diagnostics = {
    health: logFieldsResult.diagnostic,
    coverage: logSourcesResult.diagnostic,
    detection: alertsResult.diagnostic,
    response: alertProfilesResult.diagnostic,
  } satisfies Record<Log360MetricKey, Log360EndpointDiagnostic>;

  const totals = {
    logFields: logFieldsResult.value?.length ?? 0,
    logSources: logSourcesResult.value?.length ?? 0,
    alerts: countResponseItems(alertsResult.value),
    alertProfiles: alertProfilesResult.value?.length ?? 0,
  };

  const breakdown = buildMetricBreakdown(totals, diagnostics);
  const overall = Math.round(
    Object.values(breakdown).reduce((sum, item) => sum + item.score * item.weight, 0),
  );

  const failures = Object.values(diagnostics).filter((diagnostic) => !diagnostic.ok);
  const configured = failures.length !== 4 || failures.some((failure) => failure.failureCategory !== 'Not configured');

  return {
    configured,
    ok: failures.length === 0,
    fetchedAt: new Date().toISOString(),
    totals,
    score: {
      overall,
      band: getBand(overall),
      breakdown,
    },
    diagnostics: Object.values(diagnostics),
    errors: failures.map((diagnostic) => {
      const status = diagnostic.status ? `${diagnostic.status} ` : '';
      return `${diagnostic.method} ${diagnostic.logicalPath} → ${status}${diagnostic.errorMessage ?? diagnostic.failureCategory ?? 'Request failed'}`;
    }),
  };
}
