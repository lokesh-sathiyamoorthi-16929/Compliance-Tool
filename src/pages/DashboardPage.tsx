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
import { getControlsByFrameworkId } from '../data/controls';
import ScoreGauge from '../components/ScoreGauge';
import MaturityBadge from '../components/MaturityBadge';
import RemediationItem from '../components/RemediationItem';
import { exportExecutivePdf, exportAuditorPdf } from '../utils/pdfExport';
import Log360ScoreCard, { type Log360ScoreCardState } from '../components/Log360ScoreCard';
import { isDemoMode } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';
import { scoreFramework, type FrameworkScore } from '../engine/scoring';
import { useLog360Evidence } from '../hooks/useLog360Evidence';
import type { MockScoreData, RemediationAction } from '../types';
import Ad360PostureCard from '../components/Ad360PostureCard';
import { Ad360Client } from '../services/ad360Client';

const PIE_COLORS = ['#22c55e', '#ef4444', '#f97316', '#94a3b8'];

function toast(msg: string) {
  // Simple toast using alert for MVP
  alert(msg);
}

function buildLiveRemediationActions(
  frameworkId: string,
  liveScoring: FrameworkScore | null,
): RemediationAction[] {
  if (!liveScoring) return [];

  const controlsById = new Map(
    getControlsByFrameworkId(frameworkId).map((control) => [control.id, control]),
  );

  return liveScoring.controls
    .filter((controlScore) => controlScore.normalizedScore < 100)
    .sort((a, b) => a.normalizedScore - b.normalizedScore)
    .slice(0, 5)
    .map((controlScore, index) => {
      const control = controlScore.control ?? controlsById.get(controlScore.controlId);
      const primaryProduct = control?.manageEngineProducts.find((mapping) => mapping.primary)?.productId ?? 'log360';
      const scoreGap = Math.max(1, 100 - controlScore.normalizedScore);

      return {
        id: `live-rem-${index}-${controlScore.controlId}`,
        controlId: controlScore.controlId,
        controlTitle: control?.title ?? controlScore.controlId,
        scoreGain: Math.min(25, scoreGap),
        recommendedProduct: primaryProduct.toUpperCase(),
        actionDescription:
          control?.remediationSuggestions[0]
          ?? 'Sync fresh evidence and review this control with the audit team.',
        priority: scoreGap >= 40 ? 'critical' : scoreGap >= 25 ? 'high' : 'medium',
        effort: scoreGap >= 40 ? 'high' : 'medium',
      };
    });
}

export default function DashboardPage() {
  const { selectedFrameworkId, setSelectedFrameworkId } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const [showFwDropdown, setShowFwDropdown] = useState(false);
  const [exportingReport, setExportingReport] = useState<'executive' | 'auditor' | null>(null);
  const [showScoreHelp, setShowScoreHelp] = useState(false);
  const [openRawWidget, setOpenRawWidget] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState('');

  const { connections, log360Evidence, attestations, ad360Summary, setAd360Summary } = useAppStore();
  const demoMode = isDemoMode();
  const liveScoring = useMemo(() => {
    if (!log360Evidence || !connections.log360.connected) return null;
    return scoreFramework(selectedFrameworkId, log360Evidence, { attestations, ad360Summary });
  }, [ad360Summary, attestations, connections.log360.connected, log360Evidence, selectedFrameworkId]);

  const scoreData = useMemo<MockScoreData | null>(() => {
    if (demoMode) {
      return getScoreData(selectedFrameworkId);
    }
    if (!liveScoring) return null;

    const { passed, failed, partial } = liveScoring.controls.reduce(
      (counts, control) => {
        if (control.normalizedScore >= 80) {
          counts.passed += 1;
        } else if (control.normalizedScore < 40) {
          counts.failed += 1;
        } else {
          counts.partial += 1;
        }
        return counts;
      },
      { passed: 0, failed: 0, partial: 0 },
    );
    const notApplicable = 0;

    const controlCountByTheme = new Map<string, number>();
    liveScoring.controls.forEach((control) => {
      const key = control.control?.theme ?? control.control?.safeguard;
      if (key) {
        controlCountByTheme.set(key, (controlCountByTheme.get(key) ?? 0) + 1);
      }
    });

    return {
      frameworkId: selectedFrameworkId,
      overallScore: liveScoring.overall,
      trend: [],
      familyScores: (liveScoring.themes ?? []).map((score) => ({
        family: score.name,
        score: score.score,
        controlCount: controlCountByTheme.get(score.id) ?? 0,
      })),
      passed,
      failed,
      partial,
      notApplicable,
      remediationActions: buildLiveRemediationActions(selectedFrameworkId, liveScoring),
    };
  }, [demoMode, liveScoring, selectedFrameworkId]);

  const framework = frameworks.find((f) => f.id === selectedFrameworkId);
  const hasLog360Connection = connections.log360.connected || Boolean(connections.log360.serverUrl) || Boolean(log360Evidence);
  const hasAd360Connection = connections.ad360.connected || Boolean(connections.ad360.serverUrl);
  const anyConnected = hasLog360Connection || connections.ad360.connected;
  const canShowLog360Card = demoMode || user?.role === 'admin' || hasLog360Connection;
  const { overview: log360Summary, loading: log360Loading, error: log360Error, refresh: refreshLog360Evidence } = useLog360Evidence({
    autoRefresh: !demoMode,
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

  useEffect(() => {
    if (demoMode || !hasAd360Connection) {
      setAd360Summary(null);
      setAdLoading(false);
      setAdError('');
      return;
    }

    const load = async () => {
      setAdLoading(true);
      setAdError('');
      try {
        const summary = await new Ad360Client().getSummary();
        setAd360Summary(summary);
      } catch (error) {
        setAd360Summary(null);
        setAdError(error instanceof Error ? error.message : 'Failed to load AD360 summary.');
      } finally {
        setAdLoading(false);
      }
    };

    void load();
  }, [demoMode, hasAd360Connection, setAd360Summary]);

  const pieData = scoreData
    ? [
        { name: 'Passed', value: scoreData.passed },
        { name: 'Failed', value: scoreData.failed },
        { name: 'Partial', value: scoreData.partial },
        { name: 'N/A', value: scoreData.notApplicable },
      ]
    : [];

  const trendChange =
    scoreData && scoreData.trend.length >= 2
      ? scoreData.trend[scoreData.trend.length - 1].score -
        scoreData.trend[scoreData.trend.length - 2].score
      : 0;

  const handleExecutiveExport = async () => {
    if (!framework || !scoreData) return;
    setExportingReport('executive');
    await exportExecutivePdf(framework, scoreData);
    setExportingReport(null);
    toast('Report downloaded ✓');
  };

  const handleAuditorExport = async () => {
    if (!framework || !scoreData) return;
    setExportingReport('auditor');
    await exportAuditorPdf(framework, scoreData);
    setExportingReport(null);
    toast('Report downloaded ✓');
  };

  const renderRawDataInspector = useCallback((widgetId: string, payload: unknown) => (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpenRawWidget((current) => (current === widgetId ? null : widgetId))}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
      >
        {openRawWidget === widgetId ? '🔍 Hide raw Log360 data' : '🔍 View raw Log360 data'}
      </button>
      {openRawWidget === widgetId ? (
        <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700">
          {JSON.stringify(payload ?? { message: 'Not collected yet — sync Log360 to populate this widget.' }, null, 2)}
        </pre>
      ) : null}
    </div>
  ), [openRawWidget]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Dashboard</h1>
          <p className="text-slate-500 mt-1" aria-live="polite">
            {demoMode
              ? 'Status: Demo mode enabled. Connect your tools for live evidence-backed scoring.'
              : hasLog360Connection
                ? `Status: Connected to Log360 at ${connections.log360.serverUrl}`
                : 'Status: Log360 not connected. Connect Log360 to start live scoring.'}
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
            disabled={exportingReport !== null || !scoreData}
            aria-label="Export executive PDF report"
            aria-busy={exportingReport === 'executive'}
          >
            {exportingReport === 'executive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Executive PDF
          </button>
          <button
            onClick={handleAuditorExport}
            className="btn-secondary text-sm"
            disabled={exportingReport !== null || !scoreData}
            aria-label="Export auditor compliance report"
            aria-busy={exportingReport === 'auditor'}
          >
            {exportingReport === 'auditor' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Auditor Report
          </button>
        </div>
      </div>

      {/* Connect banner */}
      {demoMode && !anyConnected && (
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
      {!demoMode && hasLog360Connection ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-green-800">
            <strong>✅ Log360 connected</strong> · Last sync:{' '}
            {connections.log360.lastSync ? new Date(connections.log360.lastSync).toLocaleString() : 'Not synced yet'}
          </p>
          <div className="flex items-center gap-3">
            <Link to="/connections" className="text-sm font-semibold text-green-800 underline hover:text-green-900">
              View Log360 connection
            </Link>
            <Link to="/wizard" className="text-sm font-semibold text-green-800 underline hover:text-green-900">
              Run Assessment
            </Link>
          </div>
        </div>
      ) : null}

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

      {!demoMode && hasAd360Connection ? (
        <div className="mb-6">
          <Ad360PostureCard loading={adLoading} error={adError} summary={ad360Summary} />
        </div>
      ) : null}

      {/* Top metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Score gauge */}
        <div className="card p-6 flex flex-col items-center">
          {scoreData ? (
            <>
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
                {scoreData.trend.length >= 2 ? (
                  <div className="flex items-center gap-1 justify-center mt-2 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      ↑ +{trendChange}% from last month
                    </span>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600 text-center">
              Not collected yet — sync Log360 to populate this widget.
            </p>
          )}
          {renderRawDataInspector('score-gauge', {
            collectedAt: log360Evidence?.collectedAt ?? null,
            frameworkId: selectedFrameworkId,
            rubric: liveScoring?.rubric ?? null,
            nistTier: liveScoring?.nistTier ?? null,
            overall: liveScoring?.overall ?? scoreData?.overallScore ?? null,
            controls: liveScoring?.controls ?? null,
            logSources: log360Evidence?.logSources ?? null,
            agents: log360Evidence?.agents ?? null,
            incidents: log360Evidence?.incidents ?? null,
            alerts: log360Evidence?.alerts ?? null,
            attestations,
          })}
        </div>

        {/* Score trend */}
        <div className="card p-6 col-span-2" id="trend-chart">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Score Trend (6 Months)</h3>
          {scoreData?.trend.length ? (
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
          ) : (
            <p className="text-sm text-slate-600">
              Not collected yet — sync Log360 to populate this chart.
            </p>
          )}
          {renderRawDataInspector('score-trend', {
            message: 'Historical trend data is not collected from Log360 yet.',
            collectedAt: log360Evidence?.collectedAt ?? null,
            frameworkId: selectedFrameworkId,
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Bar chart */}
        <div className="card p-6" id="family-chart">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Score by Control Family</h3>
          {scoreData && scoreData.familyScores.length > 0 ? (
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
          ) : (
            <p className="text-sm text-slate-600">
              Not collected yet — sync Log360 to populate this chart.
            </p>
          )}
          {renderRawDataInspector('family-scores', {
            collectedAt: log360Evidence?.collectedAt ?? null,
            themes: liveScoring?.themes ?? null,
            controls: liveScoring?.controls.map((control) => ({
              controlId: control.controlId,
              theme: control.control?.theme ?? control.control?.safeguard ?? null,
              score: control.normalizedScore,
            })) ?? null,
          })}
        </div>

        {/* Donut chart */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Control Coverage</h3>
          {scoreData ? (
            <>
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
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Not collected yet — sync Log360 to populate this chart.
            </p>
          )}
          {renderRawDataInspector('coverage', {
            collectedAt: log360Evidence?.collectedAt ?? null,
            pieData,
            controls: liveScoring?.controls.map((control) => ({
              controlId: control.controlId,
              normalizedScore: control.normalizedScore,
              achievedLevel: control.achievedLevel,
            })) ?? null,
          })}
        </div>
      </div>

      {/* Remediation */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Top {scoreData?.remediationActions.length ?? 0} Remediation Actions
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
          {scoreData && scoreData.remediationActions.length > 0 ? (
            scoreData.remediationActions.map((action, i) => (
              <RemediationItem key={action.id} action={action} rank={i + 1} />
            ))
          ) : (
            <p className="text-sm text-slate-600">
              Not collected yet — sync Log360 to populate this widget.
            </p>
          )}
        </div>
        {renderRawDataInspector('remediation', {
          collectedAt: log360Evidence?.collectedAt ?? null,
          remediationActions: scoreData?.remediationActions ?? null,
          controls: liveScoring?.controls.map((control) => ({
            controlId: control.controlId,
            normalizedScore: control.normalizedScore,
            title: control.control?.title ?? null,
          })) ?? null,
          sourceErrors: log360Evidence?.errors ?? null,
        })}
      </div>

      {showScoreHelp && liveScoring ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Score methodology</h3>
            <p className="mt-1 text-sm text-slate-600">
              Rubric: <strong>{liveScoring.rubric.toUpperCase()}</strong> · Formula: average control maturity score → theme averages → overall score.
            </p>
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
            {liveScoring.partialBasisNote ? (
              <p className="mt-3 text-xs text-amber-700">{liveScoring.partialBasisNote}</p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setShowScoreHelp(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
