import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Evidence } from '../services/evidenceCollector';

vi.mock('../hooks/useLog360Evidence', () => ({
  useLog360Evidence: () => ({
    overview: null,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

const adminUser = {
  id: 'u1',
  username: 'admin',
  fullName: 'Admin User',
  role: 'admin' as const,
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeEvidence(): Evidence {
  return {
    logSources: { count: 12, byType: { windows: 8, firewall: 4 }, names: ['Host-1'], items: [] },
    agents: { total: 10, healthy: 9, unhealthy: ['Host-2'], items: [] },
    logSourceGroups: [],
    reportProfiles: { byUniqueKey: {}, all: [] },
    recentReportSamples: {},
    incidents: { total: 5, open: 1, closed: 4, bySeverity: { high: 1 }, items: [] },
    alerts: { total: 7 },
    collectedAt: '2026-05-10T00:00:00.000Z',
    partialSuccess: false,
    errors: {},
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage merged scoring and raw-data UI', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    useAuthStore.setState({
      user: adminUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });
    useAppStore.setState({
      selectedFrameworkId: 'hipaa',
      connections: {
        log360: {
          connected: true,
          serverUrl: 'http://log360.example.com:8095',
          connectedAt: '2026-05-10T00:00:00.000Z',
          lastSync: '2026-05-10T00:00:00.000Z',
          testing: false,
          lastConnectionLatencyMs: 120,
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
      log360Evidence: makeEvidence(),
      attestations: {},
      evidenceErrors: {},
      evidenceLoading: {},
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows the HIPAA PRISMA rubric badge with the raw data toggle and no demo banner in connected mode', () => {
    renderPage();

    expect(screen.getByText('PRISMA')).toBeInTheDocument();
    expect(screen.getByText(/NIST Tier/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /🔍 View raw Log360 data/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Demo mode:/i)).not.toBeInTheDocument();
  });

  it('shows the ISO CMMI rubric badge with the raw data toggle', () => {
    useAppStore.setState({ selectedFrameworkId: 'iso27001' });

    renderPage();

    expect(screen.getByText('CMMI')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /🔍 View raw Log360 data/i }).length).toBeGreaterThan(0);
  });
});
