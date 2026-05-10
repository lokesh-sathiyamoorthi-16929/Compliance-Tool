import type { Evidence } from '../../../services/evidenceCollector';

export const SAMPLE_LOG360_EVIDENCE: Evidence = {
  logSources: {
    count: 6,
    byType: { windows: 4, firewall: 2 },
    names: ['Sample-DC-01', 'Sample-DC-02', 'Sample-FW-01', 'Sample-FW-02', 'Sample-App-01', 'Sample-App-02'],
    items: [
      { id: 's1', name: 'Sample-DC-01', status: 'online' },
      { id: 's2', name: 'Sample-DC-02', status: 'online' },
      { id: 's3', name: 'Sample-FW-01', status: 'online' },
      { id: 's4', name: 'Sample-FW-02', status: 'offline' },
      { id: 's5', name: 'Sample-App-01', status: 'online' },
      { id: 's6', name: 'Sample-App-02', status: 'online' },
    ],
  },
  agents: {
    total: 4,
    healthy: 3,
    unhealthy: ['Sample-Agent-04'],
    items: [
      { id: 'a1', name: 'Sample-Agent-01', status: 'healthy' },
      { id: 'a2', name: 'Sample-Agent-02', status: 'healthy' },
      { id: 'a3', name: 'Sample-Agent-03', status: 'healthy' },
      { id: 'a4', name: 'Sample-Agent-04', status: 'offline' },
    ],
  },
  logSourceGroups: [
    { name: 'Sample Servers', memberCount: 4 },
    { name: 'Sample Network', memberCount: 2 },
  ],
  reportProfiles: {
    byUniqueKey: {},
    all: [],
  },
  recentReportSamples: {},
  incidents: {
    total: 5,
    open: 2,
    closed: 3,
    bySeverity: { high: 1, medium: 2, low: 2 },
    items: [],
  },
  alerts: {
    total: 9,
  },
  diagnostics: [
    { key: 'logSources', method: 'GET', path: '/api/v2/log-sources', latencyMs: 120, ok: true, statusCode: 200, statusText: '200 OK', summary: '6 log sources' },
    { key: 'agents', method: 'GET', path: '/api/v2/log-sources/agents', latencyMs: 90, ok: true, statusCode: 200, statusText: '200 OK', summary: '4 agents' },
    { key: 'reportProfiles', method: 'POST', path: '/api/v2/report/profiles', latencyMs: 140, ok: true, statusCode: 200, statusText: '200 OK', summary: 'report profiles loaded' },
    { key: 'incidents', method: 'GET', path: '/api/v2/incident?response_type=client', latencyMs: 170, ok: true, statusCode: 200, statusText: '200 OK', summary: '5 incidents' },
    { key: 'alerts', method: 'GET', path: '/api/v2/alerts', latencyMs: 150, ok: true, statusCode: 200, statusText: '200 OK', summary: '9 alerts' },
  ],
  collectedAt: '2026-05-10T00:00:00.000Z',
  partialSuccess: false,
  errors: {},
};
