import { useMemo, useState } from 'react';
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
import Log360ScoreCard, { type Log360ScoreCardState } from '../components/Log360ScoreCard';
import { isDemoMode } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';
import { scoreFramework } from '../engine/scoring';
import { useLog360Evidence } from '../hooks/useLog360Evidence';

const PIE_COLORS = ['#22c55e', '#ef4444', '#f97316', '#94a3b8'];

function toast(msg: string) {
  // Simple toast using alert for MVP
  alert(msg);
}

export default function DashboardPage() {
  const { selectedFrameworkId, setSelectedFrameworkId } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const [showFwDropdown, setShowFwDropdown] = useState(false);
  const [exportingReport, setExportingReport] = useState<'executive' | 'auditor' | null>(null);
  const [showScoreHelp, setShowScoreHelp] = useState(false);

  const { connections, log360Evidence, attestations } = useAppStore();
  const liveScoring = useMemo(() => {
    if (!log360Evidence || !connections.log360.connected) return null;
    return scoreFramework(selectedFrameworkId, log360Evidence, { attestations });
  }, [attestations, connections.log360.connected, log360Evidence, selectedFrameworkId]);

  const scoreData = useMemo(() => {
    if (!liveScoring) {
      return getScoreData(selectedFrameworkId);
    }

    const passed = liveScoring.controls.filter((control) => control.normalizedScore >= 80).length;
    const failed = liveScoring.controls.filter((control) => control.normalizedScore < 40).length;
    const partial = liveScoring.controls.filter((control) => control.normalizedScore >= 40 && control.normalizedScore < 80).length;
    const notApplicable = 0;

    return {
      frameworkId: selectedFrameworkId,
      overallScore: liveScoring.overall,
      trend: getScoreData(selectedFrameworkId).trend,
      familyScores: (liveScoring.themes ?? []).map((score) => ({
        family: score.name,
        score: score.score,
        controlCount: liveScoring.controls.filter((control) => control.control?.theme === score.id || control.control?.safeguard === score.id).length,
      })),
      passed,
      failed,
      partial,
      notApplicable,
      remediationActions: getScoreData(selectedFrameworkId).remediationActions,
    };
  }, [liveScoring, selectedFrameworkId]);
  const framework = frameworks.find((f) => f.id === selectedFrameworkId);
  const anyConnected = connections.log360.connected || connections.ad360.connected;
  const demoMode = isDemoMode();
  const canShowLog360Card = demoMode || user?.role === 'admin';
  const { overview: log360Summary, loading: log360Loading, error: log360Error, refresh: refreshLog360Evidence } = useLog360Evidence({
    autoRefresh: canShowLog360Card && !demoMode,
  });
  const log360CardState: Log360ScoreCardState = demoMode
    ? 'not-configured'
    : log360Loading
      ? 'loading'
      : !log360Summary?.configured
        ? 'not-configured'
        : log360Summary
          ? 'ok'
          : 'error';

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
          <p className="text-slate-500 mt-1" aria-live="polite">
            {connections.log360.connected
              ? `Status: Connected to Log360 at ${connections.log360.serverUrl}`
              : 'Status: Disconnected. Mock assessment data — connect your tools for live data.'}
          </p>
          {liveScoring ? (
            <p className="text-xs text-slate-500 mt-1">
              Rubric {liveScoring.rubric.toUpperCase()} · NIST CSF Tier {liveScoring.nistTier} · Generated {new Date(liveScoring.generatedAt).toLocaleString()}
            </p>
          ) : null}
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

      {canShowLog360Card ? (
        <div className="mb-6 ml-auto w-full max-w-md">
          <Log360ScoreCard
            state={log360CardState}
            summary={log360Summary ?? undefined}
            error={log360Error}
            onRetry={() => {
              void refreshLog360Evidence();
            }}
          />
        </div>
      ) : null}

      {/* Top metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Score gauge */}
        <div className="card p-6 flex flex-col items-center">
          {/* Narrative above gauge */}
          <div className="w-full mb-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800">
            Your <strong>{framework?.name ?? 'compliance'}</strong> posture is{' '}
            <strong>
              {scoreData.overallScore >= 80 ? 'Managed (Tier 4)' : scoreData.overallScore >= 60 ? 'Defined (Tier 3)' : scoreData.overallScore >= 40 ? 'Developing (Tier 2)' : 'Initial (Tier 1)'}
            </strong>
            . Closing the top gaps below would advance your tier and reduce audit risk.
          </div>
          {liveScoring ? (
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700">
                {liveScoring.rubric.toUpperCase()}
              </span>
              <span className="text-slate-600">NIST Tier {liveScoring.nistTier}</span>
            </div>
          ) : null}
          <ScoreGauge score={scoreData.overallScore} size={200} />
          <div className="mt-3 text-center">
            <MaturityBadge score={scoreData.overallScore} size="md" />
            {liveScoring ? (
              <button
                type="button"
                onClick={() => setShowScoreHelp(true)}
                className="mt-2 block text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                ⓘ How is this calculated?
              </button>
            ) : null}
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

      {showScoreHelp && liveScoring ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Score methodology</h3>
            <p className="mt-1 text-sm text-slate-600">Rubric: <strong>{liveScoring.rubric.toUpperCase()}</strong> · Formula: average control maturity score → theme averages → overall score.</p>
            <p className="mt-1 text-xs text-slate-500">NIST tiers: ≥80 Tier 4, ≥60 Tier 3, ≥40 Tier 2, otherwise Tier 1.</p>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2">Control</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {liveScoring.controls.map((control) => (
                    <tr key={control.controlId} className="border-t border-slate-100">
                      <td className="px-3 py-2">{control.controlId}</td>
                      <td className="px-3 py-2">L{control.achievedLevel}</td>
                      <td className="px-3 py-2">{control.normalizedScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setShowScoreHelp(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
