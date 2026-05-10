import { Link } from 'react-router-dom';
import type { Evidence } from '../services/evidenceCollector';
import { summarizeLog360Evidence } from '../services/log360Summary';

interface Log360ScoreCardProps {
  connected: boolean;
  evidence: Evidence | null;
  sampleData?: boolean;
}

function getBandClasses(band: ReturnType<typeof summarizeLog360Evidence>['band']) {
  if (band === 'compliant') {
    return {
      score: 'text-green-600',
      badge: 'bg-green-50 text-green-700 border-green-200',
      label: 'Compliant',
    };
  }
  if (band === 'attention') {
    return {
      score: 'text-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'Attention',
    };
  }
  return {
    score: 'text-red-600',
    badge: 'bg-red-50 text-red-700 border-red-200',
    label: 'At Risk',
  };
}

export default function Log360ScoreCard({ connected, evidence, sampleData = false }: Log360ScoreCardProps) {
  if (!connected && !sampleData) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700">Log360 Compliance Score</h3>
        <p className="mt-3 text-sm text-slate-600">🔌 Connect Log360 to see your score.</p>
        <Link
          to="/connections"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Connect Log360
        </Link>
      </div>
    );
  }

  const summary = summarizeLog360Evidence(evidence);
  const band = getBandClasses(summary.band);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Log360 Compliance Score</h3>
        {summary.band ? (
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${band.badge}`}>
            {band.label}
          </span>
        ) : null}
      </div>
      {sampleData ? (
        <p className="mt-2 text-xs font-medium text-amber-700">Sample data</p>
      ) : null}
      <div className={`mt-4 text-5xl font-bold leading-none ${summary.overall === null ? 'text-slate-400' : band.score}`}>
        {summary.overall ?? '—'}
      </div>
      <div className="mt-4 space-y-3">
        {summary.metrics.map((metric) => (
          <div key={metric.key} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span>{metric.label}</span>
              <span>{metric.value ?? '—'}</span>
            </div>
            {metric.value !== null ? (
              <div className="h-2 w-full rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-blue-500"
                  style={{ width: `${Math.max(0, Math.min(100, metric.value))}%` }}
                />
              </div>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">{metric.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {summary.overall === null
          ? 'Score unavailable — no successful metric inputs yet.'
          : `Score based on ${summary.basedOn} of ${summary.totalInputs} inputs${summary.unavailableLabels.length > 0 ? ` — ${summary.unavailableLabels.join(' and ')} unavailable` : ''}.`}
      </p>
      <Link to="/integrations/log360" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
        View details →
      </Link>
    </div>
  );
}
