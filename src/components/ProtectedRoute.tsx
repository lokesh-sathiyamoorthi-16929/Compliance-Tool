import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isDemoMode } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
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

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
