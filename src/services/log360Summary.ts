import type { Evidence, EndpointSyncResult } from './evidenceCollector';

export type Log360MetricStatus = 'success' | 'failed' | 'not_available' | 'not_collected';

export interface Log360Metric {
  key: 'health' | 'coverage' | 'detection' | 'response' | 'retention';
  label: string;
  status: Log360MetricStatus;
  value: number | null;
  note: string;
}

export interface Log360ScoreSummary {
  metrics: Log360Metric[];
  overall: number | null;
  basedOn: number;
  totalInputs: number;
  unavailableLabels: string[];
  band: 'compliant' | 'attention' | 'at-risk' | null;
}

const CORE_HEALTH_ENDPOINT_KEYS = ['logSources', 'agents', 'reportProfiles', 'incidents', 'alerts'] as const;

function endpointFailureMetric(
  key: Log360Metric['key'],
  label: string,
  endpoint: EndpointSyncResult,
): Log360Metric {
  if (endpoint.unavailableOnBuild) {
    return {
      key,
      label,
      status: 'not_available',
      value: null,
      note: 'Not available on this Log360 build',
    };
  }

  return {
    key,
    label,
    status: 'failed',
    value: null,
    note: `Failed: ${endpoint.statusText}${endpoint.reason ? ` ${endpoint.reason}` : ''}`,
  };
}

function notCollectedMetric(key: Log360Metric['key'], label: string): Log360Metric {
  return {
    key,
    label,
    status: 'not_collected',
    value: null,
    note: 'Not collected yet',
  };
}

function findEndpoint(evidence: Evidence, endpointKey: string): EndpointSyncResult | undefined {
  return evidence.diagnostics.find((entry) => entry.key === endpointKey);
}

function scoreBand(score: number): 'compliant' | 'attention' | 'at-risk' {
  if (score >= 80) return 'compliant';
  if (score >= 60) return 'attention';
  return 'at-risk';
}

export function summarizeLog360Evidence(evidence: Evidence | null): Log360ScoreSummary {
  if (!evidence) {
    const metrics: Log360Metric[] = [
      notCollectedMetric('health', 'Health'),
      notCollectedMetric('coverage', 'Coverage'),
      notCollectedMetric('detection', 'Detection'),
      notCollectedMetric('response', 'Response'),
      notCollectedMetric('retention', 'Retention'),
    ];

    return {
      metrics,
      overall: null,
      basedOn: 0,
      totalInputs: 5,
      unavailableLabels: metrics.map((metric) => metric.label),
      band: null,
    };
  }

  const coreEndpoints = evidence.diagnostics.filter((entry) => CORE_HEALTH_ENDPOINT_KEYS.includes(entry.key as (typeof CORE_HEALTH_ENDPOINT_KEYS)[number]));
  const successfulCore = coreEndpoints.filter((entry) => entry.ok).length;
  const healthMetric: Log360Metric = {
    key: 'health',
    label: 'Health',
    status: coreEndpoints.length > 0 ? 'success' : 'not_collected',
    value: coreEndpoints.length > 0 ? Math.round((successfulCore / coreEndpoints.length) * 100) : null,
    note: coreEndpoints.length > 0
      ? `${successfulCore} of ${coreEndpoints.length} core endpoints succeeded`
      : 'Not collected yet',
  };

  const coverageEndpoint = findEndpoint(evidence, 'logSources');
  const coverageMetric = !coverageEndpoint
    ? notCollectedMetric('coverage', 'Coverage')
    : !coverageEndpoint.ok
      ? endpointFailureMetric('coverage', 'Coverage', coverageEndpoint)
      : (() => {
        const total = evidence.logSources.count;
        const online = evidence.logSources.items.filter((source) => {
          const status = String(source.status ?? '').toLowerCase();
          return status === 'online' || status === 'healthy' || status === 'active';
        }).length;

        return {
          key: 'coverage',
          label: 'Coverage',
          status: 'success',
          value: total > 0 ? Math.round((online / total) * 100) : 0,
          note: total > 0 ? `${online}/${total} sources online` : '0 sources discovered',
        } as Log360Metric;
      })();

  const detectionEndpoint = findEndpoint(evidence, 'alerts');
  const detectionMetric = !detectionEndpoint
    ? notCollectedMetric('detection', 'Detection')
    : !detectionEndpoint.ok
      ? endpointFailureMetric('detection', 'Detection', detectionEndpoint)
      : {
        key: 'detection',
        label: 'Detection',
        status: 'success',
        value: Math.min(100, Math.round((Math.min(evidence.alerts.total, 20) / 20) * 100)),
        note: `${evidence.alerts.total} alerts in latest sync`,
      } as Log360Metric;

  const responseEndpoint = findEndpoint(evidence, 'incidents');
  const responseMetric = !responseEndpoint
    ? notCollectedMetric('response', 'Response')
    : !responseEndpoint.ok
      ? endpointFailureMetric('response', 'Response', responseEndpoint)
      : {
        key: 'response',
        label: 'Response',
        status: 'success',
        value: evidence.incidents.total > 0
          ? Math.round((evidence.incidents.closed / evidence.incidents.total) * 100)
          : 0,
        note: evidence.incidents.total > 0
          ? `${evidence.incidents.closed}/${evidence.incidents.total} incidents closed`
          : '0 incidents in latest sync',
      } as Log360Metric;

  const retentionMetric = notCollectedMetric('retention', 'Retention');

  const metrics = [
    healthMetric,
    coverageMetric,
    detectionMetric,
    responseMetric,
    retentionMetric,
  ];

  const successfulMetrics = metrics.filter((metric) => metric.status === 'success' && typeof metric.value === 'number');
  const basedOn = successfulMetrics.length;
  const overall = basedOn > 0
    ? Math.round(successfulMetrics.reduce((sum, metric) => sum + (metric.value ?? 0), 0) / basedOn)
    : null;

  const unavailableLabels = metrics
    .filter((metric) => metric.status !== 'success')
    .map((metric) => metric.label);

  return {
    metrics,
    overall,
    basedOn,
    totalInputs: metrics.length,
    unavailableLabels,
    band: overall === null ? null : scoreBand(overall),
  };
}
