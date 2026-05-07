import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { ApiError } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = useMemo(
    () => (location.state as LocationState | null)?.from?.pathname ?? '/dashboard',
    [location.state],
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const emailInvalid = showErrors && !email.trim();
  const passwordInvalid = showErrors && !password;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    setErrorMessage('');

    if (!email.trim() || !password) {
      return;
    }

    setPending(true);
    try {
      await login(email.trim(), password);
      navigate(fromPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to sign in right now. Please try again.');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to ComplianceIQ</h1>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                emailInvalid ? 'border-red-600' : 'border-slate-300'
              }`}
            />
            {emailInvalid && <p className="mt-1 text-sm text-slate-700">Email is required.</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                passwordInvalid ? 'border-red-600' : 'border-slate-300'
              }`}
            />
            {passwordInvalid && <p className="mt-1 text-sm text-slate-700">Password is required.</p>}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          First time here?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
