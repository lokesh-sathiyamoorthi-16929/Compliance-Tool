import { describe, expect, it } from 'vitest';
import { scoreFramework } from '../index';

describe('cmmiScoring', () => {
  it('L0 normalizes to 0', () => {
    const result = scoreFramework('iso27001', [{ controlId: 'ISO-A.8.15', automated: [], attestations: [] }], {
      rubricOverride: 'cmmi',
    });
    const control = result.controls.find((row) => row.controlId === 'ISO-A.8.15');
    expect(control?.achievedLevel).toBe(0);
    expect(control?.normalizedScore).toBe(0);
  });

  it('L3 normalizes to 60', () => {
    const now = new Date().toISOString();
    const result = scoreFramework('iso27001', [
      {
        controlId: 'ISO-A.8.15',
        automated: [{ source: 'log360', raw: {}, status: 'success', collectedAt: now }],
        attestations: [1, 2].map((level) => ({
          id: `att-${level}`,
          controlId: 'ISO-A.8.15',
          level,
          statement: `L${level}`,
          attestedAt: now,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        })),
      },
    ], { rubricOverride: 'cmmi' });
    const control = result.controls.find((row) => row.controlId === 'ISO-A.8.15');
    expect(control?.achievedLevel).toBe(3);
    expect(control?.normalizedScore).toBe(60);
  });

  it('L5 normalizes to 100', () => {
    const now = new Date().toISOString();
    const result = scoreFramework('iso27001', [
      {
        controlId: 'ISO-A.8.15',
        automated: [{ source: 'log360', raw: {}, status: 'success', collectedAt: now }],
        attestations: [1, 2, 4, 5].map((level) => ({
          id: `att-${level}`,
          controlId: 'ISO-A.8.15',
          level,
          statement: `L${level}`,
          attestedAt: now,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        })),
      },
    ], { rubricOverride: 'cmmi' });
    const control = result.controls.find((row) => row.controlId === 'ISO-A.8.15');
    expect(control?.achievedLevel).toBe(5);
    expect(control?.normalizedScore).toBe(100);
  });

  it('theme aggregation matches averaged control scores by theme', () => {
    const now = new Date().toISOString();
    const result = scoreFramework('iso27001', [
      {
        controlId: 'ISO-A.5.1',
        automated: [{ source: 'log360', raw: {}, status: 'success', collectedAt: now }],
        attestations: [{ id: 'att-policy', controlId: 'ISO-A.5.1', level: 1, statement: 'Policy', attestedAt: now, expiresAt: new Date(Date.now() + 86400000).toISOString() }],
      },
      {
        controlId: 'ISO-A.8.15',
        automated: [{ source: 'log360', raw: {}, status: 'success', collectedAt: now }],
        attestations: [],
      },
    ], { rubricOverride: 'cmmi' });

    const expectedByTheme = new Map<string, number[]>();
    for (const control of result.controls) {
      const themeId = control.control?.theme ?? 'technological';
      const current = expectedByTheme.get(themeId) ?? [];
      current.push(control.normalizedScore);
      expectedByTheme.set(themeId, current);
    }

    result.themes?.forEach((theme) => {
      const expected = expectedByTheme.get(theme.id) ?? [];
      const avg = expected.length ? Math.round(expected.reduce((a, b) => a + b, 0) / expected.length) : 0;
      expect(theme.score).toBe(avg);
    });
  });
});
