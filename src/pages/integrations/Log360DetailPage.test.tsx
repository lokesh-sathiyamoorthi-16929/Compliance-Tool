import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Log360DetailPage from './Log360DetailPage';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import type { User } from '../../api/auth';
import * as apiClient from '../../api/client';

vi.mock('../../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof apiClient>();
  return {
    ...original,
    apiRequest: vi.fn(),
  };
});

const apiRequestMock = vi.mocked(apiClient.apiRequest);

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

function renderPage() {
  return render(
    <MemoryRouter>
      <Log360DetailPage />
    </MemoryRouter>,
  );
}

describe('Log360DetailPage', () => {
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
          serverUrl: 'http://log360.example.com:8095',
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
    });
    apiRequestMock.mockImplementation(async (path) => {
      switch (path) {
        case '/integrations/log360/proxy/api/v2/meta/log-fields':
          return { response: { log_fields: [{ field_name: 'host' }, { field_name: 'source' }] } };
        case '/integrations/log360/proxy/api/v2/log-sources':
          return { response: [{ id: 's1', name: 'Collector-1' }, { id: 's2', name: 'Collector-2' }, { id: 's3', name: 'Collector-3' }] };
        case '/integrations/log360/proxy/api/v2/alerts':
          return { response: [{ id: 'a1' }, { id: 'a2' }] };
        case '/integrations/log360/proxy/api/v2/alerts/profile':
          return { response: [{ profile_id: 'p1' }] };
        default:
          throw new Error(`Unexpected path: ${String(path)}`);
      }
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('renders four proxy-backed metric tiles and does not call legacy endpoints or polling timers', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Log360 Compliance')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Health').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Coverage').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Detection').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Response').length).toBeGreaterThan(0);
    expect(screen.getByText('Log fields')).toBeInTheDocument();
    expect(screen.getByText('Log sources')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Alert profiles')).toBeInTheDocument();
    expect(screen.getAllByText('200 OK')).toHaveLength(4);

    const paths = apiRequestMock.mock.calls.map(([path]) => String(path));
    expect(paths).toHaveLength(4);
    expect(paths.every((path) => path.startsWith('/integrations/log360/proxy/api/v2/'))).toBe(true);
    expect(paths.every((path) => !path.includes(['/integrations/log360/', 'summary'].join('')))).toBe(true);
    expect(paths.every((path) => !path.includes(['/integrations/log360/', 'health'].join('')))).toBe(true);
    expect(apiRequestMock.mock.calls.filter(([path]) => path === '/integrations/log360/proxy/api/v2/meta/log-fields')).toHaveLength(1);
    expect(apiRequestMock.mock.calls.filter(([path]) => path === '/integrations/log360/proxy/api/v2/log-sources')).toHaveLength(1);
    expect(apiRequestMock.mock.calls.filter(([path]) => path === '/integrations/log360/proxy/api/v2/alerts')).toHaveLength(1);
    expect(apiRequestMock.mock.calls.filter(([path]) => path === '/integrations/log360/proxy/api/v2/alerts/profile')).toHaveLength(1);
  });

  it('shows a partial-failure banner from real endpoint diagnostics', async () => {
    apiRequestMock.mockImplementation(async (path) => {
      if (path === '/integrations/log360/proxy/api/v2/alerts/profile') {
        throw new apiClient.ApiError('UNAUTHORIZED', 'Your ComplianceIQ session expired. Please log in again.', 401);
      }

      if (path === '/integrations/log360/proxy/api/v2/meta/log-fields') {
        return { response: { log_fields: [{ field_name: 'host' }] } };
      }

      if (path === '/integrations/log360/proxy/api/v2/log-sources') {
        return { response: [{ id: 's1', name: 'Collector-1' }] };
      }

      if (path === '/integrations/log360/proxy/api/v2/alerts') {
        return { response: [{ id: 'a1' }] };
      }

      throw new Error(`Unexpected path: ${String(path)}`);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('1 of 4 Log360 endpoint checks failed.')).toBeInTheDocument();
    });

    expect(screen.getByText(/Response: Your ComplianceIQ session expired/i)).toBeInTheDocument();
    expect(screen.queryByText('Log360 endpoint not found')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View endpoint diagnostics' })).toHaveAttribute('href', '#endpoint-diagnostics');
  });

  it('renders no credential configured state when proxy calls report not configured', async () => {
    apiRequestMock.mockRejectedValue(
      new apiClient.ApiError('LOG360_NOT_CONFIGURED', 'No credentials configured.', 409),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No Log360 credential configured. Add one in Admin → Credentials.')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Go to Credentials' })).toHaveAttribute('href', '/admin/credentials');
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
