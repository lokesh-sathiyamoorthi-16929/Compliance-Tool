import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ApiError } from '../api/client';
import { log360Api } from '../api/integrations';
import type { Log360Summary } from '../api/integrations';
import Log360ScoreCard, { type Log360ScoreCardState } from '../components/Log360ScoreCard';
import { isDemoMode } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';
import { runControlChecks } from '../engine/controlChecks';
import { scoreFramework } from '../engine/scoringEngine';
import { useLog360 } from '../hooks/useLog360';

const PIE_COLORS = ['#22c55e', '#ef4444', '#f97316', '#94a3b8'];

const demoLog360Summary: Log360Summary = {
  configured: true,
  ok: true,
  productVersion: 'Demo 1.0.0',
  fetchedAt: new Date().toISOString(),
  sources: {
    total: 12,
    online: 10,
    offline: 1,
    unknown: 1,
    samples: [],
  },
  alerts: {
    total: 26,
    open: 8,
    closed: 18,
    bySeverity: {
      low: 5,
      medium: 9,
      high: 7,
      critical: 5,
    },
    samples: [],
  },
  retention: {
    retentionDays: 180,
    archiveEnabled: true,
  },
  score: {
    overall: 78,
    breakdown: {
      health: { score: 82, weight: 20, reason: 'Connection and API checks are mostly stable.' },
      coverage: { score: 75, weight: 20, reason: 'Some monitored sources remain offline.' },
      detection: { score: 80, weight: 20, reason: 'Alert detection is active across key sources.' },
      response: { score: 72, weight: 20, reason: 'Open alert backlog should be reduced.' },
      retention: { score: 81, weight: 20, reason: 'Retention policy is configured with archive enabled.' },
    },
    band: 'attention',
  },
  errors: [],
};

function toast(msg: string) {
  // Simple toast using alert for MVP
  alert(msg);
}

export default function DashboardPage() {
  const { selectedFrameworkId, setSelectedFrameworkId } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const [showFwDropdown, setShowFwDropdown] = useState(false);
  const [exportingReport, setExportingReport] = useState<'executive' | 'auditor' | null>(null);
  const [log360CardState, setLog360CardState] = useState<Log360ScoreCardState>('loading');
  const [log360Summary, setLog360Summary] = useState<Log360Summary | undefined>(undefined);
  const [log360Error, setLog360Error] = useState('');
  const [liveKpis, setLiveKpis] = useState({
    logSourcesConfigured: 12,
    agentsOnline: 10,
    openIncidents30d: 4,
    criticalAlerts7d: 3,
    reportsAvailable: 18,
  });

  const { connections, log360Evidence } = useAppStore();
  const { client: log360Client } = useLog360();
  const liveScoring = useMemo(() => {
    if (!log360Evidence || !connections.log360.connected) return null;
    if (selectedFrameworkId !== 'hipaa' && selectedFrameworkId !== 'pcidss') return null;
    const checks = runControlChecks(selectedFrameworkId, log360Evidence);
    return scoreFramework(checks, log360Evidence);
  }, [connections.log360.connected, log360Evidence, selectedFrameworkId]);

  const scoreData = useMemo(() => {
    if (!liveScoring) {
      return getScoreData(selectedFrameworkId);
    }

    const passed = liveScoring.controlResults.flatMap((result) => result.checks).filter((check) => check.result.status === 'pass').length;
    const failed = liveScoring.controlResults.flatMap((result) => result.checks).filter((check) => check.result.status === 'fail').length;
    const partial = liveScoring.controlResults.flatMap((result) => result.checks).filter((check) => check.result.status === 'partial').length;
    const notApplicable = liveScoring.controlResults.flatMap((result) => result.checks).filter((check) => check.result.status === 'not_applicable').length;

    return {
      frameworkId: selectedFrameworkId,
      overallScore: liveScoring.frameworkScore,
      trend: getScoreData(selectedFrameworkId).trend,
      familyScores: liveScoring.familyScores.map((score) => ({
        family: score.family,
        score: score.score,
        controlCount: score.checkCount,
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
  const showSampleBanner = !connections.log360.connected;

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

  const loadLog360Summary = useCallback(async () => {
    if (!canShowLog360Card) return;

    if (demoMode) {
      setLog360Summary(demoLog360Summary);
      setLog360Error('');
      setLog360CardState('ok');
      return;
    }

    setLog360CardState('loading');
    setLog360Error('');

    try {
      const summary = await log360Api.summary();
      setLog360Summary(summary);

      if (!summary.configured) {
        setLog360CardState('not-configured');
        return;
      }

      if (!summary.ok) {
        setLog360CardState('error');
        setLog360Error(summary.errors[0] ?? 'Log360 is configured but unreachable.');
        return;
      }

      setLog360CardState('ok');
    } catch (err) {
      setLog360CardState('error');
      setLog360Error(err instanceof ApiError ? err.message : 'Failed to fetch Log360 score.');
    }
  }, [canShowLog360Card, demoMode]);

  useEffect(() => {
    void loadLog360Summary();
  }, [loadLog360Summary]);

  useEffect(() => {
    const loadKpis = async () => {
      if (!connections.log360.connected) {
        setLiveKpis({
          logSourcesConfigured: 12,
          agentsOnline: 10,
          openIncidents30d: 4,
          criticalAlerts7d: 3,
          reportsAvailable: 18,
        });
        return;
      }

      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [sources, agents, incidents, alerts, profiles] = await Promise.all([
          log360Client.logSources.list({ limit: 1 }),
          log360Client.logSources.listAgents(),
          log360Client.incidents.list({ status: 'open', from_time: thirtyDaysAgo, limit: 200 }),
          log360Client.alerts.list({ severity: 'critical', from_time: sevenDaysAgo, limit: 200 }),
          log360Client.reports.listProfiles({ limit: 200 }),
        ]);

        setLiveKpis({
          logSourcesConfigured: sources.total,
          agentsOnline: agents.filter((agent) => (agent.status ?? '').toLowerCase() === 'online').length,
          openIncidents30d: incidents.total,
          criticalAlerts7d: alerts.total,
          reportsAvailable: profiles.length,
        });
      } catch {
        setLiveKpis({
          logSourcesConfigured: 12,
          agentsOnline: 10,
          openIncidents30d: 4,
          criticalAlerts7d: 3,
          reportsAvailable: 18,
        });
      }
    };

    void loadKpis();
  }, [connections.log360.connected, log360Client.alerts, log360Client.incidents, log360Client.logSources, log360Client.reports]);

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
              {liveScoring.pendingManualCount} controls pending manual review · evidence collected {new Date(liveScoring.lastEvidenceTimestamp).toLocaleString()}
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
      {showSampleBanner ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 mb-6 text-sm text-blue-800">
          Showing sample data — connect Log360 in Connections to see live posture.
        </div>
      ) : null}

      {canShowLog360Card ? (
        <div className="mb-6 ml-auto w-full max-w-md">
          <Log360ScoreCard
            state={log360CardState}
            summary={log360Summary}
            error={log360Error}
            onRetry={() => {
              void loadLog360Summary();
            }}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Log Sources Configured', value: liveKpis.logSourcesConfigured },
          { label: 'Agents Online', value: liveKpis.agentsOnline },
          { label: 'Open Incidents (30d)', value: liveKpis.openIncidents30d },
          { label: 'Critical Alerts (7d)', value: liveKpis.criticalAlerts7d },
          { label: 'Reports Available', value: liveKpis.reportsAvailable },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs font-semibold text-slate-500">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
          </div>
        ))}
      </div>

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
