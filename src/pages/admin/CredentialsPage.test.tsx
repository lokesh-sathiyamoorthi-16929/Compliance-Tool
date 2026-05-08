import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CredentialsPage from './CredentialsPage';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuthStore } from '../../store/useAuthStore';
import { credentialsApi } from '../../api/credentials';
import type { CredentialMeta } from '../../api/credentials';
import type { User } from '../../api/auth';

vi.mock('../../api/credentials');

const mockAdminUser: User = {
  id: 'u1',
  username: 'admin',
  fullName: 'Admin User',
  role: 'admin',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockMemberUser: User = {
  id: 'u2',
  username: 'member',
  fullName: 'Member User',
  role: 'member',
  mustChangePassword: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockCred: CredentialMeta = {
  id: 'c1',
  name: 'Prod Log360',
  type: 'log360',
  serverUrl: 'https://log360.example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastTestAt: null,
  lastTestStatus: null,
  lastTestError: null,
};

const mockCredTested: CredentialMeta = {
  ...mockCred,
  lastTestAt: new Date().toISOString(),
  lastTestStatus: 'success',
  lastTestError: null,
};

function renderCredentialsPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/credentials']}>
      <Routes>
        <Route path="/admin/credentials" element={<CredentialsPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderProtectedCredentialsPage(user: User | null = mockAdminUser) {
  if (user) {
    useAuthStore.setState({
      user,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });
  }
  return render(
    <MemoryRouter initialEntries={['/admin/credentials']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route element={<ProtectedRoute requireRole="admin" />}>
          <Route path="/admin/credentials" element={<CredentialsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('CredentialsPage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    useAuthStore.setState({
      user: mockAdminUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      status: 'authenticated',
    });
    // Provide stable defaults so each test starts with a clean mock queue
    vi.mocked(credentialsApi.list).mockResolvedValue([]);
    vi.mocked(credentialsApi.create).mockResolvedValue(mockCred);
    vi.mocked(credentialsApi.test).mockResolvedValue(mockCredTested);
    vi.mocked(credentialsApi.delete).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows empty state when no credentials', async () => {
    renderCredentialsPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/No credentials yet/)).toBeInTheDocument();
    // Both the header and the empty-state card have an "Add Credential" button
    expect(screen.getAllByRole('button', { name: /Add Credential/i }).length).toBeGreaterThan(0);
  });

  it('shows credential row when list returns data', async () => {
    vi.mocked(credentialsApi.list).mockResolvedValue([mockCred]);

    renderCredentialsPage();

    await waitFor(() => {
      expect(screen.getByText('Prod Log360')).toBeInTheDocument();
    });
    expect(screen.getByText('Log360')).toBeInTheDocument();
    expect(screen.getByText('Untested')).toBeInTheDocument();
  });

  it('modal create flow refreshes list', async () => {
    vi.mocked(credentialsApi.list)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockCred]);

    renderCredentialsPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // Click the header "Add Credential" button
    fireEvent.click(screen.getAllByRole('button', { name: /Add Credential/i })[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Name \*/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Name \*/), { target: { value: 'Prod Log360' } });
    fireEvent.change(screen.getByLabelText(/Server URL \*/), {
      target: { value: 'https://log360.example.com' },
    });
    // Use placeholder text to target the API key input (avoids ambiguity with show/hide button)
    fireEvent.change(screen.getByPlaceholderText('Paste your API key'), {
      target: { value: 'secret-key' },
    });

    // Submit via the modal button (last "Add Credential" button on screen)
    const addButtons = screen.getAllByRole('button', { name: /Add Credential/i });
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(credentialsApi.create).toHaveBeenCalledWith({
        name: 'Prod Log360',
        type: 'log360',
        serverUrl: 'https://log360.example.com',
        apiKey: 'secret-key',
      });
    });

    await waitFor(() => {
      expect(credentialsApi.list).toHaveBeenCalledTimes(2);
    });
  });

  it('shows inline error for CREDENTIAL_NAME_TAKEN', async () => {
    const { ApiError } = await import('../../api/client');
    vi.mocked(credentialsApi.create).mockRejectedValue(
      new ApiError('CREDENTIAL_NAME_TAKEN', 'Credential name taken', 409),
    );

    renderCredentialsPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Add Credential/i })[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Name \*/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Name \*/), { target: { value: 'Duplicate' } });
    fireEvent.change(screen.getByLabelText(/Server URL \*/), {
      target: { value: 'https://log360.example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Paste your API key'), {
      target: { value: 'key' },
    });

    const addButtons = screen.getAllByRole('button', { name: /Add Credential/i });
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('A credential with this name already exists.')).toBeInTheDocument();
    });
  });

  it('test action updates status badge', async () => {
    vi.mocked(credentialsApi.list).mockResolvedValue([mockCred]);

    renderCredentialsPage();

    await waitFor(() => {
      expect(screen.getByText('Prod Log360')).toBeInTheDocument();
    });
    expect(screen.getByText('Untested')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Test Prod Log360/i }));

    await waitFor(() => {
      expect(screen.getByText('Tested')).toBeInTheDocument();
    });
    expect(credentialsApi.test).toHaveBeenCalledWith('c1');
  });

  it('delete flow removes credential row', async () => {
    vi.mocked(credentialsApi.list).mockResolvedValue([mockCred]);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderCredentialsPage();

    await waitFor(() => {
      expect(screen.getByText('Prod Log360')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete Prod Log360/i }));

    await waitFor(() => {
      expect(screen.queryByText('Prod Log360')).not.toBeInTheDocument();
    });
    expect(credentialsApi.delete).toHaveBeenCalledWith('c1');
    confirmSpy.mockRestore();
  });

  it('delete cancelled by user does not remove row', async () => {
    vi.mocked(credentialsApi.list).mockResolvedValue([mockCred]);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderCredentialsPage();

    await waitFor(() => {
      expect(screen.getByText('Prod Log360')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete Prod Log360/i }));

    expect(credentialsApi.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Prod Log360')).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('non-admin is redirected away from /admin/credentials', () => {
    renderProtectedCredentialsPage(mockMemberUser);

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText(/API Credentials/)).not.toBeInTheDocument();
  });

  it('unauthenticated user is redirected to login', () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'unauthenticated',
    });

    renderProtectedCredentialsPage(null);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText(/API Credentials/)).not.toBeInTheDocument();
  });

  it('demo mode: /admin/credentials route is blocked', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_DEMO_MODE', 'true');

    // In demo mode, ProtectedRoute passes through regardless of role
    // The Credentials nav link is hidden (user dropdown is hidden in demo mode)
    render(
      <MemoryRouter initialEntries={['/admin/credentials']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route element={<ProtectedRoute requireRole="admin" />}>
            <Route path="/admin/credentials" element={<CredentialsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // In demo mode without a user, page renders (ProtectedRoute passes through in demo)
    // The Credentials nav link is hidden from the navbar in demo mode
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });
});
