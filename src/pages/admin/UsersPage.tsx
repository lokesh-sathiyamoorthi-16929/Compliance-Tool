import { useEffect, useState } from 'react';
import { Copy, Loader2, Plus, Users } from 'lucide-react';
import { ApiError } from '../../api/client';
import { listUsers, createUser } from '../../api/adminUsers';
import type { AdminUser } from '../../api/adminUsers';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface CreatedCredentials {
  username: string;
  password: string;
}

interface NewUserForm {
  username: string;
  fullName: string;
  role: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewUserForm>({ username: '', fullName: '', role: 'member', password: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const validateUsername = (value: string): string | undefined => {
    if (!value) return 'Username is required.';
    if (value.length < 3) return 'Username must be at least 3 characters.';
    if (value.length > 32) return 'Username must be 32 characters or fewer.';
    if (!/^[a-z0-9_-]+$/.test(value)) return 'Only lowercase letters, numbers, underscores, and hyphens allowed.';
    return undefined;
  };

  const handleUsernameChange = (value: string) => {
    setForm((f) => ({ ...f, username: value }));
    const err = validateUsername(value);
    setFormErrors((e) => ({ ...e, username: err }));
  };

  const generatePassword = () => {
    const pwd = crypto.randomUUID().slice(0, 8);
    setForm((f) => ({ ...f, password: pwd }));
    setFormErrors((e) => ({ ...e, password: undefined }));
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openModal = () => {
    setForm({ username: '', fullName: '', role: 'member', password: '' });
    setFormErrors({});
    setSubmitError('');
    setCreatedCredentials(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    if (createdCredentials) {
      void loadUsers();
    }
    setCreatedCredentials(null);
  };

  const handleSubmit = async () => {
    const usernameErr = validateUsername(form.username);
    const passwordErr = !form.password ? 'Password is required.' : form.password.length < 4 ? 'Password must be at least 4 characters.' : undefined;

    setFormErrors({ username: usernameErr, password: passwordErr });
    setSubmitError('');

    if (usernameErr || passwordErr) return;

    setSubmitting(true);
    try {
      await createUser({
        username: form.username,
        password: form.password,
        fullName: form.fullName || undefined,
        role: form.role,
      });
      setCreatedCredentials({ username: form.username, password: form.password });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'USERNAME_TAKEN') {
          setFormErrors((e) => ({ ...e, username: 'Username is already taken.' }));
        } else if (err.code === 'WEAK_PASSWORD') {
          setFormErrors((e) => ({ ...e, password: 'Password is too weak.' }));
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('Failed to create user. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          New User
        </button>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-b-0 animate-pulse">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-16 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">Just you so far. Click <strong>+ New User</strong> to add a teammate.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Username</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Full Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Last Login</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.username}</td>
                  <td className="px-4 py-3 text-slate-600">{u.fullName || '—'}</td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Admin</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Member</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.mustChangePassword ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Pending password change</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatRelativeTime(u.lastLoginAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            {createdCredentials ? (
              <>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">User created.</h2>
                <p className="mb-4 text-sm text-slate-500">Share these credentials securely. The password will not be shown again.</p>
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-500">Username</span>
                      <p className="font-mono font-semibold text-slate-900">{createdCredentials.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(createdCredentials.username, 'username')}
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedField === 'username' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-500">Password</span>
                      <p className="font-mono font-semibold text-slate-900">{createdCredentials.password}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(createdCredentials.password, 'password')}
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedField === 'password' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p className="mb-4 text-xs text-slate-500 italic">They will be required to change the password on first login.</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">New User</h2>
                {submitError && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="e.g. john_doe"
                      className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                        formErrors.username ? 'border-red-400' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.username && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.username}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.password}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, password: e.target.value }));
                          setFormErrors((err) => ({ ...err, password: undefined }));
                        }}
                        placeholder="Min 4 characters"
                        className={`flex-1 rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                          formErrors.password ? 'border-red-400' : 'border-slate-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                      >
                        Generate
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Create User
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
