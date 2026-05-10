import { describe, expect, it } from 'vitest';
import { runControlChecks } from './controlChecks';
import { scoreFramework } from './scoringEngine';
import type { Evidence } from '../services/evidenceCollector';

const sampleEvidence: Evidence = {
  logSources: {
    count: 3,
    byType: { windows: 2, database: 1, network: 1 },
    names: ['win-dc-01', 'sql-01', 'fw-edge-01'],
    items: [],
    inScopeCoverage: {
      scopedHosts: ['win-dc-01', 'sql-01', 'fw-edge-01'],
      coveredHosts: ['win-dc-01', 'sql-01', 'fw-edge-01'],
      coverageRatio: 1,
    },
  },
  agents: {
    total: 3,
    healthy: 2,
    unhealthy: ['collector-2'],
    items: [],
  },
  logSourceGroups: [
    { name: 'PCI Systems', memberCount: 2 },
  ],
  reportProfiles: {
    byUniqueKey: {
      file_integrity: { profile_id: '11', name: 'File Integrity', unique_key: 'file_integrity', retention_days: 180 },
      account_management: { profile_id: '12', name: 'Account Management', unique_key: 'account_management', retention_days: 180 },
    },
    all: [],
  },
  retention: {
    retentionDays: 180,
  },
  recentReportSamples: {
    account_management: {
      reportId: '12',
      reportName: 'Account Management',
      uniqueKey: 'account_management',
      totalItems: 10,
      sampleCount: 10,
      latestTimestamp: '2026-05-09T00:00:00.000Z',
    },
    windows_logon_success: {
      reportId: '13',
      reportName: 'Windows Logon Success',
      uniqueKey: 'windows_logon_success',
      totalItems: 40,
      sampleCount: 40,
      latestTimestamp: '2026-05-09T00:00:00.000Z',
    },
    windows_logon_failure: {
      reportId: '14',
      reportName: 'Windows Logon Failure',
      uniqueKey: 'windows_logon_failure',
      totalItems: 8,
      sampleCount: 8,
      latestTimestamp: '2026-05-09T00:00:00.000Z',
    },
    privileged_user_activity: {
      reportId: '15',
      reportName: 'Privileged User Activity',
      uniqueKey: 'privileged_user_activity',
      totalItems: 4,
      sampleCount: 4,
      latestTimestamp: '2026-05-09T00:00:00.000Z',
    },
  },
  incidents: {
    total: 5,
    open: 2,
    closed: 3,
    bySeverity: { high: 2, medium: 3 },
    items: [],
  },
  alerts: {
    total: 6,
    criticalLast7d: 2,
  },
  collectedAt: '2026-05-09T00:10:00.000Z',
  partialSuccess: false,
  errors: {},
};

describe('scoringEngine', () => {
  it('scores HIPAA evidence-backed checks with pending manual count', () => {
    const checks = runControlChecks('hipaa', sampleEvidence);
    const result = scoreFramework(checks, sampleEvidence);

    expect(result.frameworkScore).toBeGreaterThan(0);
    expect(result.pendingManualCount).toBeGreaterThan(0);
    expect(result.familyScores.length).toBeGreaterThan(0);
    expect(result.tier).toBeTruthy();
  });

  it('scores PCI evidence-backed checks and excludes evidence_pending from denominator', () => {
    const checks = runControlChecks('pcidss', sampleEvidence);
    const result = scoreFramework(checks, sampleEvidence);

    const pendingChecks = checks.filter((check) => check.result.status === 'evidence_pending');
    expect(pendingChecks.length).toBeGreaterThan(0);
    expect(result.frameworkScore).toBeGreaterThan(0);
    expect(result.pendingManualCount).toBe(pendingChecks.length);
  });
});
