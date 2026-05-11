import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle } from 'lucide-react';
import { Control } from '../types';
import { getProductById } from '../data/manageEngineProducts';
import type { ControlScore } from '../engine/scoring';
import { useAppStore } from '../store/useAppStore';
import { runControlChecks } from '../engine/controlChecks';
import { collectEvidence, type Evidence } from '../services/evidenceCollector';
import { Log360Client } from '../services/log360Client';

interface Props {
  control: Control;
  score?: ControlScore;
  onAttest?: (control: Control) => void;
}

export default function ControlCard({ control, score, onAttest }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [scoreState, setScoreState] = useState<'pass' | 'partial' | 'fail' | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState('');
  const connected = useAppStore((state) => state.connections.log360.connected);
  const log360Evidence = useAppStore((state) => state.log360Evidence);
  const setLog360Evidence = useAppStore((state) => state.setLog360Evidence);
  const updateConnection = useAppStore((state) => state.updateConnection);

  const scoringFramework = useMemo(
    () => (control.frameworkId === 'hipaa' || control.frameworkId === 'pcidss' ? control.frameworkId : null),
    [control.frameworkId],
  );

  const deriveControlState = useCallback((evidence: Evidence) => {
    if (!scoringFramework) return null;
    const checks = runControlChecks(scoringFramework, evidence).filter((check) => check.controlId === control.id);
    if (checks.length === 0) return null;
    if (checks.some((check) => check.result.status === 'fail')) return 'fail';
    if (checks.some((check) => check.result.status === 'partial' || check.result.status === 'evidence_pending')) return 'partial';
    if (checks.some((check) => check.result.status === 'pass')) return 'pass';
    return null;
  }, [control.id, scoringFramework]);

  useEffect(() => {
    if (!connected || !log360Evidence) {
      setScoreState(null);
      return;
    }
    setScoreState(deriveControlState(log360Evidence));
  }, [connected, deriveControlState, log360Evidence]);

  const handleRescore = () => {
    if (!connected || !log360Evidence) return;
    setScoreError('');
    setScoreState(deriveControlState(log360Evidence));
  };

  const handleSyncAndScore = async () => {
    setScoring(true);
    setScoreError('');
    try {
      const evidence = await collectEvidence(new Log360Client());
      setLog360Evidence(evidence);
      updateConnection('log360', { lastSync: evidence.collectedAt, connected: true });
      setScoreState(deriveControlState(evidence));
    } catch (error) {
      setScoreError(error instanceof Error ? error.message : 'Failed to sync Log360 evidence.');
    } finally {
      setScoring(false);
    }
  };

  const categoryColors: Record<string, string> = {
    Technical: 'bg-blue-50 text-blue-700 border-blue-200',
    Administrative: 'bg-purple-50 text-purple-700 border-purple-200',
    Physical: 'bg-orange-50 text-orange-700 border-orange-200',
    Organizational: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {control.id}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${categoryColors[control.category] ?? ''}`}
              >
                {control.category}
              </span>
              {control.required && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  Required
                </span>
              )}
              {control.addressable && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Addressable
                </span>
              )}
              {!control.inItScope && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  Out of IT Scope
                </span>
              )}
              {score ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  L{score.achievedLevel} · {score.rubric.toUpperCase()}
                </span>
              ) : null}
              {scoreState && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    scoreState === 'pass'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : scoreState === 'partial'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  Live score: {scoreState === 'pass' ? 'Pass' : scoreState === 'partial' ? 'Partial' : 'Fail'}
                </span>
              )}
            </div>
            <h4 className="font-semibold text-slate-900">{control.title}</h4>
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{control.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {control.manageEngineProducts.slice(0, 3).map((mapping) => {
                const product = getProductById(mapping.productId);
                if (!product) return null;

                return (
                  <span
                    key={mapping.productId}
                    className="text-xs px-2 py-0.5 rounded-full border font-medium"
                    style={{
                      color: product.color,
                      borderColor: `${product.color}55`,
                      backgroundColor: `${product.color}12`,
                    }}
                  >
                    {product.shortName}
                    {mapping.primary ? ' • Primary' : ''}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xs text-slate-500">Weight</p>
              <p className="font-bold text-slate-900">{control.weight}/5</p>
            </div>
            {!scoringFramework && onAttest ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onAttest(control);
                }}
                className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Attest
              </button>
            ) : null}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </button>
      {scoringFramework ? (
        <div className="border-t border-slate-100 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {!connected ? (
              <Link to="/connections" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
                Connect Log360 → Score
              </Link>
            ) : log360Evidence ? (
              <button
                type="button"
                onClick={handleRescore}
                className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
              >
                Re-score with live data
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { void handleSyncAndScore(); }}
                disabled={scoring}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-70"
              >
                {scoring ? 'Syncing…' : 'Sync Log360 → Score'}
              </button>
            )}
            {onAttest ? (
              <button
                type="button"
                onClick={() => onAttest(control)}
                className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
              >
                Attest
              </button>
            ) : null}
            {scoreError ? <span className="text-xs text-red-600">{scoreError}</span> : null}
          </div>
        </div>
      ) : null}

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">
          {/* Technical Requirements */}
          {score ? (
            <div>
              <h5 className="text-sm font-semibold text-slate-700 mb-2">Maturity Breakdown</h5>
              <ul className="space-y-1">
                {score.levelBreakdown.map((item) => (
                  <li key={item.level} className="text-xs text-slate-600">
                    <strong>L{item.level}</strong> · {item.achieved ? 'Achieved' : 'Missing'} · {item.reason}
                  </li>
                ))}
              </ul>
              {score.partialBasisNote ? <p className="mt-2 text-xs text-amber-700">{score.partialBasisNote}</p> : null}
            </div>
          ) : null}

          <div>
            <h5 className="text-sm font-semibold text-slate-700 mb-2">Technical Requirements</h5>
            <ul className="space-y-1">
              {control.technicalRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* ME Products */}
          <div>
            <h5 className="text-sm font-semibold text-slate-700 mb-2">ManageEngine Product Mapping</h5>
            <div className="space-y-2">
              {control.manageEngineProducts.map((mapping) => {
                const product = getProductById(mapping.productId);
                if (!product) return null;
                return (
                  <div key={mapping.productId} className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: product.color }}
                        >
                          {product.shortName}
                        </span>
                        {mapping.primary && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{mapping.coverage}% coverage</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mb-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${mapping.coverage}%`,
                          backgroundColor: product.color,
                        }}
                      />
                    </div>
                    <ul className="space-y-0.5">
                      {mapping.features.map((f, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5">•</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remediation */}
          <div>
            <h5 className="text-sm font-semibold text-slate-700 mb-2">Remediation Suggestions</h5>
            <ol className="space-y-1">
              {control.remediationSuggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-blue-600 font-bold shrink-0">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          {/* Reference */}
          {control.referenceUrl && (
            <a
              href={control.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Official Reference
            </a>
          )}

          {control.sourceMetadata && (
            <div>
              <h5 className="text-sm font-semibold text-slate-700 mb-2">Sources</h5>
              <div className="flex flex-wrap gap-2">
                <a
                  href={control.sourceMetadata.standardSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                >
                  <ExternalLink className="w-3 h-3" />
                  Standard source
                </a>
                {control.sourceMetadata.meComplianceBriefUrl && (
                  <a
                    href={control.sourceMetadata.meComplianceBriefUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  >
                    <ExternalLink className="w-3 h-3" />
                    ManageEngine brief
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
