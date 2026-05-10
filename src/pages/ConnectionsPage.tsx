import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  LayoutDashboard,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { collectEvidence } from '../services/evidenceCollector';
import {
  createLog360Api,
  getLog360DebugCalls,
  loadObfuscatedConfig,
  loadSessionToken,
  saveObfuscatedConfig,
  tokenExpiresInSeconds,
  clearStoredConfig,
} from '../api/log360';

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function formatCountdown(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds <= 0) return 'Expired';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function mapError(error: unknown): string {
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.detail === 'string') return obj.detail;
    if (typeof obj.message === 'string') return obj.message;
  }
  return error instanceof Error ? error.message : 'Connection failed';
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

  const conn = connections.log360;
  const storedConfig = loadObfuscatedConfig();

  const [serverUrl, setServerUrl] = useState(conn.serverUrl || storedConfig?.baseUrl || '');
  const [clientId, setClientId] = useState(conn.clientId || storedConfig?.clientId || '');
  const [clientSecret, setClientSecret] = useState(conn.clientSecret || storedConfig?.clientSecret || '');
  const [refreshToken, setRefreshToken] = useState(conn.refreshToken || storedConfig?.refreshToken || '');
  const [useProxy, setUseProxy] = useState(conn.useProxy);
  const [testSummary, setTestSummary] = useState<{ latencyMs: number; user?: string } | null>(null);
  const [expiryCountdown, setExpiryCountdown] = useState<number | null>(tokenExpiresInSeconds(loadSessionToken()));

  const api = useMemo(
    () =>
      createLog360Api({
        baseUrl: normalizeUrl(serverUrl),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        refreshToken: refreshToken.trim(),
        useProxy,
      }),
    [clientId, clientSecret, refreshToken, serverUrl, useProxy],
  );

  const anyConnected = connections.log360.connected || connections.ad360.connected;
  const showDebug = new URLSearchParams(window.location.search).get('debug') === '1';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExpiryCountdown(tokenExpiresInSeconds(loadSessionToken()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const runSync = async () => {
    setEvidenceLoading('all', true);
    clearEvidenceErrors();

    try {
      const evidence = await collectEvidence(api);
      setLog360Evidence(evidence);
      updateConnection('log360', { lastSync: evidence.collectedAt });
      Object.entries(evidence.errors).forEach(([key, value]) => {
        if (value) {
          setEvidenceError(key as keyof typeof evidence.errors, value);
        }
      });
    } catch (error) {
      setEvidenceError('reports', mapError(error));
    } finally {
      setEvidenceLoading('all', false);
    }
  };

  const handleTestConnection = async () => {
    updateConnection('log360', { testing: true, lastError: null });
    setTestSummary(null);

    const startedAt = performance.now();

    try {
      const config = {
        baseUrl: normalizeUrl(serverUrl),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        refreshToken: refreshToken.trim(),
        useProxy,
      };

      saveObfuscatedConfig(config);

      const user = await api.metadata.getCurrentUser();
      const sessionToken = loadSessionToken();
      const connectedAt = new Date().toISOString();

      updateConnection('log360', {
        connected: true,
        testing: false,
        serverUrl: config.baseUrl,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: config.refreshToken,
        useProxy,
        connectedAt,
        connectedUser: user?.display_name ?? user?.username ?? 'Unknown user',
        tokenExpiresAt: sessionToken ? new Date(sessionToken.expiresAt).toISOString() : null,
        lastConnectionLatencyMs: Math.round(performance.now() - startedAt),
        lastError: null,
      });

      setTestSummary({
        latencyMs: Math.round(performance.now() - startedAt),
        user: user?.display_name ?? user?.username,
      });

      await runSync();
    } catch (error) {
      updateConnection('log360', {
        connected: false,
        testing: false,
        lastError: mapError(error),
      });
    }
  };

  const handleDisconnect = () => {
    disconnectProduct('log360');
    setServerUrl('');
    setClientId('');
    setClientSecret('');
    setRefreshToken('');
    setUseProxy(false);
    setTestSummary(null);
    clearStoredConfig();
  };

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
            <p className="text-sm text-slate-500 mt-1">EventLog Analyzer v2 API (merged into Log360 build 13000+).</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            conn.connected
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {conn.connected ? '● Connected' : '○ Not Connected'}
          </div>
        </div>

        {conn.connected ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Connected as {conn.connectedUser || 'Log360 user'}</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Server:</strong> {conn.serverUrl}</p>
                <p><strong>Connected:</strong> {conn.connectedAt ? new Date(conn.connectedAt).toLocaleString() : '—'}</p>
                <p><strong>Last sync:</strong> {conn.lastSync ? new Date(conn.lastSync).toLocaleString() : '—'}</p>
                <p><strong>Token expires in:</strong> {formatCountdown(expiryCountdown)}</p>
              </div>
            </div>

            {log360Evidence ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Last evidence collection completed at {new Date(log360Evidence.collectedAt).toLocaleString()}.
              </div>
            ) : null}

            {Object.values(evidenceErrors).length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Some evidence sources failed during sync. Partial scoring will still be shown.
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  void runSync();
                }}
                disabled={Boolean(evidenceLoading.all)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-70"
              >
                <RefreshCw className={`w-4 h-4 ${evidenceLoading.all ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Server URL</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://lokesh-16929-t:8095"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client Secret</label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Refresh Token</label>
              <input
                type="password"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="rounded border-slate-300"
              />
              Use proxy
            </label>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Credentials are stored in localStorage using base64 obfuscation only (not encryption).
            </div>

            <button
              onClick={() => {
                void handleTestConnection();
              }}
              disabled={conn.testing || !serverUrl || !clientId || !clientSecret || !refreshToken}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600 text-white hover:bg-rose-700"
            >
              {conn.testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </button>

            {testSummary ? (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                ✅ Success · latency {testSummary.latencyMs}ms · user: {testSummary.user ?? 'Unknown'}
              </div>
            ) : null}

            {conn.lastError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                ❌ Failure · {conn.lastError}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Troubleshooting</p>
            <p className="text-sm text-blue-700 mt-0.5">
              If browser CORS blocks direct Log360 calls, enable proxy mode. For production, use a backend proxy.
            </p>
          </div>
        </div>
      </div>

      {showDebug ? (
        <div className="mt-6 card p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">Debug Panel (last 20 API calls)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1">Time</th>
                  <th className="py-1">Method</th>
                  <th className="py-1">Path</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Elapsed</th>
                </tr>
              </thead>
              <tbody>
                {getLog360DebugCalls().map((call) => (
                  <tr key={call.id} className="border-t border-slate-100">
                    <td className="py-1">{new Date(call.at).toLocaleTimeString()}</td>
                    <td className="py-1">{call.method}</td>
                    <td className="py-1">{call.path}</td>
                    <td className="py-1">{call.status}</td>
                    <td className="py-1">{call.elapsedMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

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
