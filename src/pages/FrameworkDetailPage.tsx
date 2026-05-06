import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Plug, Filter } from 'lucide-react';
import { getFrameworkById } from '../data/frameworks';
import { hipaaControls } from '../data/controls/hipaa';
import { pcidssControls } from '../data/controls/pcidss';
import { soc2Controls } from '../data/controls/soc2';
import { nistcsfControls } from '../data/controls/nistcsf';
import { iso27001Controls } from '../data/controls/iso27001';
import { Control } from '../types';
import ControlCard from '../components/ControlCard';
import NotFoundPage from './NotFoundPage';

const controlsMap: Record<string, Control[]> = {
  hipaa: hipaaControls,
  pcidss: pcidssControls,
  soc2: soc2Controls,
  nistcsf: nistcsfControls,
  iso27001: iso27001Controls,
};

export default function FrameworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const framework = getFrameworkById(id ?? '');
  const controls = controlsMap[id ?? ''] ?? [];

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  if (!framework) return <NotFoundPage />;

  const categories = ['all', ...Array.from(new Set(controls.map((c) => c.category)))];

  const filtered = controls.filter((c) => {
    const catMatch = categoryFilter === 'all' || c.category === categoryFilter;
    const scopeMatch =
      scopeFilter === 'all' ||
      (scopeFilter === 'in-scope' && c.inItScope) ||
      (scopeFilter === 'out-scope' && !c.inItScope);
    return catMatch && scopeMatch;
  });

  const primaryProducts = Array.from(
    new Set(
      controls
        .flatMap((c) => c.manageEngineProducts.filter((m) => m.primary).map((m) => m.productId))
    )
  );

  const avgCoverage = Math.round(
    controls.reduce(
      (sum, c) =>
        sum + c.manageEngineProducts.reduce((s, m) => s + (m.primary ? m.coverage : 0), 0),
      0
    ) / controls.length
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link to="/frameworks" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Frameworks
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6" style={{ borderTop: `4px solid ${framework.color}` }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{framework.fullName}</h1>
            <p className="text-slate-500 mt-1">{framework.description}</p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-500">Total Controls</p>
                <p className="text-2xl font-bold text-slate-900">{framework.controlCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">ME Coverage</p>
                <p className="text-2xl font-bold" style={{ color: framework.color }}>
                  {framework.meCoveragePercent}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Control Coverage</p>
                <p className="text-2xl font-bold text-slate-900">{avgCoverage}%</p>
              </div>
            </div>
          </div>
          <Link to="/connections" className="btn-primary shrink-0">
            <Plug className="w-4 h-4" />
            Connect & Score
          </Link>
        </div>

        {/* Primary Products */}
        {primaryProducts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Primary ManageEngine Products
            </p>
            <div className="flex flex-wrap gap-2">
              {primaryProducts.map((pid) => (
                <span
                  key={pid}
                  className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-medium"
                >
                  {pid}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'in-scope', label: 'IT Scope' },
            { id: 'out-scope', label: 'Out of IT Scope' },
          ].map(({ id: fid, label }) => (
            <button
              key={fid}
              onClick={() => setScopeFilter(fid)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                scopeFilter === fid
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls list */}
      {controls.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          <p>Controls for <strong>{framework.name}</strong> are coming in a future update.</p>
          <p className="text-sm mt-2">Currently fully mapped: HIPAA, PCI DSS v4.0.1, SOC 2, NIST CSF 2.0, ISO 27001:2022</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Showing {filtered.length} of {controls.length} controls
          </p>
          {filtered.map((control) => (
            <ControlCard key={control.id} control={control} />
          ))}
        </div>
      )}
    </div>
  );
}
