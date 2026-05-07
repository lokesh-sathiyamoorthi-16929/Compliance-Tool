import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Download, GitBranch, ChevronDown, Plug, ArrowUpRight, Loader2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { frameworks } from '../data/frameworks';
import { getScoreData } from '../data/mockScoreData';
import ScoreGauge from '../components/ScoreGauge';
import MaturityBadge from '../components/MaturityBadge';
import RemediationItem from '../components/RemediationItem';
import { exportExecutivePdf, exportAuditorPdf } from '../utils/pdfExport';

const PIE_COLORS = ['#22c55e', '#ef4444', '#f97316', '#94a3b8'];

function toast(msg: string) {
  // Simple toast using alert for MVP
  alert(msg);
}

export default function DashboardPage() {
  const { selectedFrameworkId, setSelectedFrameworkId } = useAppStore();
  const [showFwDropdown, setShowFwDropdown] = useState(false);
  const [exportingReport, setExportingReport] = useState<'executive' | 'auditor' | null>(null);

  const scoreData = getScoreData(selectedFrameworkId);
  const framework = frameworks.find((f) => f.id === selectedFrameworkId);
  const { connections } = useAppStore();
  const anyConnected = connections.log360.connected || connections.ad360.connected;

  const pieData = [
    { name: 'Passed', value: scoreData.passed },
    { name: 'Failed', value: scoreData.failed },
    { name: 'Partial', value: scoreData.partial },
    { name: 'N/A', value: scoreData.notApplicable },
  ];

  const trendChange =
    scoreData.trend.length >= 2
      ? scoreData.trend[scoreData.trend.length - 1].score -
        scoreData.trend[scoreData.trend.length - 2].score
      : 0;

  const handleExecutiveExport = async () => {
    if (!framework) return;
    setExportingReport('executive');
    await exportExecutivePdf(framework, scoreData);
    setExportingReport(null);
    toast('Report downloaded ✓');
  };

  const handleAuditorExport = async () => {
    if (!framework) return;
    setExportingReport('auditor');
    await exportAuditorPdf(framework, scoreData);
    setExportingReport(null);
    toast('Report downloaded ✓');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Dashboard</h1>
          <p className="text-slate-500 mt-1">Mock assessment data — connect your tools for live data.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Framework selector */}
          <div className="relative">
            <button
              onClick={() => setShowFwDropdown(!showFwDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <GitBranch className="w-4 h-4 text-slate-400" />
              {framework?.name ?? 'Select Framework'}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {showFwDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
                {frameworks.map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => {
                      setSelectedFrameworkId(fw.id);
                      setShowFwDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      fw.id === selectedFrameworkId
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {fw.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExecutiveExport}
            className="btn-secondary text-sm"
            disabled={exportingReport !== null}
            aria-label="Export executive PDF report"
            aria-busy={exportingReport === 'executive'}
          >
            {exportingReport === 'executive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Executive PDF
          </button>
          <button
            onClick={handleAuditorExport}
            className="btn-secondary text-sm"
            disabled={exportingReport !== null}
            aria-label="Export auditor compliance report"
            aria-busy={exportingReport === 'auditor'}
          >
            {exportingReport === 'auditor' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Auditor Report
          </button>
        </div>
      </div>

      {/* Connect banner */}
      {!anyConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            <strong>Demo mode:</strong> Showing mock data. Connect your ManageEngine products for live assessment.
          </p>
          <Link to="/connections" className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 hover:text-amber-900 underline">
            <Plug className="w-4 h-4" />
            Connect Tools
          </Link>
        </div>
      )}

      {/* Top metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Score gauge */}
        <div className="card p-6 flex flex-col items-center">
          <ScoreGauge score={scoreData.overallScore} size={200} />
          <div className="mt-3 text-center">
            <MaturityBadge score={scoreData.overallScore} size="md" />
            <div className="flex items-center gap-1 justify-center mt-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">
                ↑ +{trendChange}% from last month
              </span>
            </div>
          </div>
        </div>

        {/* Score trend */}
        <div className="card p-6 col-span-2" id="trend-chart">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Score Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={scoreData.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Score']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Bar chart */}
        <div className="card p-6" id="family-chart">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Score by Control Family</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={scoreData.familyScores}
              margin={{ left: 0, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis
                type="category"
                dataKey="family"
                tick={{ fontSize: 10 }}
                width={140}
                stroke="#94a3b8"
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Score']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="score" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Control Coverage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-xs text-slate-600">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Remediation */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Top {scoreData.remediationActions.length} Remediation Actions
          </h3>
          <Link
            to={`/frameworks/${selectedFrameworkId}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Controls
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {scoreData.remediationActions.map((action, i) => (
            <RemediationItem key={action.id} action={action} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
