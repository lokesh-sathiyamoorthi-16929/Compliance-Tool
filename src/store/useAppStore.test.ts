import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore ad360 connection state', () => {
  beforeEach(() => {
    useAppStore.setState({
      connections: {
        log360: {
          connected: false,
          serverUrl: '',
          connectedAt: null,
          lastSync: null,
          testing: false,
          lastConnectionLatencyMs: undefined,
          lastError: null,
        },
        ad360: {
          connected: false,
          serverUrl: '',
          connectedAt: null,
          lastSync: null,
          testing: false,
          lastConnectionLatencyMs: undefined,
          lastError: null,
        },
      },
      ad360Summary: null,
    });
  });

  it('round-trips ad360 connection updates and resets on disconnect', () => {
    useAppStore.getState().updateConnection('ad360', {
      connected: true,
      serverUrl: 'http://admanagerplus:8080',
      lastSync: '2026-05-11T00:00:00.000Z',
      lastError: null,
    });
    useAppStore.getState().setAd360Summary({
      users: { total: 10, disabled: 1, lockedOut: 0 },
      privilegedUsers: { count: 1, samNames: ['admin'] },
      staleAccounts: { count: 0, samNames: [] },
      computers: { total: 5, bitlockerEnabledPct: 80 },
    });

    const updated = useAppStore.getState();
    expect(updated.connections.ad360.connected).toBe(true);
    expect(updated.connections.ad360.serverUrl).toBe('http://admanagerplus:8080');
    expect(updated.ad360Summary?.users.total).toBe(10);

    useAppStore.getState().disconnectProduct('ad360');

    const reset = useAppStore.getState();
    expect(reset.connections.ad360.connected).toBe(false);
    expect(reset.connections.ad360.serverUrl).toBe('');
    expect(reset.ad360Summary).toBeNull();
  });
});
