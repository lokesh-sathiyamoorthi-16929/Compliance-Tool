import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import WizardPage from './pages/WizardPage';
import FrameworksPage from './pages/FrameworksPage';
import FrameworkDetailPage from './pages/FrameworkDetailPage';
import ConnectionsPage from './pages/ConnectionsPage';
import DashboardPage from './pages/DashboardPage';
import ComparePage from './pages/ComparePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import UsersPage from './pages/admin/UsersPage';
import CredentialsPage from './pages/admin/CredentialsPage';
import { useAuthStore } from './store/useAuthStore';
import { isDemoMode } from './config/env';
import Log360DetailPage from './pages/integrations/Log360DetailPage';
import AttestationsPage from './pages/AttestationsPage';

export default function App() {
  const basename = import.meta.env.PROD ? '/Compliance-Tool' : '/';
  const status = useAuthStore((state) => state.status);
  const hasPersistedTokens = useAuthStore(
    (state) => Boolean(state.accessToken && state.refreshToken),
  );

  useEffect(() => {
    // One-shot migration: remove the old localStorage key that stored the Log360 token
    // in the browser (MVP-era, now replaced by server-side vault).
    localStorage.removeItem('complianceiq-log360-connection');

    void useAuthStore.getState().hydrate();
  }, []);

  if (status === 'loading' && hasPersistedTokens) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <p className="text-slate-700 font-medium">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<Navigate to="/login" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="change-password" element={<ChangePasswordPage />} />
            <Route path="wizard" element={<WizardPage />} />
            <Route path="frameworks" element={<FrameworksPage />} />
            <Route path="frameworks/:id" element={<FrameworkDetailPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="attestations" element={<AttestationsPage />} />
          </Route>
          <Route element={<ProtectedRoute requireRole="admin" />}>
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/credentials" element={<CredentialsPage />} />
            <Route
              path="integrations/log360"
              element={isDemoMode() ? <Navigate to="/dashboard" replace /> : <Log360DetailPage />}
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
