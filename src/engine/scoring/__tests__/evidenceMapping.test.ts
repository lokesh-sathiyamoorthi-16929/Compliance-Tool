import { describe, expect, it } from 'vitest';
import { mapEvidenceToControlEvidence } from '../evidenceMapping';
import type { Evidence } from '../../../services/evidenceCollector';
import { scoreFramework } from '../index';

const sampleEvidence: Evidence = {
  logSources: { count: 2, byType: { windows: 2 }, names: ['dc-1', 'ehr-1'], items: [] },
  agents: { total: 1, healthy: 1, unhealthy: [], items: [] },
  logSourceGroups: [],
  reportProfiles: { byUniqueKey: {}, all: [] },
  recentReportSamples: {},
  incidents: { total: 0, open: 0, closed: 0, bySeverity: {}, items: [] },
  alerts: { total: 5 },
  collectedAt: new Date().toISOString(),
  partialSuccess: false,
  errors: {},
};

describe('evidenceMapping', () => {
  it('maps successful Log360 telemetry into automated success for relevant controls', () => {
    const mapped = mapEvidenceToControlEvidence('hipaa', sampleEvidence, {});
    const auditControl = mapped.find((row) => row.controlId === 'HIPAA-164.312(b)');

    expect(auditControl?.automated[0].status).toBe('success');
  });

  it('automated evidence plus attestation allows PRISMA implemented level', () => {
    const now = new Date().toISOString();
    const mapped = mapEvidenceToControlEvidence('hipaa', sampleEvidence, {
      'HIPAA-164.312(a)(2)(iii)': [
        {
          id: 'att-policy',
          controlId: 'HIPAA-164.312(a)(2)(iii)',
          level: 1,
          statement: 'Policy exists',
          attestedAt: now,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
    });

    const score = scoreFramework('hipaa', mapped, { rubricOverride: 'prisma' });
    const control = score.controls.find((row) => row.controlId === 'HIPAA-164.312(a)(2)(iii)');

    expect(control?.achievedLevel).toBeGreaterThanOrEqual(3);
  });

  it('expired attestations do not contribute', () => {
    const mapped = mapEvidenceToControlEvidence('hipaa', sampleEvidence, {
      'HIPAA-164.312(a)(2)(iii)': [
        {
          id: 'att-expired',
          controlId: 'HIPAA-164.312(a)(2)(iii)',
          level: 1,
          statement: 'Expired policy',
          attestedAt: '2020-01-01T00:00:00.000Z',
          expiresAt: '2020-01-02T00:00:00.000Z',
        },
      ],
    });

    const control = mapped.find((row) => row.controlId === 'HIPAA-164.312(a)(2)(iii)');
    expect(control?.attestations).toHaveLength(0);
  });
});
