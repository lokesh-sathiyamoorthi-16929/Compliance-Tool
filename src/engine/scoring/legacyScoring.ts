import { mapBand, mapNistTier } from './bandMapping';
import type { ControlEvidence, ControlScore, FrameworkScore } from './types';

export function scoreLegacyFramework(frameworkId: string, evidence: ControlEvidence[]): FrameworkScore {
  const controls: ControlScore[] = evidence.map((row) => {
    const successfulAutomated = row.automated.filter((item) => item.status === 'success').length;
    const totalSignals = row.automated.length + row.attestations.length;
    const normalizedScore = totalSignals === 0 ? 0 : Math.round((successfulAutomated / Math.max(row.automated.length, 1)) * 100);

    return {
      controlId: row.controlId,
      rubric: 'legacy',
      rawScore: normalizedScore,
      normalizedScore,
      achievedLevel: normalizedScore >= 80 ? 4 : normalizedScore >= 60 ? 3 : normalizedScore >= 40 ? 2 : 1,
      levelBreakdown: [
        {
          level: 1,
          achieved: normalizedScore > 0,
          weight: 100,
          reason:
            totalSignals === 0
              ? 'No evidence available.'
              : `Legacy evidence present (${successfulAutomated}/${Math.max(row.automated.length, 1)} automated signals successful).`,
        },
      ],
      evidenceUsed: [
        ...row.automated.filter((item) => item.status === 'success').map((item) => `${item.source}:${row.controlId}`),
        ...row.attestations.map((item) => item.id),
      ],
    };
  });

  const overall =
    controls.length > 0
      ? Math.round(controls.reduce((sum, control) => sum + control.normalizedScore, 0) / controls.length)
      : 0;

  return {
    frameworkId,
    rubric: 'legacy',
    overall,
    band: mapBand('legacy', overall),
    nistTier: mapNistTier(overall),
    controls,
    hardFails: [],
    generatedAt: new Date().toISOString(),
  };
}
