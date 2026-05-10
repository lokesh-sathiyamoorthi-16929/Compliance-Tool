import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Log360DetailPage from './Log360DetailPage';
import { log360Api } from '../../api/integrations';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../../api/auth';
import type { Log360Health, Log360Summary } from '../../api/integrations';

vi.mock('../../api/integrations');

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

const sampleHealth: Log360Health = {
  configured: true,
  ok: true,
  productVersion: '3.2.1',
  user: 'svc-log360',
};

const sampleSummary: Log360Summary = {
  configured: true,
  ok: true,
  productVersion: '3.2.1',
  fetchedAt: '2026-05-08T00:00:00.000Z',
  sources: {
    total: 10,
    online: 8,
    offline: 1,
    unknown: 1,
    samples: [
      { id: 's1', name: 'Collector-1', status: 'online', lastSeenAt: '2026-05-08T12:00:00.000Z' },
    ],
  },
  alerts: {
    total: 30,
    open: 4,
    closed: 26,
    bySeverity: { high: 2, medium: 5, low: 10 },
    samples: [
      {
        id: 'a1',
        title: 'Suspicious login',
        severity: 'high',
        status: 'open',
        createdAt: '2026-05-08T13:00:00.000Z',
      },
    ],
  },
  score: {
    overall: 91,
    band: 'compliant',
    breakdown: {
      health: { score: 92, weight: 0.25, reason: 'Healthy' },
      coverage: { score: 89, weight: 0.25, reason: 'Good coverage' },
      detection: { score: 95, weight: 0.25, reason: 'Strong detection' },
      response: { score: 90, weight: 0.25, reason: 'Prompt response' },
    },
  },
  errors: ['Alerts sample timeout'],
};

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
    vi.mocked(log360Api.health).mockResolvedValue(sampleHealth);
    vi.mocked(log360Api.summary).mockResolvedValue(sampleSummary);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders all sections from summary data', async () => {
    render(
      <MemoryRouter>
        <Log360DetailPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Log360 Compliance')).toBeInTheDocument();
    });

    expect(screen.getByText('✅ Connected v3.2.1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Score' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alerts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Non-fatal errors' })).toBeInTheDocument();
    expect(screen.queryByText(/Retention/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Archive (enabled|disabled)/i)).not.toBeInTheDocument();
    expect(screen.getByText('Collector-1')).toBeInTheDocument();
    expect(screen.getByText('Suspicious login')).toBeInTheDocument();
  });

  it('uses four score inputs with normalized weights summing to 1.0 and no retention key', () => {
    const keys = Object.keys(sampleSummary.score.breakdown);
    expect(keys).toEqual(['health', 'coverage', 'detection', 'response']);
    expect(keys).not.toContain('retention');

    const weightTotal = Object.values(sampleSummary.score.breakdown).reduce((sum, item) => sum + item.weight, 0);
    expect(weightTotal).toBe(1);
  });

  it('renders no credential configured state', async () => {
    vi.mocked(log360Api.summary).mockResolvedValue({
      ...sampleSummary,
      configured: false,
    });

    render(
      <MemoryRouter>
        <Log360DetailPage />
      </MemoryRouter>,
    );

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

  it('shows honest error state without placeholder retention/archive literals', async () => {
    vi.mocked(log360Api.health).mockRejectedValue(new Error('Health unavailable'));
    vi.mocked(log360Api.summary).mockRejectedValue(new Error('Summary unavailable'));

    render(
      <MemoryRouter>
        <Log360DetailPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Log360 Compliance')).toBeInTheDocument();
      expect(screen.getByText('Failed to load Log360 integration details.')).toBeInTheDocument();
    });

    const pageText = document.body.textContent ?? '';
    expect(pageText).not.toContain('180');
    expect(pageText).not.toContain('Archive enabled');
    expect(pageText).not.toContain('Archive disabled');
    expect(pageText).not.toMatch(/Score:\s*[1-9]\d*/i);
  });
});
