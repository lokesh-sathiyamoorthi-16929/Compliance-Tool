import { getFrameworkById } from '../../data/frameworks';
import type { Evidence } from '../../services/evidenceCollector';
import type { Attestation } from '../../types';
import type { Ad360SummaryResponse } from '../../types/ad360';
import { runControlChecks } from '../controlChecks';
import { scoreCmmiFramework } from './cmmiScoring';
import { mapEvidenceToControlEvidence } from './evidenceMapping';
import { scoreLegacyFramework } from './legacyScoring';
import { scorePrismaFramework } from './prismaScoring';
import type { ControlEvidence, FrameworkScore, ScoringRubric } from './types';

function isEvidencePayload(value: ControlEvidence[] | Evidence): value is Evidence {
  return !Array.isArray(value);
}

function scoreLegacyFromChecks(frameworkId: 'hipaa' | 'pcidss', evidence: Evidence): FrameworkScore {
  const checks = runControlChecks(frameworkId, evidence);
  const checksByControl = new Map<string, typeof checks>();
  checks.forEach((check) => {
    const current = checksByControl.get(check.controlId) ?? [];
    current.push(check);
    checksByControl.set(check.controlId, current);
  });

  const controls = Array.from(checksByControl.entries()).map(([controlId, controlChecks]) => {
    const applicable = controlChecks.filter((check) => check.result.status !== 'evidence_pending' && check.result.status !== 'not_applicable');
    const numerator = applicable.reduce((sum, check) => sum + (check.result.score * check.weight), 0);
    const denominator = applicable.reduce((sum, check) => sum + (100 * check.weight), 0);
    const normalizedScore = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
    return {
      controlId,
      rubric: 'legacy' as const,
      rawScore: normalizedScore,
      normalizedScore,
      achievedLevel: normalizedScore >= 80 ? 4 : normalizedScore >= 60 ? 3 : normalizedScore >= 40 ? 2 : 1,
      levelBreakdown: [
        {
          level: 1,
          achieved: normalizedScore > 0,
          weight: 100,
          reason: `Legacy weighted score from ${applicable.length} applicable checks.`,
        },
      ],
      evidenceUsed: applicable.flatMap((check) => check.result.evidenceRefs.map((ref) => `${ref.source}:${controlId}`)),
    };
  });

  const overall = controls.length ? Math.round(controls.reduce((sum, control) => sum + control.normalizedScore, 0) / controls.length) : 0;
  return {
    frameworkId,
    rubric: 'legacy',
    overall,
    band: overall >= 80 ? 'compliant' : overall >= 60 ? 'mostly-compliant' : overall >= 40 ? 'attention' : 'at-risk',
    nistTier: overall >= 80 ? 4 : overall >= 60 ? 3 : overall >= 40 ? 2 : 1,
    controls,
    hardFails: [],
    generatedAt: new Date().toISOString(),
  };
}

export function scoreFramework(
  frameworkId: string,
  evidence: ControlEvidence[] | Evidence,
  options?: {
    rubricOverride?: ScoringRubric;
    attestations?: Record<string, Attestation[]>;
    ad360Summary?: Ad360SummaryResponse | null;
  },
): FrameworkScore {
  const framework = getFrameworkById(frameworkId);
  const rubric: ScoringRubric = options?.rubricOverride ?? framework?.rubric ?? 'legacy';

  const normalizedEvidence = isEvidencePayload(evidence)
    ? mapEvidenceToControlEvidence(frameworkId, evidence, options?.attestations, new Date().toISOString(), options?.ad360Summary)
    : evidence;

  if (rubric === 'legacy' && isEvidencePayload(evidence) && (frameworkId === 'hipaa' || frameworkId === 'pcidss')) {
    return scoreLegacyFromChecks(frameworkId, evidence);
  }

  if (rubric === 'prisma') {
    return scorePrismaFramework(frameworkId, normalizedEvidence);
  }

  if (rubric === 'cmmi') {
    return scoreCmmiFramework(frameworkId, normalizedEvidence);
  }

  return scoreLegacyFramework(frameworkId, normalizedEvidence);
}

export type { ControlEvidence, FrameworkScore, ControlScore } from './types';
