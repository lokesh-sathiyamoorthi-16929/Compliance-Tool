import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { ApiError } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

export default function ChangePasswordPage() {
  const changePassword = useAuthStore((state) => state.changePassword);
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const currentPasswordInvalid = showErrors && !currentPassword;
  const newPasswordTooShort = showErrors && newPassword.length > 0 && newPassword.length < 4;
  const newPasswordEmpty = showErrors && !newPassword;
  const confirmMismatch = showErrors && newPassword !== confirmPassword;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    setErrorMessage('');

    if (!currentPassword || !newPassword || newPassword.length < 4 || newPassword !== confirmPassword) {
      return;
    }

    setPending(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'WEAK_PASSWORD') {
          setErrorMessage('Password is too weak. Choose at least 4 characters.');
        } else if (error.code === 'INVALID_CREDENTIALS') {
          setErrorMessage('Current password is incorrect.');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('Unable to change password right now. Please try again.');
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
          <h1 className="text-2xl font-semibold text-slate-900">Change Password</h1>
        </div>

        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          For security, you must change your password before continuing.
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-slate-700">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                currentPasswordInvalid ? 'border-red-600' : 'border-slate-300'
              }`}
            />
            {currentPasswordInvalid && (
              <p className="mt-1 text-sm text-slate-700">Current password is required.</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-700">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                newPasswordEmpty || newPasswordTooShort ? 'border-red-600' : 'border-slate-300'
              }`}
            />
            {newPasswordEmpty && <p className="mt-1 text-sm text-slate-700">New password is required.</p>}
            {newPasswordTooShort && (
              <p className="mt-1 text-sm text-slate-700">New password must be at least 4 characters.</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                confirmMismatch ? 'border-red-600' : 'border-slate-300'
              }`}
            />
            {confirmMismatch && (
              <p className="mt-1 text-sm text-slate-700">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
