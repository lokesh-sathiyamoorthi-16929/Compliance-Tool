import { Control, FamilyScore, MaturityTier } from '../types';

export const maturityTiers: MaturityTier[] = [
  { tier: 1, label: 'Initial', color: '#ef4444', range: [0, 40] },
  { tier: 2, label: 'Developing', color: '#f97316', range: [41, 65] },
  { tier: 3, label: 'Defined', color: '#eab308', range: [66, 80] },
  { tier: 4, label: 'Managed', color: '#22c55e', range: [81, 94] },
  { tier: 5, label: 'Optimized', color: '#3b82f6', range: [95, 100] },
];

export function getMaturityTier(score: number): MaturityTier {
  return (
    maturityTiers.find(
      (tier) => score >= tier.range[0] && score <= tier.range[1]
    ) ?? maturityTiers[0]
  );
}

export interface ControlScore {
  controlId: string;
  score: number;
  passedChecks: number;
  totalChecks: number;
}

export function calculateControlScore(
  passedChecks: number,
  totalChecks: number,
  weight: number
): number {
  if (totalChecks === 0) return 0;
  return (passedChecks * weight) / (totalChecks * weight) * 100;
}

export function calculateFamilyScores(
  controls: Control[],
  controlScores: ControlScore[]
): FamilyScore[] {
  const familyMap = new Map<string, { scores: number[]; weights: number[]; controlCount: number }>();

  for (const control of controls) {
    const scoreEntry = controlScores.find((cs) => cs.controlId === control.id);
    const score = scoreEntry ? scoreEntry.score : 0;

    if (!familyMap.has(control.family)) {
      familyMap.set(control.family, { scores: [], weights: [], controlCount: 0 });
    }
    const family = familyMap.get(control.family)!;
    family.scores.push(score);
    family.weights.push(control.weight);
    family.controlCount++;
  }

  const familyScores: FamilyScore[] = [];
  for (const [family, data] of familyMap.entries()) {
    const totalWeight = data.weights.reduce((a, b) => a + b, 0);
    const weightedSum = data.scores.reduce(
      (sum, score, i) => sum + score * data.weights[i],
      0
    );
    const familyScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    familyScores.push({
      family,
      score: Math.round(familyScore),
      controlCount: data.controlCount,
    });
  }

  return familyScores;
}

export function calculateFrameworkScore(familyScores: FamilyScore[]): number {
  if (familyScores.length === 0) return 0;
  const total = familyScores.reduce((sum, fs) => sum + fs.score, 0);
  return Math.round(total / familyScores.length);
}

export function getScoreColor(score: number): string {
  const tier = getMaturityTier(score);
  return tier.color;
}

export function getScoreLabel(score: number): string {
  const tier = getMaturityTier(score);
  return `Tier ${tier.tier} — ${tier.label}`;
}
