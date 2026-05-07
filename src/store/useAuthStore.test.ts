import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';

function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    status: 'idle',
  });
  window.localStorage.removeItem('complianceiq_auth');
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    resetAuthStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('handles login flow successfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            id: 'u1',
            email: 'user@example.com',
            fullName: 'Demo User',
            role: 'admin',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          accessToken: 'access-1',
          refreshToken: 'refresh-1',
        }),
        { status: 200 },
      ),
    );

    await useAuthStore.getState().login('user@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.email).toBe('user@example.com');
    expect(state.accessToken).toBe('access-1');
    expect(state.refreshToken).toBe('refresh-1');
  });

  it('refreshes token when /me returns 401 during hydrate', async () => {
    useAuthStore.setState({
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch');

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { code: 'UNAUTHORIZED', message: 'Access token expired' },
        }),
        { status: 401 },
      ),
    );

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
        { status: 200 },
      ),
    );

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'u1',
          email: 'user@example.com',
          fullName: 'Demo User',
          role: 'admin',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
        { status: 200 },
      ),
    );

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.accessToken).toBe('new-access-token');
    expect(state.refreshToken).toBe('new-refresh-token');
    expect(state.user?.email).toBe('user@example.com');
  });

  it('hydrates with valid tokens', async () => {
    useAuthStore.setState({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'u2',
          email: 'valid@example.com',
          fullName: 'Valid User',
          role: 'analyst',
          createdAt: '2026-02-01T00:00:00.000Z',
        }),
        { status: 200 },
      ),
    );

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.email).toBe('valid@example.com');
    expect(state.accessToken).toBe('access-token');
  });

  it('clears auth when hydrate fails with invalid tokens', async () => {
    useAuthStore.setState({
      accessToken: 'bad-access',
      refreshToken: 'bad-refresh',
      status: 'idle',
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch');

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { code: 'UNAUTHORIZED', message: 'Invalid access token' },
        }),
        { status: 401 },
      ),
    );

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' },
        }),
        { status: 401 },
      ),
    );

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
