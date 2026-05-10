import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConnectionsPage from './ConnectionsPage';
import { useAppStore } from '../store/useAppStore';

beforeEach(() => {
  useAppStore.setState({
    connections: {
      log360: {
        connected: false,
        serverUrl: '',
        token: '',
        useProxy: false,
        connectedAt: null,
        lastSync: null,
        testing: false,
        lastConnectionLatencyMs: undefined,
        lastError: null,
      },
      ad360: {
        connected: false,
        serverUrl: '',
        token: '',
        useProxy: false,
        connectedAt: null,
        lastSync: null,
        testing: false,
        lastConnectionLatencyMs: undefined,
        lastError: null,
      },
    },
    log360Evidence: null,
    evidenceLoading: {},
    evidenceErrors: {},
  });
});

describe('ConnectionsPage', () => {
  it('shows bearer-token-only form fields', () => {
    render(
      <MemoryRouter>
        <ConnectionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Server URL')).toBeInTheDocument();
    expect(screen.getByText('Auth Token')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Use proxy' })).toBeInTheDocument();
    expect(screen.queryByText(/Client ID/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Client Secret/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Refresh Token/i)).not.toBeInTheDocument();
  });

  it('renders sync diagnostics panel for most recent evidence sync', () => {
    useAppStore.setState((state) => ({
      ...state,
      connections: {
        ...state.connections,
        log360: {
          ...state.connections.log360,
          connected: true,
          serverUrl: 'http://lokesh-16929-t:8095',
          token: 'token',
        },
      },
      log360Evidence: {
        logSources: { count: 0, byType: {}, names: [], items: [] },
        agents: { total: 0, healthy: 0, unhealthy: [], items: [] },
        logSourceGroups: [],
        reportProfiles: { byUniqueKey: {}, all: [] },
        recentReportSamples: {},
        incidents: { total: 0, open: 0, closed: 0, bySeverity: {}, items: [] },
        alerts: { total: 0 },
        diagnostics: [
          {
            key: 'logSources',
            method: 'GET',
            path: '/api/v2/log-sources',
            latencyMs: 123,
            ok: false,
            statusCode: 0,
            statusText: 'CORS blocked / network error',
            summary: 'Cannot reach host',
            reason: 'Cannot reach host',
            networkError: true,
          },
        ],
        collectedAt: '2026-05-10T00:00:00.000Z',
        partialSuccess: true,
        errors: { logSources: 'Cannot reach host' },
      },
    }));

    render(
      <MemoryRouter>
        <ConnectionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sync Diagnostics (1 endpoints)')).toBeInTheDocument();
    expect(screen.getByText('GET /api/v2/log-sources')).toBeInTheDocument();
    expect(screen.getByText('CORS blocked / network error')).toBeInTheDocument();
  });
});
