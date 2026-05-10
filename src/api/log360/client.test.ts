import { describe, expect, it } from 'vitest';
import { createLog360Api, getLog360DebugCalls } from './index';

describe('log360 api (mock mode)', () => {
  it('returns fixture-backed metadata users and records debug calls when unconfigured', async () => {
    const api = createLog360Api();
    const user = await api.metadata.getCurrentUser();

    expect(user?.username).toBe('admin');

    const debug = getLog360DebugCalls();
    expect(debug.length).toBeGreaterThan(0);
    expect(debug[0].path).toContain('/api/v2/metadata/users');
  });

  it('loads fixture data for core KPI endpoints', async () => {
    const api = createLog360Api();
    const [sources, agents, incidents, alerts, profiles] = await Promise.all([
      api.logSources.list({ limit: 1 }),
      api.logSources.listAgents(),
      api.incidents.list({ limit: 10 }),
      api.alerts.list({ limit: 10 }),
      api.reports.listProfiles({ limit: 10 }),
    ]);

    expect(sources.total).toBeGreaterThan(0);
    expect(agents.length).toBeGreaterThan(0);
    expect(incidents.total).toBeGreaterThan(0);
    expect(alerts.total).toBeGreaterThan(0);
    expect(profiles.length).toBeGreaterThan(0);
  });
});
