import { getMaturityTier } from '../utils/scoringEngine';
import type { Evidence } from '../services/evidenceCollector';
import type { EvaluatedControlCheck } from './controlChecks';

export interface ScoredControlResult {
  controlId: string;
  family: string;
  checks: EvaluatedControlCheck[];
  score: number;
  pendingManualCount: number;
}

export interface FrameworkScoringResult {
  frameworkScore: number;
  tier: string;
  familyScores: Array<{ family: string; score: number; checkCount: number }>;
  controlResults: ScoredControlResult[];
  pendingManualCount: number;
  lastEvidenceTimestamp: string;
}

function isApplicable(status: EvaluatedControlCheck['result']['status']): boolean {
  return status !== 'evidence_pending' && status !== 'not_applicable';
}

export function scoreFramework(checks: EvaluatedControlCheck[], evidence: Evidence): FrameworkScoringResult {
  const checksByControl = new Map<string, EvaluatedControlCheck[]>();

  for (const check of checks) {
    if (!checksByControl.has(check.controlId)) {
      checksByControl.set(check.controlId, []);
    }
    checksByControl.get(check.controlId)?.push(check);
  }

  const controlResults: ScoredControlResult[] = [];

  for (const [controlId, controlChecks] of checksByControl.entries()) {
    const applicable = controlChecks.filter((check) => isApplicable(check.result.status));
    const numerator = applicable.reduce((sum, check) => sum + (check.result.score * check.weight), 0);
    const denominator = applicable.reduce((sum, check) => sum + (100 * check.weight), 0);
    const score = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

    controlResults.push({
      controlId,
      family: controlChecks[0].family,
      checks: controlChecks,
      score,
      pendingManualCount: controlChecks.filter((check) => check.result.status === 'evidence_pending').length,
    });
  }

  const familyMap = new Map<string, { numerator: number; denominator: number; checkCount: number }>();

  for (const check of checks) {
    if (check.result.status === 'evidence_pending' || check.result.status === 'not_applicable') {
      continue;
    }

    if (!familyMap.has(check.family)) {
      familyMap.set(check.family, { numerator: 0, denominator: 0, checkCount: 0 });
    }

    const family = familyMap.get(check.family);
    if (!family) continue;

    family.numerator += check.result.score * check.weight;
    family.denominator += 100 * check.weight;
    family.checkCount += 1;
  }

  const familyScores = Array.from(familyMap.entries()).map(([family, data]) => ({
    family,
    score: data.denominator > 0 ? Math.round((data.numerator / data.denominator) * 100) : 0,
    checkCount: data.checkCount,
  }));

  const frameworkNumerator = checks
    .filter((check) => isApplicable(check.result.status))
    .reduce((sum, check) => sum + (check.result.score * check.weight), 0);
  const frameworkDenominator = checks
    .filter((check) => isApplicable(check.result.status))
    .reduce((sum, check) => sum + (100 * check.weight), 0);

  const frameworkScore = frameworkDenominator > 0 ? Math.round((frameworkNumerator / frameworkDenominator) * 100) : 0;
  const tier = getMaturityTier(frameworkScore).label;

  return {
    frameworkScore,
    tier,
    familyScores,
    controlResults,
    pendingManualCount: checks.filter((check) => check.result.status === 'evidence_pending').length,
    lastEvidenceTimestamp: evidence.collectedAt,
  };
}
