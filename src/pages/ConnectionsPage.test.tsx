import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup } from '@testing-library/react';
import ConnectionsPage from './ConnectionsPage';
import * as integrations from '../api/integrations';
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
const healthOk: integrations.Log360Health = { configured: true, ok: true, latencyMs: 42 };
const healthFailed: integrations.Log360Health = {
  configured: true,
  ok: false,
  status: 401,
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
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('shows loading state on mount, then not-configured form when credentials absent', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(notConfiguredCreds);

    renderPage();

    expect(screen.getByText('Loading connection status…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText('Server URL')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Auth Token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.queryByText(/use proxy/i)).not.toBeInTheDocument();
  });

  it('save flow calls PUT credentials with correct body and clears token field', async () => {
    vi.mocked(integrations.log360CredentialsApi.get)
      .mockResolvedValueOnce(notConfiguredCreds)
      .mockResolvedValueOnce(configuredCreds);
    vi.mocked(integrations.log360CredentialsApi.save).mockResolvedValue(undefined);
    vi.mocked(integrations.log360Api.health).mockResolvedValue(healthOk);

    renderPage();

    await waitFor(() => screen.getByLabelText('Server URL'));

    fireEvent.change(screen.getByLabelText('Server URL'), {
      target: { value: 'http://log360.example.com:8095' },
    });
    fireEvent.change(screen.getByLabelText('Auth Token'), {
      target: { value: 'super-secret-token' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

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
    vi.mocked(integrations.log360Api.health).mockResolvedValue(healthOk);

    renderPage();

    await waitFor(() => screen.getByLabelText('Server URL'));

    fireEvent.change(screen.getByLabelText('Server URL'), {
      target: { value: 'http://log360.example.com:8095' },
    });
    fireEvent.change(screen.getByLabelText('Auth Token'), {
      target: { value: 'super-secret-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(integrations.log360CredentialsApi.save).toHaveBeenCalled());

    // The old localStorage key must not be set
    expect(localStorage.getItem('complianceiq-log360-connection')).toBeNull();
  });

  it('shows connected state with latency and token masked when health ok', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(configuredCreds);
    vi.mocked(integrations.log360Api.health).mockResolvedValue(healthOk);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Connected to Log360')).toBeInTheDocument();
    });
    expect(screen.getByText(/log360.example.com:8095/)).toBeInTheDocument();
    // Token is masked — check the mask and server-side note separately
    expect(screen.getByText('•••••')).toBeInTheDocument();
    expect(screen.getByText('(stored on server)')).toBeInTheDocument();
    expect(screen.getByText(/42ms/)).toBeInTheDocument();
  });

  it('shows failed state with error message when health not ok', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(configuredCreds);
    vi.mocked(integrations.log360Api.health).mockResolvedValue(healthFailed);

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
    vi.mocked(integrations.log360Api.health).mockResolvedValue(healthOk);
    vi.mocked(integrations.log360CredentialsApi.delete).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => screen.getByText('Connected to Log360'));

    fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));

    await waitFor(() => {
      expect(integrations.log360CredentialsApi.delete).toHaveBeenCalledTimes(1);
    });

    // After disconnect, form returns to not-configured state
    await waitFor(() => {
      expect(screen.getByLabelText('Server URL')).toBeInTheDocument();
    });
  });

  it('shows Replace token form when "Replace token" is clicked', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(configuredCreds);
    vi.mocked(integrations.log360Api.health).mockResolvedValue(healthOk);

    renderPage();

    await waitFor(() => screen.getByText('Connected to Log360'));

    fireEvent.click(screen.getByRole('button', { name: /replace token/i }));

    expect(screen.getByLabelText('Auth Token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('"Use proxy" checkbox is absent', async () => {
    vi.mocked(integrations.log360CredentialsApi.get).mockResolvedValue(notConfiguredCreds);

    renderPage();

    await waitFor(() => screen.getByLabelText('Server URL'));

    expect(screen.queryByText(/use proxy/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
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
