import { describe, expect, it } from 'vitest';
import { scoreFramework } from '../index';
import type { ControlEvidence } from '../types';

const baseEvidence = (controlId: string): ControlEvidence => ({
  controlId,
  automated: [],
  attestations: [],
});

describe('prismaScoring', () => {
  it('marks required control missing implementation as hardFail and score 0', () => {
    const result = scoreFramework('hipaa', [baseEvidence('HIPAA-164.312(b)')], { rubricOverride: 'prisma' });
    const control = result.controls.find((row) => row.controlId === 'HIPAA-164.312(b)');

    expect(control?.hardFail).toBe(true);
    expect(control?.normalizedScore).toBe(0);
  });

  it('scores addressable control with justification attestation as L3-only (40 points)', () => {
    const result = scoreFramework('hipaa', [
      {
        controlId: 'HIPAA-164.312(a)(2)(iii)',
        automated: [{ source: 'log360', raw: {}, status: 'failed', collectedAt: new Date().toISOString() }],
        attestations: [
          {
            id: 'att-justification',
            controlId: 'HIPAA-164.312(a)(2)(iii)',
            level: 3,
            statement: 'Compensating control justification documented and approved.',
            attestedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
      },
    ], { rubricOverride: 'prisma' });

    const control = result.controls.find((row) => row.controlId === 'HIPAA-164.312(a)(2)(iii)');
    expect(control?.normalizedScore).toBe(40);
    expect(control?.achievedLevel).toBe(3);
  });

  it('scores all 5 levels as 100', () => {
    const now = new Date().toISOString();
    const result = scoreFramework('hipaa', [
      {
        controlId: 'HIPAA-164.312(a)(2)(iii)',
        automated: [{ source: 'log360', raw: {}, status: 'success', collectedAt: now }],
        attestations: [1, 2, 4, 5].map((level) => ({
          id: `att-${level}`,
          controlId: 'HIPAA-164.312(a)(2)(iii)',
          level,
          statement: `Level ${level}`,
          attestedAt: now,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        })),
      },
    ], { rubricOverride: 'prisma' });

    const control = result.controls.find((row) => row.controlId === 'HIPAA-164.312(a)(2)(iii)');
    expect(control?.normalizedScore).toBe(100);
  });

  it('scores policy+process only as 35 with partial note when implemented is missing', () => {
    const now = new Date().toISOString();
    const result = scoreFramework('hipaa', [
      {
        controlId: 'HIPAA-164.312(a)(2)(iii)',
        automated: [{ source: 'log360', raw: {}, status: 'failed', collectedAt: now }],
        attestations: [1, 2].map((level) => ({
          id: `att-${level}`,
          controlId: 'HIPAA-164.312(a)(2)(iii)',
          level,
          statement: `Level ${level}`,
          attestedAt: now,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        })),
      },
    ], { rubricOverride: 'prisma' });

    const control = result.controls.find((row) => row.controlId === 'HIPAA-164.312(a)(2)(iii)');
    expect(control?.normalizedScore).toBe(35);
    expect(control?.partialBasisNote).toContain('Scored on');
  });
});
