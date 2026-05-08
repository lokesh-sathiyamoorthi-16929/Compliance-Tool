import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isDemoMode } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  requireRole?: 'admin';
}

export default function ProtectedRoute({ requireRole }: ProtectedRouteProps = {}) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (isDemoMode()) {
    return <Outlet />;
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Loading protected route" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Force password change gate — exempt /change-password itself
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // If already on /change-password but password is already changed, go to dashboard
  if (!user.mustChangePassword && location.pathname === '/change-password') {
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based access control
  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/dashboard" replace state={{ permissionDenied: true }} />;
  }

  return <Outlet />;
}
