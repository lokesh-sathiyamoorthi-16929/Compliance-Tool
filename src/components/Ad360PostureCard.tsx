import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Ad360SummaryResponse } from '../types/ad360';

interface Ad360PostureCardProps {
  loading: boolean;
  error: string;
  summary: Ad360SummaryResponse | null;
}

function Tile({
  id,
  label,
  value,
  subtext,
  payload,
}: {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  payload: unknown;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-xs font-semibold text-blue-600 underline hover:text-blue-700"
      >
        {open ? '🔍 Hide raw AD360 data' : '🔍 View raw AD360 data'}
      </button>
      {open ? (
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
          {JSON.stringify({ tileId: id, payload }, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export default function Ad360PostureCard({ loading, error, summary }: Ad360PostureCardProps) {
  if (loading) {
    return (
      <div className="card p-6 animate-pulse" aria-label="Loading AD360 posture">
        <div className="h-4 w-56 rounded bg-slate-200" />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-28 rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 border-amber-200 bg-amber-50/40">
        <h3 className="text-sm font-semibold text-amber-800">AD360 / ADManager Plus Posture</h3>
        <p className="mt-2 text-sm text-amber-700">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-700">AD360 / ADManager Plus Posture</h3>
        <p className="mt-2 text-sm text-slate-600">
          No AD360 summary available yet. Connect AD360 and run a sync from the Connections page.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">AD360 / ADManager Plus Posture</h3>
        <Link to="/integrations/ad360" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          View details →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Tile
          id="users"
          label="Total Users"
          value={String(summary.users.total)}
          subtext={`Disabled: ${summary.users.disabled} · Locked: ${summary.users.lockedOut}`}
          payload={summary.users}
        />
        <Tile
          id="privileged"
          label="Privileged Users"
          value={String(summary.privilegedUsers.count)}
          subtext={summary.privilegedUsers.samNames.slice(0, 3).join(', ') || 'No privileged users returned'}
          payload={summary.privilegedUsers}
        />
        <Tile
          id="stale"
          label="Stale Accounts"
          value={String(summary.staleAccounts.count)}
          subtext={summary.staleAccounts.samNames.slice(0, 3).join(', ') || 'No stale accounts returned'}
          payload={summary.staleAccounts}
        />
        <Tile
          id="bitlocker"
          label="BitLocker %"
          value={`${summary.computers.bitlockerEnabledPct.toFixed(1)}%`}
          subtext={`Computers: ${summary.computers.total}`}
          payload={summary.computers}
        />
      </div>

      <div className="mt-4 space-y-1 text-xs italic text-slate-500">
        <p>MFA enrollment %: Not exposed by ADManager Plus API. Install M365 Manager Plus or Azure AD Graph to enable.</p>
        <p>Real-time auth events: Not exposed by ADManager Plus. Use ADAudit Plus (separate product) or your existing Log360 integration.</p>
        <p>Password complexity policy details: Use `PSO_APPLIED` attribute for advanced PSO inspection — basic policy not exposed by ADManager Plus.</p>
      </div>
    </div>
  );
}
