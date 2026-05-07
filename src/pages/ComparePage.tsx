import { useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { frameworks } from '../data/frameworks';
import {
  buildFrameworkSummary,
  buildThemeOverlap,
  buildOverlapNarratives,
  buildSharedProductCoverage,
} from '../utils/comparisonEngine';

const DEFAULT_SELECTION = ['hipaa', 'pcidss'];
const BAR_COLORS = ['#2563eb', '#0ea5e9', '#7c3aed', '#059669'];

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_SELECTION);

  const selectedFrameworks = useMemo(
    () => frameworks.filter((framework) => selectedIds.includes(framework.id)),
    [selectedIds]
  );

  const summary = useMemo(() => buildFrameworkSummary(selectedFrameworks), [selectedFrameworks]);
  const overlapRows = useMemo(() => buildThemeOverlap(selectedFrameworks), [selectedFrameworks]);
  const overlapNarratives = useMemo(
    () => buildOverlapNarratives(selectedFrameworks),
    [selectedFrameworks]
  );
  const sharedCoverage = useMemo(
    () => buildSharedProductCoverage(selectedFrameworks),
    [selectedFrameworks]
  );

  const chartData = useMemo(
    () =>
      sharedCoverage.slice(0, 10).map((item) => {
        const row: Record<string, string | number> = { product: item.productName };
        selectedFrameworks.forEach((framework) => {
          row[framework.id] = item.matrix[framework.id] ?? 0;
        });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Compare Frameworks</h1>
        <p className="text-slate-500 mt-1">
          Find overlapping controls and shared ManageEngine products across frameworks.
        </p>
      </div>

      <div className="card p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Select 2 to 4 frameworks</p>
        <div className="flex flex-wrap gap-2">
          {frameworks.map((framework) => {
            const selected = selectedIds.includes(framework.id);
            return (
              <button
                key={framework.id}
                type="button"
                onClick={() => toggleFramework(framework.id)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {framework.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Framework Summary</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-4">Framework Name</th>
              <th className="py-2 pr-4">Region</th>
              <th className="py-2 pr-4">Total Controls</th>
              <th className="py-2 pr-4">ME Coverage %</th>
              <th className="py-2 pr-4">Top ME Products</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={row.framework.id} className="border-b border-slate-100 text-slate-700">
                <td className="py-2 pr-4 font-medium">{row.framework.name}</td>
                <td className="py-2 pr-4">{row.framework.region.join(', ')}</td>
                <td className="py-2 pr-4">{row.totalControls}</td>
                <td className="py-2 pr-4">{row.framework.meCoveragePercent}%</td>
                <td className="py-2 pr-4">{row.topProducts.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Control Overlap Analysis</h2>
        <div className="space-y-2 mb-4">
          {overlapNarratives.map((narrative) => (
            <p key={narrative} className="text-sm text-slate-600">• {narrative}</p>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Theme</th>
                {selectedFrameworks.map((framework) => (
                  <th key={framework.id} className="py-2 pr-4">{framework.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overlapRows.map((row) => (
                <tr key={row.theme} className="border-b border-slate-100 text-slate-700">
                  <td className="py-2 pr-4 font-medium">{row.theme}</td>
                  {selectedFrameworks.map((framework) => (
                    <td key={`${row.theme}-${framework.id}`} className="py-2 pr-4">
                      {row.matrix[framework.id] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Shared ManageEngine Product Coverage</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="product" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            {selectedFrameworks.map((framework, index) => (
              <Bar
                key={framework.id}
                dataKey={framework.id}
                stackId="coverage"
                name={framework.name}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ManageEngine Bundle Recommendation</h3>
          <p className="text-sm text-blue-800 mb-2">
            Buying these 5 products gives maximum compliance leverage across selected frameworks:
          </p>
          <div className="flex flex-wrap gap-2">
            {sharedCoverage.slice(0, 5).map((item) => (
              <span
                key={item.productId}
                className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm text-blue-800"
              >
                {item.productName} ({item.total})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
