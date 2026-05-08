import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { ApiError } from '../../api/client';
import { log360Api } from '../../api/integrations';
import type { Log360Health, Log360Summary } from '../../api/integrations';

const breakdownRows = [
  { key: 'health', label: 'Health' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'detection', label: 'Detection' },
  { key: 'response', label: 'Response' },
  { key: 'retention', label: 'Retention' },
] as const;

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function Log360DetailPage() {
  const [summary, setSummary] = useState<Log360Summary | null>(null);
  const [health, setHealth] = useState<Log360Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setFetchError('');

    const [healthResult, summaryResult] = await Promise.allSettled([
      log360Api.health(),
      log360Api.summary(),
    ]);

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value);
    } else {
      setHealth(null);
    }

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value);
    } else {
      setSummary(null);
    }

    if (healthResult.status === 'rejected' && summaryResult.status === 'rejected') {
      const err = summaryResult.reason ?? healthResult.reason;
      setFetchError(err instanceof ApiError ? err.message : 'Failed to load Log360 integration details.');
    } else if (summaryResult.status === 'rejected') {
      const err = summaryResult.reason;
      setFetchError(err instanceof ApiError ? err.message : 'Failed to load Log360 summary.');
    } else if (healthResult.status === 'rejected') {
      const err = healthResult.reason;
      setFetchError(err instanceof ApiError ? err.message : 'Failed to load Log360 health status.');
    }

    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading Log360 details">
        <div className="h-10 w-72 rounded bg-slate-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">Log360 Compliance</h1>
        <p className="mt-2 text-sm text-red-700">{fetchError || 'Failed to load Log360 data.'}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary.configured) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Log360 Compliance</h1>
        <p className="mt-3 text-sm text-slate-600">
          No Log360 credential configured. Add one in Admin → Credentials.
        </p>
        <Link
          to="/admin/credentials"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Go to Credentials
        </Link>
      </div>
    );
  }

  const hasHealthError = (health ? !health.ok : !summary.ok);
  const pillLabel = hasHealthError
    ? '❌ Error'
    : `✅ Connected${health?.productVersion || summary.productVersion ? ` v${health?.productVersion || summary.productVersion}` : ''}`;
  const pillClass = hasHealthError
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-green-200 bg-green-50 text-green-700';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Log360 Compliance</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${pillClass}`}>
              {pillLabel}
            </span>
            {health?.user ? <span className="text-xs text-slate-500">User: {health.user}</span> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {fetchError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {fetchError}
        </div>
      ) : null}

      {!summary.ok ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {health?.error || summary.errors[0] || 'Log360 health check failed. Showing available data.'}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Score</h2>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-5xl font-bold text-slate-900">{summary.score.overall}</div>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {summary.score.band}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {breakdownRows.map((row) => {
              const item = summary.score.breakdown[row.key];
              return (
                <div key={row.key} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                    <p className="text-xs text-slate-600">
                      Score: <strong>{item.score}</strong> · Weight: <strong>{item.weight}%</strong>
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.reason}</p>
                  <div className="mt-2 h-2 w-full rounded bg-slate-100">
                    <div className="h-2 rounded bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Retention</h2>
          <div className="mt-4 flex items-center gap-3">
            <div className="text-4xl font-bold text-slate-900">{summary.retention.retentionDays}</div>
            <span className="text-sm text-slate-600">days</span>
          </div>
          <span
            className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
              summary.retention.archiveEnabled ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {summary.retention.archiveEnabled ? 'Archive enabled' : 'Archive disabled'}
          </span>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Sources</h2>
        <p className="mt-2 text-sm text-slate-600">
          Total: {summary.sources.total} · Online: {summary.sources.online} · Offline: {summary.sources.offline} · Unknown: {summary.sources.unknown}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {summary.sources.samples.map((source) => (
                <tr key={source.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{source.name}</td>
                  <td className="px-2 py-2 capitalize">{source.status}</td>
                  <td className="px-2 py-2">{formatDate(source.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
        <p className="mt-2 text-sm text-slate-600">
          Total: {summary.alerts.total} · Open: {summary.alerts.open} · Closed: {summary.alerts.closed}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(summary.alerts.bySeverity).map(([severity, count]) => (
            <span key={severity} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {severity}: {count}
            </span>
          ))}
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Severity</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {summary.alerts.samples.map((alert) => (
                <tr key={alert.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">{alert.title}</td>
                  <td className="px-2 py-2 capitalize">{alert.severity}</td>
                  <td className="px-2 py-2 capitalize">{alert.status}</td>
                  <td className="px-2 py-2">{formatDate(alert.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {summary.errors.length > 0 ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">Non-fatal errors</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {summary.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
