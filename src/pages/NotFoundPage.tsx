import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 p-8 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
      <p className="text-lg text-slate-600 mb-6">Page not found</p>
      <Link to="/" className="btn-primary">
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
