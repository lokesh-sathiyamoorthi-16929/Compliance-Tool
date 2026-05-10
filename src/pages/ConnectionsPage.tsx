import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Wifi, WifiOff, ExternalLink, LayoutDashboard, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { collectEvidence } from '../services/evidenceCollector';
import { Log360Client, Log360ClientError } from '../services/log360Client';

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function mapError(error: unknown): string {
  if (error instanceof Log360ClientError) {
    if (error.kind === 'UNAUTHORIZED') return 'Invalid or expired token';
    if (error.kind === 'NETWORK_ERROR') return 'Cannot reach server / CORS blocked';
    if (error.kind === 'SERVER_ERROR') return 'Server error';
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Connection failed';
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
  const [serverUrl, setServerUrl] = useState(conn.serverUrl);
  const [token, setToken] = useState(conn.token);
  const [useProxy, setUseProxy] = useState(conn.useProxy);
  const [testSummary, setTestSummary] = useState<{ latencyMs: number; fieldCount?: number } | null>(null);

  const client = useMemo(
    () => new Log360Client({ baseUrl: normalizeUrl(serverUrl), token, useProxy }),
    [serverUrl, token, useProxy],
  );

  const anyConnected = connections.log360.connected || connections.ad360.connected;

  const runSync = async () => {
    setEvidenceLoading('all', true);
    clearEvidenceErrors();

    try {
      const evidence = await collectEvidence(client);
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

    try {
      const result = await client.testConnection();
      if (!result.success) {
        updateConnection('log360', {
          testing: false,
          connected: false,
          lastError: result.error ?? 'Connection failed',
        });
        return;
      }

      const connectedAt = new Date().toISOString();

      updateConnection('log360', {
        connected: true,
        testing: false,
        serverUrl: normalizeUrl(serverUrl),
        token,
        useProxy,
        connectedAt,
        lastConnectionLatencyMs: result.latencyMs,
        lastError: null,
      });

      // MVP only — replace with secure vault in production.
      localStorage.setItem(
        'complianceiq-log360-connection',
        JSON.stringify({ baseUrl: normalizeUrl(serverUrl), token, useProxy, connectedAt }),
      );

      setTestSummary({ latencyMs: result.latencyMs, fieldCount: result.fieldCount });
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
    setToken('');
    setUseProxy(false);
    setTestSummary(null);
    localStorage.removeItem('complianceiq-log360-connection');
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
            <p className="text-sm text-slate-500 mt-1">Unified SIEM evidence source for HIPAA and PCI DSS checks.</p>
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
                <span className="font-semibold text-green-800">Connected to Log360</span>
              </div>
              <p className="text-sm text-green-700 mb-2">
                Live evidence collection is enabled for framework scoring.
              </p>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Server:</strong> {conn.serverUrl}</p>
                <p><strong>Connected:</strong> {conn.connectedAt ? new Date(conn.connectedAt).toLocaleString() : '—'}</p>
                <p><strong>Last sync:</strong> {conn.lastSync ? new Date(conn.lastSync).toLocaleString() : '—'}</p>
                <p><strong>Proxy:</strong> {conn.useProxy ? 'Enabled' : 'Direct'}</p>
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
                onClick={() => { void runSync(); }}
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

            {log360Evidence?.diagnostics?.length ? (
              <details className="rounded-lg border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">
                  Sync Diagnostics ({log360Evidence.diagnostics.length} endpoints)
                </summary>
                <div className="overflow-x-auto border-t border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600">
                        <th className="px-3 py-2">Endpoint</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Latency</th>
                        <th className="px-3 py-2">Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {log360Evidence.diagnostics.map((entry) => (
                        <tr key={`${entry.key}:${entry.path}`} className="border-t border-slate-200">
                          <td className="px-3 py-2 font-mono text-xs">{entry.method} {entry.path}</td>
                          <td className="px-3 py-2">{entry.statusText}</td>
                          <td className="px-3 py-2">{entry.latencyMs}ms</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{entry.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ) : null}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Auth Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••••••••••"
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

            <button
              onClick={() => { void handleTestConnection(); }}
              disabled={conn.testing || !serverUrl || !token}
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
                🟢 Success · latency {testSummary.latencyMs}ms · fields detected: {testSummary.fieldCount ?? 0}
              </div>
            ) : null}

            {conn.lastError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                🔴 Failure · {conn.lastError}
                {conn.lastError.includes('CORS') ? (
                  <>
                    {' '}
                    <a
                      href="#proxy-help"
                      className="underline font-medium"
                    >
                      Set up proxy
                    </a>
                  </>
                ) : null}
              </div>
            ) : null}

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

      <div id="proxy-help" className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Proxy setup help</p>
            <p className="text-sm text-blue-700 mt-0.5">
              If browser CORS blocks direct Log360 calls, enable "Use proxy" and configure `/api/proxy` or `/log360-proxy/*` in development.
            </p>
          </div>
        </div>
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
