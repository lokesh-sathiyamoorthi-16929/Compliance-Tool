import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Wifi, WifiOff, ExternalLink, LayoutDashboard, RefreshCw,
  AlertCircle, Info, KeyRound,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { collectEvidence } from '../services/evidenceCollector';
import { Log360Client } from '../services/log360Client';
import { log360CredentialsApi, log360Api } from '../api/integrations';
import type { Log360Credentials, Log360Health } from '../api/integrations';
import { ApiError } from '../api/client';

function mapApiError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export default function ConnectionsPage() {
  const {
    connections,
    updateConnection,
    disconnectProduct,
    log360Evidence,
    setLog360Evidence,
    evidenceLoading,
    setEvidenceLoading,
    evidenceErrors,
    setEvidenceError,
    clearEvidenceErrors,
  } = useAppStore();

  // Form fields
  const [serverUrl, setServerUrl] = useState('');
  const [token, setToken] = useState('');
  const [showTokenField, setShowTokenField] = useState(false);

  // Backend-driven state
  const [credentials, setCredentials] = useState<Log360Credentials | null>(null);
  const [health, setHealth] = useState<Log360Health | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);

  const anyConnected = connections.log360.connected || connections.ad360.connected;

  const loadStatus = async () => {
    setLoadingStatus(true);
    setSaveError('');

    try {
      const creds = await log360CredentialsApi.get();
      setCredentials(creds);
      setServerUrl(creds.baseUrl ?? '');

      if (creds.configured) {
        try {
          const healthResult = await log360Api.health();
          setHealth(healthResult);
          updateConnection('log360', {
            connected: healthResult.ok,
            serverUrl: creds.baseUrl ?? '',
            lastConnectionLatencyMs: healthResult.latencyMs,
            lastError: healthResult.ok ? null : (healthResult.error ?? 'Health check failed'),
          });
        } catch (err) {
          setHealth(null);
          updateConnection('log360', {
            connected: false,
            serverUrl: creds.baseUrl ?? '',
            lastError: mapApiError(err),
          });
        }
      } else {
        setHealth(null);
        updateConnection('log360', { connected: false, serverUrl: '' });
      }
    } catch (err) {
      setSaveError(mapApiError(err));
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSync = async () => {
    setEvidenceLoading('all', true);
    clearEvidenceErrors();

    try {
      const evidence = await collectEvidence(new Log360Client());
      setLog360Evidence(evidence);
      updateConnection('log360', { lastSync: evidence.collectedAt });
      Object.entries(evidence.errors).forEach(([key, value]) => {
        if (value) {
          setEvidenceError(key as keyof typeof evidence.errors, value);
        }
      });
    } catch (error) {
      setEvidenceError('reports', mapApiError(error));
    } finally {
      setEvidenceLoading('all', false);
    }
  };

  const handleSave = async () => {
    if (!serverUrl || !token) return;
    setSaving(true);
    setSaveError('');

    try {
      await log360CredentialsApi.save({ baseUrl: serverUrl, authToken: token });
      setToken('');
      setShowTokenField(false);
      await loadStatus();
    } catch (err) {
      setSaveError(mapApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    updateConnection('log360', { testing: true, lastError: null });

    try {
      const result = await log360Api.health();
      setHealth(result);
      updateConnection('log360', {
        testing: false,
        connected: result.ok,
        lastConnectionLatencyMs: result.latencyMs,
        lastError: result.ok ? null : (result.error ?? 'Health check failed'),
      });
    } catch (err) {
      updateConnection('log360', {
        testing: false,
        connected: false,
        lastError: mapApiError(err),
      });
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setSaveError('');

    try {
      await log360CredentialsApi.delete();
      disconnectProduct('log360');
      setServerUrl('');
      setToken('');
      setShowTokenField(false);
      setCredentials(null);
      setHealth(null);
    } catch (err) {
      setSaveError(mapApiError(err));
    } finally {
      setDisconnecting(false);
    }
  };

  const isConfigured = credentials?.configured ?? false;

  // Status badge
  let statusBadge: { label: string; className: string };
  if (loadingStatus) {
    statusBadge = { label: '○ Checking…', className: 'bg-slate-50 text-slate-400 border-slate-200' };
  } else if (!isConfigured) {
    statusBadge = { label: '○ Not Configured', className: 'bg-slate-50 text-slate-500 border-slate-200' };
  } else if (health?.ok) {
    statusBadge = { label: '● Connected', className: 'bg-green-50 text-green-700 border-green-200' };
  } else {
    statusBadge = { label: '⚠ Failed', className: 'bg-red-50 text-red-700 border-red-200' };
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Product Connections</h1>
        <p className="text-slate-500 mt-1">
          Connect your ManageEngine Log360 instance to run evidence-backed compliance scoring.
        </p>
      </div>

      <div className="card p-6" style={{ borderTop: '4px solid #e11d48' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Log360</h3>
            <p className="text-sm text-slate-500 mt-1">Unified SIEM evidence source for HIPAA and PCI DSS checks.</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Via backend proxy — all Log360 traffic goes through the API server</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
            {statusBadge.label}
          </div>
        </div>

        {saveError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {saveError}
          </div>
        ) : null}

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading connection status…
          </div>
        ) : isConfigured && !showTokenField ? (
          // Connected / Configured state
          <div className="space-y-4">
            {health?.ok ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Connected to Log360</span>
                </div>
                <p className="text-sm text-green-700 mb-2">
                  Live evidence collection is enabled for framework scoring.
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Server:</strong> {credentials?.baseUrl}</p>
                  <p>
                    <strong>Token:</strong>{' '}
                    <span>•••••</span>{' '}
                    <span className="text-xs text-green-600">(stored on server)</span>
                  </p>
                  {health.latencyMs !== undefined ? (
                    <p><strong>Last check latency:</strong> {health.latencyMs}ms</p>
                  ) : null}
                  <p><strong>Last sync:</strong> {connections.log360.lastSync ? new Date(connections.log360.lastSync).toLocaleString() : '—'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">Connection Failed</span>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  {health?.error
                    ? `Log360 returned ${health.status ? `${health.status} — ` : ''}${health.error}`
                    : 'Log360 health check failed. The server may be down or the token rejected.'}
                </p>
                <div className="text-sm text-red-700 space-y-1">
                  <p><strong>Server:</strong> {credentials?.baseUrl}</p>
                  <p>
                    <strong>Token:</strong>{' '}
                    <span>•••••</span>{' '}
                    <span className="text-xs text-red-600">(stored on server)</span>
                  </p>
                </div>
              </div>
            )}

            {log360Evidence && health?.ok ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Last evidence collection completed at {new Date(log360Evidence.collectedAt).toLocaleString()}.
              </div>
            ) : null}

            {Object.values(evidenceErrors).length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Some evidence sources failed during sync. Partial scoring will still be shown.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {health?.ok ? (
                <button
                  onClick={() => { void runSync(); }}
                  disabled={Boolean(evidenceLoading.all)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-70"
                >
                  <RefreshCw className={`w-4 h-4 ${evidenceLoading.all ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
              ) : null}
              <button
                onClick={() => { void handleTestConnection(); }}
                disabled={Boolean(connections.log360.testing)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-70"
              >
                <Wifi className={`w-4 h-4 ${connections.log360.testing ? 'animate-pulse' : ''}`} />
                {connections.log360.testing ? 'Checking…' : 'Test Connection'}
              </button>
              <button
                onClick={() => setShowTokenField(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                Replace token
              </button>
              <button
                onClick={() => { void handleDisconnect(); }}
                disabled={disconnecting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-70"
              >
                <WifiOff className="w-4 h-4" />
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          // Not configured — or "Replace token" mode
          <div className="space-y-4">
            {showTokenField && isConfigured ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Enter a new token below to replace the one currently stored on the server.
                The existing token will be overwritten on Save.
              </div>
            ) : null}

            <div>
              <label htmlFor="log360-server-url" className="block text-sm font-medium text-slate-700 mb-1">Server URL</label>
              <input
                id="log360-server-url"
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://log360.yourcompany.com:8095"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="log360-auth-token" className="block text-sm font-medium text-slate-700 mb-1">Auth Token</label>
              <input
                id="log360-auth-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">
                The token is encrypted and stored on the API server — never in your browser.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { void handleSave(); }}
                disabled={saving || !serverUrl || !token}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600 text-white hover:bg-rose-700"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
              {showTokenField && isConfigured ? (
                <button
                  onClick={() => { setShowTokenField(false); setToken(''); }}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <a
              href="https://www.manageengine.com/log-management/help/api-settings/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              API Documentation
            </a>
          </div>
        )}
      </div>

      {anyConnected && (
        <div className="card p-6 bg-gradient-to-r from-green-50 to-teal-50 border-green-200 mt-8">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-slate-900">Ready to Run Assessment</h3>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Log360 is connected. View your evidence-backed compliance score dashboard.
          </p>
          <Link to="/dashboard" className="btn-primary">
            <LayoutDashboard className="w-4 h-4" />
            View Compliance Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
