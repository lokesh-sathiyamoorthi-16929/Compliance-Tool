import type { ScoreBand, ScoringRubric } from './types';

export function mapNistTier(score: number): 1 | 2 | 3 | 4 {
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

export function mapBand(
  rubric: ScoringRubric,
  score: number,
  options?: { hardFail?: boolean; everyControlAtLeastLevel3?: boolean },
): ScoreBand {
  if (options?.hardFail) return 'at-risk';

  if (rubric === 'prisma') {
    if (score >= 79 && options?.everyControlAtLeastLevel3) return 'compliant';
    if (score >= 65) return 'mostly-compliant';
    if (score >= 40) return 'attention';
    return 'at-risk';
  }

  if (score >= 80) return 'compliant';
  if (score >= 60) return 'mostly-compliant';
  if (score >= 40) return 'attention';
  return 'at-risk';
}
