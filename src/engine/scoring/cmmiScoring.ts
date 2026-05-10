import { getControlsByFrameworkId } from '../../data/controls';
import type { Control } from '../../types';
import { mapBand, mapNistTier } from './bandMapping';
import { hasActiveAttestation } from './evidenceMapping';
import type { ControlEvidence, ControlScore, FrameworkScore } from './types';

function getTheme(control: Control): { id: string; name: string } {
  if (control.theme === 'organizational') return { id: 'organizational', name: 'Organizational' };
  if (control.theme === 'people') return { id: 'people', name: 'People' };
  if (control.theme === 'physical') return { id: 'physical', name: 'Physical' };
  if (control.theme === 'technological') return { id: 'technological', name: 'Technological' };

  if (control.category === 'Physical') return { id: 'physical', name: 'Physical' };
  if (control.category === 'Administrative' || control.family.toLowerCase().includes('people')) {
    return { id: 'people', name: 'People' };
  }
  if (control.family.toLowerCase().includes('organizational')) {
    return { id: 'organizational', name: 'Organizational' };
  }
  return { id: 'technological', name: 'Technological' };
}

export function scoreCmmiFramework(frameworkId: string, evidence: ControlEvidence[]): FrameworkScore {
  const controls = getControlsByFrameworkId(frameworkId);
  const evidenceByControlId = new Map(evidence.map((row) => [row.controlId, row]));
  const scoredControls: ControlScore[] = [];

  for (const control of controls) {
    const controlEvidence = evidenceByControlId.get(control.id) ?? {
      controlId: control.id,
      automated: [],
      attestations: [],
    };

    const hasAutomated = controlEvidence.automated.some((item) => item.status === 'success');
    const hasPolicy = hasActiveAttestation(controlEvidence, 1);
    const hasProcess = hasActiveAttestation(controlEvidence, 2);
    const hasMeasured = hasActiveAttestation(controlEvidence, 4);
    const hasManaged = hasActiveAttestation(controlEvidence, 5);

    let achievedLevel = 0;
    if (hasAutomated) achievedLevel = 1;
    if (hasAutomated && hasPolicy) achievedLevel = 2;
    if (hasAutomated && hasPolicy && hasProcess) achievedLevel = 3;
    if (hasAutomated && hasPolicy && hasProcess && hasMeasured) achievedLevel = 4;
    if (hasAutomated && hasPolicy && hasProcess && hasMeasured && hasManaged) achievedLevel = 5;

    const normalizedScore = Math.round((achievedLevel / 5) * 100);

    scoredControls.push({
      controlId: control.id,
      rubric: 'cmmi',
      rawScore: achievedLevel,
      normalizedScore,
      achievedLevel,
      levelBreakdown: [
        { level: 0, achieved: achievedLevel === 0, weight: 0, reason: achievedLevel === 0 ? 'No evidence found.' : 'Evidence exists.' },
        { level: 1, achieved: hasAutomated, weight: 1, reason: hasAutomated ? 'Automated evidence exists.' : 'No automated evidence.' },
        { level: 2, achieved: hasAutomated && hasPolicy, weight: 1, reason: hasPolicy ? 'Policy attestation exists.' : 'Policy attestation missing.' },
        { level: 3, achieved: hasAutomated && hasPolicy && hasProcess, weight: 1, reason: hasProcess ? 'Process attestation exists.' : 'Process attestation missing.' },
        { level: 4, achieved: hasAutomated && hasPolicy && hasProcess && hasMeasured, weight: 1, reason: hasMeasured ? 'Monitoring attestation exists.' : 'Monitoring attestation missing.' },
        { level: 5, achieved: hasAutomated && hasPolicy && hasProcess && hasMeasured && hasManaged, weight: 1, reason: hasManaged ? 'Continuous improvement attestation exists.' : 'Improvement-cycle attestation missing.' },
      ],
      evidenceUsed: [
        ...controlEvidence.automated
          .filter((item) => item.status === 'success')
          .map((item) => `${item.source}:${control.id}`),
        ...controlEvidence.attestations.map((item) => item.id),
      ],
      control,
    });
  }

  const themeMap = new Map<string, { id: string; name: string; scores: number[] }>();
  for (const controlScore of scoredControls) {
    const theme = getTheme(controlScore.control as Control);
    const current = themeMap.get(theme.id) ?? { ...theme, scores: [] };
    current.scores.push(controlScore.normalizedScore);
    themeMap.set(theme.id, current);
  }

  const themes = Array.from(themeMap.values()).map((theme) => ({
    id: theme.id,
    name: theme.name,
    score: theme.scores.length ? Math.round(theme.scores.reduce((a, b) => a + b, 0) / theme.scores.length) : 0,
  }));

  const defaultThemes = [
    { id: 'organizational', name: 'Organizational', score: 0 },
    { id: 'people', name: 'People', score: 0 },
    { id: 'physical', name: 'Physical', score: 0 },
    { id: 'technological', name: 'Technological', score: 0 },
  ];
  const mergedThemes = defaultThemes.map((theme) => themes.find((item) => item.id === theme.id) ?? theme);

  const overall = mergedThemes.length
    ? Math.round(mergedThemes.reduce((sum, theme) => sum + theme.score, 0) / mergedThemes.length)
    : 0;

  return {
    frameworkId,
    rubric: 'cmmi',
    overall,
    band: mapBand('cmmi', overall),
    nistTier: mapNistTier(overall),
    themes: mergedThemes,
    controls: scoredControls,
    hardFails: [],
    generatedAt: new Date().toISOString(),
    partialBasisNote: `Scored on ${controls.length} of 93 Annex A controls`,
  };
}
