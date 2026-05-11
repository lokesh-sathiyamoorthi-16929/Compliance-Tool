import { getControlsByFrameworkId } from '../../data/controls';
import type { Control } from '../../types';
import { mapBand, mapNistTier } from './bandMapping';
import { hasActiveAttestation } from './evidenceMapping';
import type { ControlEvidence, ControlScore, FrameworkScore } from './types';

const PRISMA_WEIGHTS: Record<number, number> = {
  1: 15,
  2: 20,
  3: 40,
  4: 10,
  5: 15,
};

function getSafeguard(control: Control): 'administrative' | 'physical' | 'technical' {
  if (control.safeguard) return control.safeguard;
  if (control.family.toLowerCase().includes('physical')) return 'physical';
  if (control.family.toLowerCase().includes('administrative')) return 'administrative';
  return 'technical';
}

export function scorePrismaFramework(frameworkId: string, evidence: ControlEvidence[]): FrameworkScore {
  const controls = getControlsByFrameworkId(frameworkId);
  const evidenceByControlId = new Map(evidence.map((row) => [row.controlId, row]));
  const scoredControls: ControlScore[] = [];

  for (const control of controls) {
    const controlEvidence = evidenceByControlId.get(control.id) ?? {
      controlId: control.id,
      automated: [],
      attestations: [],
    };

    const level1 = hasActiveAttestation(controlEvidence, 1);
    const level2 = hasActiveAttestation(controlEvidence, 2);
    const implementedByAutomation = controlEvidence.automated.some((item) => item.status === 'success');
    const implementedByAttestation = hasActiveAttestation(controlEvidence, 3);
    const addressableJustification =
      control.requirementType === 'addressable' &&
      controlEvidence.attestations.some(
        (attestation) =>
          attestation.level === 3 &&
          /justify|justification|alternate|compensating/i.test(attestation.statement),
      );
    const level3 = implementedByAutomation || implementedByAttestation || addressableJustification;
    const level4 = hasActiveAttestation(controlEvidence, 4);
    const level5 = hasActiveAttestation(controlEvidence, 5);

    const isRequired = control.requirementType
      ? control.requirementType === 'required'
      : control.required && !control.addressable;
    const hardFail = isRequired && !level3;

    const levelBreakdown = [
      {
        level: 1,
        achieved: level1,
        weight: PRISMA_WEIGHTS[1],
        reason: level1 ? 'Policy attestation present.' : 'Policy attestation missing.',
      },
      {
        level: 2,
        achieved: level2,
        weight: PRISMA_WEIGHTS[2],
        reason: level2 ? 'Process attestation present.' : 'Process attestation missing.',
      },
      {
        level: 3,
        achieved: level3,
        weight: PRISMA_WEIGHTS[3],
        reason: level3
          ? implementedByAutomation
            ? 'Automated implementation evidence present.'
            : addressableJustification
              ? 'Addressable control justified by attestation.'
              : 'Implementation attestation present.'
          : 'Implemented evidence missing.',
      },
      {
        level: 4,
        achieved: level4,
        weight: PRISMA_WEIGHTS[4],
        reason: level4 ? 'Measured/monitoring attestation present.' : 'Measured attestation missing.',
      },
      {
        level: 5,
        achieved: level5,
        weight: PRISMA_WEIGHTS[5],
        reason: level5 ? 'Managed/continuous-improvement attestation present.' : 'Managed attestation missing.',
      },
    ];

    const score = hardFail
      ? 0
      : levelBreakdown
          .filter((item) => item.achieved)
          .reduce((sum, item) => sum + item.weight, 0);

    const achievedLevel = level5
      ? 5
      : level4
        ? 4
        : level3
          ? 3
          : level2
            ? 2
            : level1
              ? 1
              : 0;

    scoredControls.push({
      controlId: control.id,
      rubric: 'prisma',
      rawScore: score,
      normalizedScore: score,
      achievedLevel,
      levelBreakdown,
      evidenceUsed: [
        ...controlEvidence.automated
          .filter((item) => item.status === 'success')
          .map((item) => `${item.source}:${control.id}`),
        ...controlEvidence.attestations.map((item) => item.id),
      ],
      partialBasisNote:
        achievedLevel < 5
          ? `Scored on ${Math.max(achievedLevel, 0)} of 5 PRISMA levels — remaining levels not attested.`
          : undefined,
      required: isRequired,
      hardFail,
      control,
    });
  }

  const safeguards: Record<'administrative' | 'physical' | 'technical', number[]> = {
    administrative: [],
    physical: [],
    technical: [],
  };

  for (const control of scoredControls) {
    safeguards[getSafeguard(control.control as Control)].push(control.normalizedScore);
  }

  const themes = [
    { id: 'administrative', name: 'Administrative', score: safeguards.administrative.length ? Math.round(safeguards.administrative.reduce((a, b) => a + b, 0) / safeguards.administrative.length) : 0 },
    { id: 'physical', name: 'Physical', score: safeguards.physical.length ? Math.round(safeguards.physical.reduce((a, b) => a + b, 0) / safeguards.physical.length) : 0 },
    { id: 'technical', name: 'Technical', score: safeguards.technical.length ? Math.round(safeguards.technical.reduce((a, b) => a + b, 0) / safeguards.technical.length) : 0 },
  ];

  const overall = Math.round(themes.reduce((sum, theme) => sum + theme.score, 0) / themes.length);
  const hardFails = scoredControls.filter((control) => control.hardFail).map((control) => control.controlId);
  const everyControlAtLeastLevel3 = scoredControls.every((control) => control.achievedLevel >= 3);

  return {
    frameworkId,
    rubric: 'prisma',
    overall,
    band: mapBand('prisma', overall, {
      hardFail: hardFails.length > 0,
      everyControlAtLeastLevel3,
    }),
    nistTier: mapNistTier(overall),
    themes,
    controls: scoredControls,
    hardFails,
    generatedAt: new Date().toISOString(),
  };
}
