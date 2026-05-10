import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useLog360Evidence } from '../../hooks/useLog360Evidence';

const breakdownRows = [
  { key: 'health', label: 'Health' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'detection', label: 'Detection' },
  { key: 'response', label: 'Response' },
] as const;

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function normalizeWeightPercent(weight: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((weight / total) * 100).toFixed(1));
}

export default function Log360DetailPage() {
  const connected = useAppStore((state) => state.connections.log360.connected);
  const { overview, loading, error, refresh } = useLog360Evidence();

  if (loading && !overview) {
    return (
      <div className="space-y-4" aria-label="Loading Log360 details">
        <div className="h-10 w-72 rounded bg-slate-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">Log360 Compliance</h1>
        <p className="mt-2 text-sm text-red-700">{error}</p>
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

  if (!overview?.configured) {
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

  if (!overview) {
    return null;
  }

  const pillLabel = connected ? '✅ Connected' : '⚠ Partial / Failed';
  const pillClass = connected
    ? 'border-green-200 bg-green-50 text-green-700'
    : 'border-red-200 bg-red-50 text-red-700';
  const breakdownWeightTotal = breakdownRows.reduce((sum, row) => sum + overview.score.breakdown[row.key].weight, 0);
  const failedDiagnostics = overview.diagnostics.filter((diagnostic) => !diagnostic.ok);
  const allFailed = failedDiagnostics.length === overview.diagnostics.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Log360 Compliance</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${pillClass}`}>
              {pillLabel}
            </span>
            <span className="text-xs text-slate-500">Last refreshed: {formatDate(overview.fetchedAt)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      {failedDiagnostics.length > 0 ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            allFailed
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-amber-300 bg-amber-50 text-amber-800'
          }`}
        >
          <p className="font-semibold">
            {allFailed
              ? 'All Log360 endpoint checks failed.'
              : `${failedDiagnostics.length} of ${overview.diagnostics.length} Log360 endpoint checks failed.`}
          </p>
          <p className="mt-1">
            {failedDiagnostics.map((diagnostic) => `${diagnostic.label}: ${diagnostic.errorMessage ?? diagnostic.responseSummary}`).join(' · ')}
          </p>
          <a href="#endpoint-diagnostics" className="mt-2 inline-flex font-semibold underline">
            View endpoint diagnostics
          </a>
        </div>
      ) : null}

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Score</h2>
            <p className="mt-1 text-sm text-slate-500">Derived entirely from backend-proxied Log360 API evidence.</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-slate-900">{overview.score.overall}</div>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {overview.score.band}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {breakdownRows.map((row) => {
            const item = overview.score.breakdown[row.key];
            return (
              <div key={row.key} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                  <span className="text-xs text-slate-500">
                    {normalizeWeightPercent(item.weight, breakdownWeightTotal)}%
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-slate-900">{item.score}</p>
                <p className="mt-2 text-xs text-slate-600">{item.reason}</p>
                <div className="mt-3 h-2 w-full rounded bg-slate-100">
                  <div className="h-2 rounded bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Live endpoint totals</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Log fields</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{overview.totals.logFields}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Log sources</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{overview.totals.logSources}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Alerts</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{overview.totals.alerts}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-600">Alert profiles</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{overview.totals.alertProfiles}</p>
          </div>
        </div>
      </section>

      <section id="endpoint-diagnostics" className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Endpoint diagnostics</h2>
        <p className="mt-2 text-sm text-slate-600">
          Each diagnostic is a direct Log360 proxy call. No legacy summary or health aggregation is used.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">Endpoint</th>
                <th className="px-2 py-2">Method</th>
                <th className="px-2 py-2">Logical path</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Latency</th>
                <th className="px-2 py-2">Response summary</th>
                <th className="px-2 py-2">Failure category</th>
              </tr>
            </thead>
            <tbody>
              {overview.diagnostics.map((diagnostic) => (
                <tr key={diagnostic.key} className="border-b border-slate-100 align-top">
                  <td className="px-2 py-2 font-medium text-slate-900">{diagnostic.label}</td>
                  <td className="px-2 py-2">{diagnostic.method}</td>
                  <td className="px-2 py-2 font-mono text-xs text-slate-600">{diagnostic.logicalPath}</td>
                  <td className="px-2 py-2">
                    <span className={diagnostic.ok ? 'text-green-700' : 'text-red-700'}>
                      {diagnostic.ok ? '200 OK' : diagnostic.status ? `${diagnostic.status}` : 'Failed'}
                    </span>
                  </td>
                  <td className="px-2 py-2">{diagnostic.latencyMs} ms</td>
                  <td className="px-2 py-2">{diagnostic.responseSummary}</td>
                  <td className="px-2 py-2">{diagnostic.failureCategory ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
