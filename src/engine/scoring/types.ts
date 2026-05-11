import type { Attestation, Control, FrameworkRubric } from '../../types';

export type ScoringRubric = FrameworkRubric;

export type ScoreBand = 'compliant' | 'mostly-compliant' | 'attention' | 'at-risk';

export interface ControlEvidence {
  controlId: string;
  automated: {
    source: 'log360' | 'ad360';
    raw: unknown;
    status: 'success' | 'failed' | 'unavailable';
    collectedAt: string;
  }[];
  attestations: Array<Attestation & {
    evidenceFile?: Attestation['evidenceFile'];
  }>;
}

export interface LevelBreakdown {
  level: number;
  achieved: boolean;
  weight: number;
  reason: string;
}

export interface ControlScore {
  controlId: string;
  rubric: ScoringRubric;
  rawScore: number;
  normalizedScore: number;
  achievedLevel: number;
  levelBreakdown: LevelBreakdown[];
  evidenceUsed: string[];
  partialBasisNote?: string;
  required?: boolean;
  hardFail?: boolean;
  control?: Control;
}

export interface FrameworkScore {
  frameworkId: string;
  rubric: ScoringRubric;
  overall: number;
  band: ScoreBand;
  nistTier: 1 | 2 | 3 | 4;
  themes?: { id: string; name: string; score: number }[];
  controls: ControlScore[];
  hardFails: string[];
  generatedAt: string;
  partialBasisNote?: string;
}
