import { describe, expect, it } from 'vitest';
import { mapBand, mapNistTier } from '../bandMapping';

describe('bandMapping boundaries', () => {
  it.each([
    { score: 39, band: 'at-risk' },
    { score: 40, band: 'attention' },
    { score: 59, band: 'attention' },
    { score: 60, band: 'mostly-compliant' },
    { score: 79, band: 'mostly-compliant' },
    { score: 80, band: 'compliant' },
  ])('maps score $score to $band for cmmi rubric', ({ score, band }) => {
    expect(mapBand('cmmi', score)).toBe(band);
  });

  it('maps nist tiers at boundaries', () => {
    expect(mapNistTier(39)).toBe(1);
    expect(mapNistTier(40)).toBe(2);
    expect(mapNistTier(60)).toBe(3);
    expect(mapNistTier(80)).toBe(4);
  });
});
