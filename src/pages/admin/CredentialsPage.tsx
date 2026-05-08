import { useEffect, useState } from 'react';
import { Eye, EyeOff, Key, Loader2, Plus, Trash2, Wifi } from 'lucide-react';
import { ApiError } from '../../api/client';
import { credentialsApi } from '../../api/credentials';
import type { CredentialMeta, CreateCredentialPayload } from '../../api/credentials';

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

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error';
}

let toastIdCounter = 0;

interface AddCredentialForm {
  type: 'log360' | 'ad360';
  name: string;
  serverUrl: string;
  apiKey: string;
}

interface FormErrors {
  name?: string;
  serverUrl?: string;
  apiKey?: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AddCredentialForm>({
    type: 'log360',
    name: '',
    serverUrl: '',
    apiKey: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, variant: 'success' | 'error') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const loadCredentials = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await credentialsApi.list();
      setCredentials(data);
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.message : 'Failed to load credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCredentials();
  }, []);

  const openModal = () => {
    setForm({ type: 'log360', name: '', serverUrl: '', apiKey: '' });
    setFormErrors({});
    setSubmitError('');
    setShowApiKey(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.serverUrl.trim()) {
      errors.serverUrl = 'Server URL is required.';
    } else if (!isValidUrl(form.serverUrl.trim())) {
      errors.serverUrl = 'Must be a valid URL (e.g. https://server.example.com).';
    }
    if (!form.apiKey.trim()) errors.apiKey = 'API Key is required.';
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    setSubmitError('');

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const payload: CreateCredentialPayload = {
        name: form.name.trim(),
        type: form.type,
        serverUrl: form.serverUrl.trim(),
        apiKey: form.apiKey,
      };
      await credentialsApi.create(payload);
      await loadCredentials();
      setModalOpen(false);
      addToast('Credential added successfully.', 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CREDENTIAL_NAME_TAKEN') {
          setFormErrors((e) => ({ ...e, name: 'A credential with this name already exists.' }));
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('Failed to add credential. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingIds((prev) => new Set(prev).add(id));
    try {
      const result = await credentialsApi.test(id);
      setCredentials((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                lastTestAt: result.testedAt,
                lastTestStatus: result.success ? 'success' : 'failure',
                lastTestError: result.error ?? null,
              }
            : c,
        ),
      );
      addToast(
        result.success
          ? 'Connection test passed.'
          : `Connection test failed${result.error ? `: ${result.error}` : '.'}`,
        result.success ? 'success' : 'error',
      );
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Test failed.', 'error');
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (cred: CredentialMeta) => {
    if (!window.confirm(`Delete credential "${cred.name}"? This cannot be undone.`)) return;
    setDeletingIds((prev) => new Set(prev).add(cred.id));
    try {
      await credentialsApi.delete(cred.id);
      setCredentials((prev) => prev.filter((c) => c.id !== cred.id));
      addToast('Credential deleted.', 'success');
    } catch (err) {
      addToast(err instanceof ApiError ? err.message : 'Failed to delete credential.', 'error');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(cred.id);
        return next;
      });
    }
  };

  const StatusBadge = ({ cred }: { cred: CredentialMeta }) => {
    if (!cred.lastTestAt) {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          Untested
        </span>
      );
    }
    if (cred.lastTestStatus === 'success') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          Tested
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 cursor-help"
        title={cred.lastTestError ?? 'Connection test failed'}
      >
        Failed
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: 'log360' | 'ad360' }) => {
    const label = type === 'log360' ? 'Log360' : 'AD360';
    const cls =
      type === 'log360'
        ? 'bg-blue-50 text-blue-700'
        : 'bg-violet-50 text-violet-700';
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto ${
              t.variant === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Key className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-semibold text-slate-900">API Credentials</h1>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Credential
        </button>
      </div>

      <p className="mb-6 text-sm text-slate-500">
        Keys are encrypted at rest using AES-256-GCM. Secrets are never returned after save.
      </p>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden" aria-label="Loading credentials">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-b-0 animate-pulse"
            >
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-200" />
              <div className="h-4 w-16 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : credentials.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-16 text-center" data-testid="empty-state">
          <Key className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500 mb-4">No credentials yet. Add one to connect Log360 or AD360.</p>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Credential
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Server URL</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Last Tested</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {credentials.map((cred) => (
                <tr key={cred.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-900">{cred.name}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={cred.type} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px]">
                    <span
                      className="block truncate"
                      title={cred.serverUrl}
                    >
                      {cred.serverUrl}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge cred={cred} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatRelativeTime(cred.lastTestAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatRelativeTime(cred.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Test ${cred.name}`}
                        disabled={testingIds.has(cred.id)}
                        onClick={() => void handleTest(cred.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
                      >
                        {testingIds.has(cred.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wifi className="h-3 w-3" />
                        )}
                        Test
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${cred.name}`}
                        disabled={deletingIds.has(cred.id)}
                        onClick={() => void handleDelete(cred)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
                      >
                        {deletingIds.has(cred.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Credential Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Add Credential</h2>

            {submitError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="cred-type">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="cred-type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'log360' | 'ad360' }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 bg-white"
                >
                  <option value="log360">Log360</option>
                  <option value="ad360">AD360</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="cred-name">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="cred-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    setFormErrors((err) => ({ ...err, name: undefined }));
                  }}
                  placeholder="e.g. Production Log360"
                  className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                    formErrors.name ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Server URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="cred-server-url">
                  Server URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="cred-server-url"
                  type="text"
                  value={form.serverUrl}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, serverUrl: e.target.value }));
                    setFormErrors((err) => ({ ...err, serverUrl: undefined }));
                  }}
                  placeholder="https://server.example.com"
                  className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                    formErrors.serverUrl ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {formErrors.serverUrl && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.serverUrl}</p>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="cred-api-key">
                  API Key <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="cred-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={form.apiKey}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, apiKey: e.target.value }));
                      setFormErrors((err) => ({ ...err, apiKey: undefined }));
                    }}
                    placeholder="Paste your API key"
                    className={`flex-1 rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200 ${
                      formErrors.apiKey ? 'border-red-400' : 'border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    onClick={() => setShowApiKey((v) => !v)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-50 transition"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.apiKey && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.apiKey}</p>
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
                Add Credential
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
