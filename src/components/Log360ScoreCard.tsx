import { Link } from 'react-router-dom';
import type { Log360Summary } from '../api/integrations';

export type Log360ScoreCardState = 'loading' | 'not-configured' | 'error' | 'ok';

interface Log360ScoreCardProps {
  state: Log360ScoreCardState;
  summary?: Log360Summary;
  error?: string;
  onRetry?: () => void;
}

const breakdownItems = [
  { key: 'health', label: 'Health' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'detection', label: 'Detection' },
  { key: 'response', label: 'Response' },
] as const;

function getBandClasses(band: Log360Summary['score']['band']) {
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

export default function Log360ScoreCard({ state, summary, error, onRetry }: Log360ScoreCardProps) {
  if (state === 'loading') {
    return (
      <div className="card p-6 animate-pulse" aria-label="Loading Log360 compliance score">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-20 rounded bg-slate-200" />
        <div className="mt-4 space-y-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-3 w-full rounded bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (state === 'not-configured') {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700">Log360 Compliance Score</h3>
        <p className="mt-3 text-sm text-slate-600">🔌 Connect Log360 to see your score.</p>
        <Link
          to="/admin/credentials"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Add Credential
        </Link>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="card p-6 border-red-300 bg-red-50/30">
        <h3 className="text-sm font-semibold text-red-800">Log360 Compliance Score</h3>
        <p className="mt-2 text-sm text-red-700">{error ?? 'Failed to fetch Log360 score.'}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const band = getBandClasses(summary.score.band);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Log360 Compliance Score</h3>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${band.badge}`}>
          {band.label}
        </span>
      </div>
      <div className={`mt-4 text-5xl font-bold leading-none ${band.score}`}>{summary.score.overall}</div>
      <div className="mt-4 space-y-2">
        {breakdownItems.map((item) => {
          const breakdown = summary.score.breakdown[item.key];
          return (
            <div key={item.key}>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{item.label}</span>
                <span>{breakdown.score}</span>
              </div>
              <div className="h-2 w-full rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-blue-500"
                  style={{ width: `${Math.max(0, Math.min(100, breakdown.score))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Link to="/integrations/log360" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
        View details →
      </Link>
    </div>
  );
}
