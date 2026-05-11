import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup } from '@testing-library/react';
import ConnectionsPage from './ConnectionsPage';
import * as integrations from '../api/integrations';
import { Log360Client } from '../services/log360Client';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import type { User } from '../api/auth';

vi.mock('../api/integrations');

const adminUser: User = {
  id: 'u1',
  username: 'admin',
  fullName: 'Admin User',
  role: 'admin',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const notConfiguredCreds: integrations.Log360Credentials = { configured: false, hasToken: false };
const configuredCreds: integrations.Log360Credentials = {
  configured: true,
  baseUrl: 'http://log360.example.com:8095',
  hasToken: true,
  updatedAt: '2026-05-10T00:00:00.000Z',
};
const adNotConfiguredCreds: integrations.Ad360Credentials = {
  configured: false,
  hasToken: false,
  useProxy: true,
};
const connectionOk = { success: true, latencyMs: 42, fieldCount: 12 };
const connectionFailed = {
  success: false,
  latencyMs: 100,
  error: 'Token rejected',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ConnectionsPage />
    </MemoryRouter>,
  );
}

describe('ConnectionsPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    useAuthStore.setState({
      user: adminUser,
      accessToken: 'jwt-token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });
    // Reset app store connections
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
    });
    localStorage.clear();
    vi.mocked(integrations.ad360CredentialsApi.get).mockResolvedValue(adNotConfiguredCreds);
    vi.mocked(integrations.ad360CredentialsApi.save).mockResolvedValue(undefined);
    vi.mocked(integrations.ad360CredentialsApi.delete).mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('shows loading state on mount, then not-configured form when credentials absent', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(notConfiguredCreds);

    renderPage();

    expect(screen.getAllByText('Loading connection status…').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Server URL').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByLabelText('Auth Token').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /save/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/Use Proxy/i)).toBeInTheDocument();
  });

  it('save flow calls PUT credentials with correct body and clears token field', async () => {
    vi.mocked(integrations.log360CredentialsApi.get)
      .mockResolvedValueOnce(notConfiguredCreds)
      .mockResolvedValueOnce(configuredCreds);
    vi.mocked(integrations.log360CredentialsApi.save).mockResolvedValue(undefined);
    vi.spyOn(Log360Client.prototype, 'testConnection').mockResolvedValue(connectionOk);

    renderPage();

    await waitFor(() => expect(screen.getAllByLabelText('Server URL').length).toBeGreaterThan(0));

    fireEvent.change(screen.getAllByLabelText('Server URL')[0], {
      target: { value: 'http://log360.example.com:8095' },
    });
    fireEvent.change(screen.getAllByLabelText('Auth Token')[0], {
      target: { value: 'super-secret-token' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: /save/i })[0]);

    await waitFor(() => {
      expect(integrations.log360CredentialsApi.save).toHaveBeenCalledWith({
        baseUrl: 'http://log360.example.com:8095',
        authToken: 'super-secret-token',
      });
    });

    // After save, credentials are re-fetched
    await waitFor(() => {
      expect(integrations.log360CredentialsApi.get).toHaveBeenCalledTimes(2);
    });

    // Token field is cleared — no token value visible
    expect(screen.queryByDisplayValue('super-secret-token')).not.toBeInTheDocument();
  });

  it('token is never persisted to localStorage', async () => {
    vi.mocked(integrations.log360CredentialsApi.get)
      .mockResolvedValueOnce(notConfiguredCreds)
      .mockResolvedValueOnce(configuredCreds);
    vi.mocked(integrations.log360CredentialsApi.save).mockResolvedValue(undefined);
    vi.spyOn(Log360Client.prototype, 'testConnection').mockResolvedValue(connectionOk);

    renderPage();

    await waitFor(() => expect(screen.getAllByLabelText('Server URL').length).toBeGreaterThan(0));

    fireEvent.change(screen.getAllByLabelText('Server URL')[0], {
      target: { value: 'http://log360.example.com:8095' },
    });
    fireEvent.change(screen.getAllByLabelText('Auth Token')[0], {
      target: { value: 'super-secret-token' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: /save/i })[0]);

    await waitFor(() => expect(integrations.log360CredentialsApi.save).toHaveBeenCalled());

    // The old localStorage key must not be set
    expect(localStorage.getItem('complianceiq-log360-connection')).toBeNull();
  });

  it('shows connected state with latency and token masked when health ok', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(configuredCreds);
    vi.spyOn(Log360Client.prototype, 'testConnection').mockResolvedValue(connectionOk);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Connected to Log360')).toBeInTheDocument();
    });
    expect(screen.getByText(/log360.example.com:8095/)).toBeInTheDocument();
    // Token is masked — check the mask and server-side note separately
    expect(screen.getByText('•••••')).toBeInTheDocument();
    expect(screen.getByText('(stored on server)')).toBeInTheDocument();
    expect(screen.getByText(/42ms/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows failed state with error message when health not ok', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(configuredCreds);
    vi.spyOn(Log360Client.prototype, 'testConnection').mockResolvedValue(connectionFailed);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Connection Failed')).toBeInTheDocument();
    });
    expect(screen.getByText(/Token rejected/)).toBeInTheDocument();
    expect(screen.getByText('•••••')).toBeInTheDocument();
    expect(screen.getByText('(stored on server)')).toBeInTheDocument();
  });

  it('disconnect flow calls DELETE credentials and resets UI', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(configuredCreds);
    vi.spyOn(Log360Client.prototype, 'testConnection').mockResolvedValue(connectionOk);
    vi.mocked(integrations.log360CredentialsApi.delete).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => screen.getByText('Connected to Log360'));

    fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));

    await waitFor(() => {
      expect(integrations.log360CredentialsApi.delete).toHaveBeenCalledTimes(1);
    });

    // After disconnect, form returns to not-configured state
    await waitFor(() => {
      expect(screen.getAllByLabelText('Server URL').length).toBeGreaterThan(0);
    });
  });

  it('shows Replace token form when "Replace token" is clicked', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(configuredCreds);
    vi.spyOn(Log360Client.prototype, 'testConnection').mockResolvedValue(connectionOk);

    renderPage();

    await waitFor(() => screen.getByText('Connected to Log360'));

    fireEvent.click(screen.getByRole('button', { name: /replace token/i }));

    expect(screen.getAllByLabelText('Auth Token').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows AD360 use proxy checkbox', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(notConfiguredCreds);

    renderPage();

    await waitFor(() => expect(screen.getAllByLabelText('Server URL').length).toBeGreaterThan(0));

    expect(screen.getByText(/use proxy/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});

describe('App migration', () => {
  it('removes the old localStorage key on mount', async () => {
    localStorage.setItem('complianceiq-log360-connection', JSON.stringify({ baseUrl: 'x', token: 'y' }));

    const { default: App } = await import('../App');
    render(
      <App />,
    );

    await waitFor(() => {
      expect(localStorage.getItem('complianceiq-log360-connection')).toBeNull();
    });
  });
});
