import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { ApiError } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

export default function RegisterPage() {
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const nameInvalid = showErrors && !fullName.trim();
  const emailInvalid = showErrors && !email.trim();
  const passwordInvalid = showErrors && !password;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !password) {
      return;
    }

    setPending(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        inviteToken: inviteToken.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        const lowerMessage = error.message.toLowerCase();
        const inviteOnly = lowerMessage.includes('invite') || error.code.toLowerCase().includes('invite');
        setErrorMessage(
          inviteOnly
            ? 'Registration is invite-only. Contact your administrator for an invite.'
            : error.message,
        );
      } else {
        setErrorMessage('Unable to register right now. Please try again.');
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
          <h1 className="text-2xl font-semibold text-slate-900">Create your ComplianceIQ account</h1>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                nameInvalid ? 'border-red-600' : 'border-slate-300'
              }`}
            />
            {nameInvalid && <p className="mt-1 text-sm text-slate-700">Full name is required.</p>}
          </div>

          <div>
            <label htmlFor="registerEmail" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="registerEmail"
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
            <label htmlFor="registerPassword" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="registerPassword"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                passwordInvalid ? 'border-red-600' : 'border-slate-300'
              }`}
            />
            <p className="mt-1 text-xs text-slate-500">Min 12 chars, includes letters and numbers</p>
            {passwordInvalid && <p className="mt-1 text-sm text-slate-700">Password is required.</p>}
          </div>

          <div>
            <label htmlFor="inviteToken" className="mb-1 block text-sm font-medium text-slate-700">
              Invite Token (optional)
            </label>
            <p className="mb-1 text-xs text-slate-500">
              Skip this if you&apos;re the first user. Required for everyone after.
            </p>
            <input
              id="inviteToken"
              type="text"
              value={inviteToken}
              onChange={(event) => setInviteToken(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create account
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
