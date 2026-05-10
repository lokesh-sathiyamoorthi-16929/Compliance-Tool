import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { summarizeLog360Evidence } from '../../services/log360Summary';

function getStatusPill(hasConnection: boolean, hasErrors: boolean) {
  if (!hasConnection) {
    return {
      label: '○ Not connected',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    };
  }

  if (hasErrors) {
    return {
      label: '❌ Error',
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }

  return {
    label: '✅ Connected',
    className: 'border-green-200 bg-green-50 text-green-700',
  };
}

export default function Log360DetailPage() {
  const { connections, log360Evidence } = useAppStore();
  const connected = connections.log360.connected;

  if (!connected) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Log360 Compliance</h1>
        <p className="mt-3 text-sm text-slate-600">
          Log360 is not connected. Add your server URL and auth token in Connections.
        </p>
        <Link
          to="/connections"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Go to Connections
        </Link>
      </div>
    );
  }

  const summary = summarizeLog360Evidence(log360Evidence);
  const hasErrors = Boolean(log360Evidence?.partialSuccess);
  const pill = getStatusPill(connected, hasErrors);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Log360 Compliance</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${pill.className}`}>
              {pill.label}
            </span>
          </div>
        </div>
        <Link
          to="/connections"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Sync from Connections
        </Link>
      </div>

      {!log360Evidence ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          — Not collected yet
        </div>
      ) : null}

      {summary.overall === null ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Score unavailable — no successful metric inputs yet.
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Score based on {summary.basedOn} of {summary.totalInputs} inputs
          {summary.unavailableLabels.length > 0 ? ` — ${summary.unavailableLabels.join(' and ')} unavailable` : ''}.
        </div>
      )}

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Score</h2>
        <div className="mt-2 flex items-center gap-3">
          <div className="text-5xl font-bold text-slate-900">{summary.overall ?? '—'}</div>
          {summary.band ? (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {summary.band}
            </span>
          ) : null}
        </div>
        <div className="mt-4 space-y-3">
          {summary.metrics.map((metric) => (
            <div key={metric.key} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
                <p className="text-xs text-slate-600">{metric.value ?? '—'}</p>
              </div>
              <p className="mt-1 text-xs text-slate-600">{metric.note}</p>
              {metric.value !== null ? (
                <div className="mt-2 h-2 w-full rounded bg-slate-100">
                  <div className="h-2 rounded bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, metric.value))}%` }} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Sources</h2>
        <p className="mt-2 text-sm text-slate-600">
          {log360Evidence ? `Total: ${log360Evidence.logSources.count}` : '—'}
        </p>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
        <p className="mt-2 text-sm text-slate-600">
          {log360Evidence ? `Total: ${log360Evidence.alerts.total}` : '—'}
        </p>
      </section>

      {log360Evidence?.diagnostics?.length ? (
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Endpoint diagnostics</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="px-2 py-2">Endpoint</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Latency</th>
                  <th className="px-2 py-2">Summary</th>
                </tr>
              </thead>
              <tbody>
                {log360Evidence.diagnostics.map((entry, index) => (
                  <tr key={`${entry.key}:${entry.path}:${index}`} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-mono text-xs">{entry.method} {entry.path}</td>
                    <td className="px-2 py-2">{entry.statusText}</td>
                    <td className="px-2 py-2">{entry.latencyMs}ms</td>
                    <td className="px-2 py-2 text-xs text-slate-600">{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
