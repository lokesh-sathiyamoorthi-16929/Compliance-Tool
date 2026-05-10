import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Log360DetailPage from './Log360DetailPage';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import type { User } from '../../api/auth';
import { SAMPLE_LOG360_EVIDENCE } from '../../api/log360/__fixtures__/sampleEvidence';

const adminUser: User = {
  id: 'u1',
  username: 'admin',
  fullName: 'Admin User',
  role: 'admin',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const memberUser: User = {
  id: 'u2',
  username: 'member',
  fullName: 'Member User',
  role: 'member',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubEnv('VITE_DEMO_MODE', 'false');

  useAuthStore.setState({
    user: adminUser,
    accessToken: 'token',
    refreshToken: 'refresh',
    status: 'authenticated',
  });

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
    evidenceErrors: {},
    evidenceLoading: {},
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Log360DetailPage', () => {
  it('renders disconnected state', () => {
    render(
      <MemoryRouter>
        <Log360DetailPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Log360 is not connected. Add your server URL and auth token in Connections.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Connections' })).toHaveAttribute('href', '/connections');
  });

  it('renders live evidence metrics and endpoint diagnostics', () => {
    useAppStore.setState((state) => ({
      ...state,
      connections: {
        ...state.connections,
        log360: {
          ...state.connections.log360,
          connected: true,
        },
      },
      log360Evidence: {
        ...SAMPLE_LOG360_EVIDENCE,
        diagnostics: [
          ...SAMPLE_LOG360_EVIDENCE.diagnostics,
          {
            key: 'retention-policy',
            method: 'GET',
            path: '/api/v2/retention-policy',
            latencyMs: 33,
            ok: false,
            statusCode: 404,
            statusText: '404 Not Found',
            summary: 'Retention endpoint missing',
            reason: 'not found',
            unavailableOnBuild: true,
          },
        ],
        partialSuccess: true,
      },
    }));

    render(
      <MemoryRouter>
        <Log360DetailPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Log360 Compliance')).toBeInTheDocument();
    expect(screen.getByText('Endpoint diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Score based on 4 of 5 inputs — Retention unavailable.')).toBeInTheDocument();
    expect(screen.getByText('Not collected yet')).toBeInTheDocument();
  });

  it('redirects non-admin away from /integrations/log360', () => {
    useAuthStore.setState({
      user: memberUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });

    render(
      <MemoryRouter initialEntries={['/integrations/log360']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route element={<ProtectedRoute requireRole="admin" />}>
            <Route path="/integrations/log360" element={<Log360DetailPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Log360 Compliance')).not.toBeInTheDocument();
  });
});
