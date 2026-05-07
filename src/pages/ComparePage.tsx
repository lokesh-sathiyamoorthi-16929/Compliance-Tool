import { useMemo, useState } from 'react';
import {
  BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Target, Package2, Layers, ChevronDown, ChevronUp, ExternalLink,
  ScrollText, UserCheck, Users, Network, Shield, Monitor, Key,
  Lock, AlertTriangle, Settings, Search, ClipboardList, BarChart3,
} from 'lucide-react';
import { frameworks } from '../data/frameworks';
import {
  buildFrameworkSummary,
  buildThemeOverlap,
  buildSharedProductCoverage,
  computeOverlapPercent,
  computeEffortReduction,
  buildBundleRecommendation,
} from '../utils/comparisonEngine';

const DEFAULT_SELECTION = ['hipaa', 'pcidss'];
const BAR_COLORS = ['#2563eb', '#0ea5e9', '#7c3aed', '#059669'];

const PRODUCT_ICONS: Record<string, typeof Package2> = {
  log360: ScrollText,
  adaudit: UserCheck,
  admanager: Users,
  ad360: Network,
  datasecurity: Shield,
  endpoint: Monitor,
  pam360: Key,
  pmp: Key,
  patchmanager: Monitor,
  vulnmanager: Shield,
};

const THEME_ICONS: Record<string, typeof Lock> = {
  'Audit Logging': ScrollText,
  'Access Control': Lock,
  'Encryption': Shield,
  'Incident Response': AlertTriangle,
  'Monitoring & Detection': Monitor,
  'Configuration Management': Settings,
  'Identity & Authentication': UserCheck,
  'Vulnerability Management': Search,
  'Risk Assessment': ClipboardList,
};

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_SELECTION);
  const [showAllThemes, setShowAllThemes] = useState(false);

  const selectedFrameworks = useMemo(
    () => frameworks.filter((fw) => selectedIds.includes(fw.id)),
    [selectedIds]
  );

  const summary = useMemo(() => buildFrameworkSummary(selectedFrameworks), [selectedFrameworks]);
  const overlapRows = useMemo(() => buildThemeOverlap(selectedFrameworks), [selectedFrameworks]);
  const sharedCoverage = useMemo(() => buildSharedProductCoverage(selectedFrameworks), [selectedFrameworks]);
  const overlapPercent = useMemo(() => computeOverlapPercent(selectedFrameworks), [selectedFrameworks]);
  const effortReduction = useMemo(() => computeEffortReduction(selectedFrameworks), [selectedFrameworks]);
  const bundleProducts = useMemo(() => buildBundleRecommendation(selectedFrameworks), [selectedFrameworks]);

  const chartData = useMemo(
    () =>
      sharedCoverage.slice(0, 10).map((item) => {
        const row: Record<string, string | number> = { product: item.productName };
        selectedFrameworks.forEach((fw) => { row[fw.id] = item.matrix[fw.id] ?? 0; });
        return row;
      }),
    [sharedCoverage, selectedFrameworks]
  );

  const toggleFramework = (frameworkId: string) => {
    const isSelected = selectedIds.includes(frameworkId);
    if (isSelected) {
      if (selectedIds.length <= 2) return;
      setSelectedIds(selectedIds.filter((id) => id !== frameworkId));
      return;
    }
    if (selectedIds.length >= 4) return;
    setSelectedIds([...selectedIds, frameworkId]);
  };

  const visibleThemes = showAllThemes ? overlapRows : overlapRows.slice(0, 8);

  const productsCountCoveringAll = bundleProducts.filter((p) => p.frameworkCount === selectedFrameworks.length).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Compare Frameworks</h1>
        <p className="text-slate-500 mt-1">
          Stop duplicating work. See how your selected frameworks overlap — and the ManageEngine bundle that covers them all.
        </p>
      </div>

      {/* Framework picker */}
      <div className="card p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Select 2 to 4 frameworks</p>
        <div className="flex flex-wrap gap-2">
          {frameworks.map((fw) => {
            const selected = selectedIds.includes(fw.id);
            return (
              <button
                key={fw.id}
                type="button"
                onClick={() => toggleFramework(fw.id)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {fw.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION A: Hero Insight Bar ─── */}
      <div className="card p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Smart Compliance Strategy</h2>
          <p className="text-slate-500 mt-1 max-w-2xl mx-auto">
            Stop duplicating work. Here's how your selected frameworks overlap — and the ManageEngine bundle that covers them all.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Overlap % */}
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-5xl font-extrabold text-blue-600 mb-1">{overlapPercent}%</div>
            <div className="font-semibold text-slate-700 text-sm mb-1">Control Overlap</div>
            <p className="text-xs text-slate-500">
              of controls share the same security objective across selected frameworks
            </p>
            <div title="Calculated as: controls whose theme appears in more than one selected framework ÷ total controls across all selected frameworks">
              <Target className="w-4 h-4 text-blue-400 mx-auto mt-2 cursor-help" />
            </div>
          </div>

          {/* Products covering all */}
          <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="text-5xl font-extrabold text-emerald-600 mb-1">{productsCountCoveringAll || bundleProducts.length}</div>
            <div className="font-semibold text-slate-700 text-sm mb-1">Products Cover All</div>
            <p className="text-xs text-slate-500">
              ManageEngine products satisfy the majority of controls across all selected frameworks
            </p>
            <div title="Count of top bundle products that appear in controls for all selected frameworks">
              <Layers className="w-4 h-4 text-emerald-400 mx-auto mt-2 cursor-help" />
            </div>
          </div>

          {/* Effort reduction */}
          <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="text-5xl font-extrabold text-amber-500 mb-1">
              {effortReduction.total} → {effortReduction.unique}
            </div>
            <div className="font-semibold text-slate-700 text-sm mb-1">Effort Reduction</div>
            <p className="text-xs text-slate-500">
              unique control themes to implement (down from {effortReduction.total} if you treated frameworks separately)
            </p>
            <div title="Calculated as: total controls across frameworks → count of unique implementation themes. Themes map to one implementation effort.">
              <BarChart3 className="w-4 h-4 text-amber-400 mx-auto mt-2 cursor-help" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION B: Where You Save Effort (overlap themes) ─── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-semibold text-slate-900">Where You Save Effort</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Each row is a security theme shared across multiple frameworks. Implement once, satisfy many.
        </p>
        <div className="space-y-3">
          {visibleThemes.map((row) => {
            const ThemeIcon = THEME_ICONS[row.theme] ?? ClipboardList;
            const frameworksInTheme = selectedFrameworks.filter((fw) => (row.matrix[fw.id] ?? 0) > 0);
            return (
              <div key={row.theme} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <ThemeIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{row.theme}</p>
                    <p className="text-xs text-slate-500">
                      Appears in{' '}
                      <strong className="text-slate-700">{frameworksInTheme.length}</strong>{' '}
                      {frameworksInTheme.length === 1 ? 'framework' : 'frameworks'} — implement once, satisfy{' '}
                      {frameworksInTheme.length > 1 ? 'all' : 'it'}.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {frameworksInTheme.map((fw) => (
                    <span
                      key={fw.id}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: fw.color }}
                    >
                      {fw.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {overlapRows.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllThemes((v) => !v)}
            className="mt-3 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            {showAllThemes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAllThemes ? 'Show fewer themes' : `Show all ${overlapRows.length} themes`}
          </button>
        )}
      </div>

      {/* ─── SECTION C: ManageEngine Bundle ─── */}
      <div className="card p-5 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center gap-2 mb-1">
          <Package2 className="w-5 h-5 text-blue-700" />
          <h2 className="text-lg font-semibold text-blue-900">
            Recommended ManageEngine Bundle for {selectedFrameworks.map((fw) => fw.name).join(' + ')}
          </h2>
        </div>
        <p className="text-sm text-blue-700 mb-4">
          These products maximize control coverage across all selected frameworks with minimal overlap.
        </p>
        <div className="space-y-3">
          {bundleProducts.map((product) => {
            const ProductIcon = PRODUCT_ICONS[product.productId] ?? Package2;
            return (
              <div key={product.productId} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-xl border border-blue-200 p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: product.color + '20' }}>
                    <ProductIcon className="w-5 h-5" style={{ color: product.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{product.shortName}</p>
                    <p className="text-xs text-slate-500">{product.category}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 mb-1">
                    Covers <span className="text-blue-700">{product.coverageCount} controls</span> across{' '}
                    <span className="text-blue-700">{product.frameworkCount}</span> {product.frameworkCount === 1 ? 'framework' : 'frameworks'}
                  </p>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(product.coveragePercent * 3, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {bundleProducts.length > 0 && (
          <p className="text-sm font-semibold text-blue-800 mt-4 border-t border-blue-200 pt-4">
            Together, these {bundleProducts.length} products cover the majority of controls across your selected frameworks.
          </p>
        )}
        <div className="mt-4">
          <a
            href="https://www.manageengine.com/contact-us.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
          >
            Talk to ManageEngine Sales
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ─── SECTION D: Framework Summary (simplified) ─── */}
      <div className="card p-5 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Framework Comparison</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-4">Framework</th>
              <th className="py-2 pr-4">Region</th>
              <th className="py-2 pr-4">Controls</th>
              <th className="py-2 pr-4">ME Coverage</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={row.framework.id} className="border-b border-slate-100 text-slate-700">
                <td className="py-2 pr-4 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.framework.color }} />
                    {row.framework.name}
                  </span>
                </td>
                <td className="py-2 pr-4">{row.framework.region.join(', ')}</td>
                <td className="py-2 pr-4">{row.totalControls}</td>
                <td className="py-2 pr-4">
                  <span className="font-semibold" style={{ color: row.framework.color }}>
                    {row.framework.meCoveragePercent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── SECTION E: Coverage Heatmap ─── */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Coverage Heatmap — ManageEngine Products by Framework
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Taller bars = more control coverage. Use this to spot which products give you the most leverage.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="product" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {selectedFrameworks.map((fw, index) => (
              <Bar key={fw.id} dataKey={fw.id} stackId="coverage" name={fw.name} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
