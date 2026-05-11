import { useEffect, useState } from 'react';
import { Ad360Client } from '../../services/ad360Client';
import type { Ad360SummaryResponse } from '../../types/ad360';

export default function Ad360DetailPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<Ad360SummaryResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setSummary(await new Ad360Client().getSummary());
      } catch (err) {
        setSummary(null);
        setError(err instanceof Error ? err.message : 'Failed to load AD360 details.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading AD360 details">
        <div className="h-10 w-72 rounded bg-slate-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-900">AD360 / ADManager Plus Posture</h1>
        <p className="mt-2 text-sm text-amber-800">
          {error || 'Backend proxy not yet deployed — see docs/integrations/ad360/backend-proxy-spec.md'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AD360 / ADManager Plus Details</h1>
        <p className="mt-1 text-sm text-slate-500">Offending objects returned by backend summary derivations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Privileged Users ({summary.privilegedUsers.count})</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {summary.privilegedUsers.samNames.map((sam) => <li key={sam}>{sam}</li>)}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Stale Accounts ({summary.staleAccounts.count})</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {summary.staleAccounts.samNames.map((sam) => <li key={sam}>{sam}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
