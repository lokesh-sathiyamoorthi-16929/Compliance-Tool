import type { Evidence } from '../services/evidenceCollector';

export interface EvidenceRef {
  source: string;
  detail: string;
  timestamp: string;
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'partial' | 'not_applicable' | 'evidence_pending';
  score: number;
  message: string;
  evidenceRefs: EvidenceRef[];
  remediation?: {
    action: string;
    manageEnginePath?: string;
    estimatedScoreGain?: number;
  };
}

export interface ControlCheck {
  id: string;
  controlId: string;
  frameworkId: 'hipaa' | 'pcidss';
  family: string;
  title: string;
  weight: 1 | 2 | 3 | 4 | 5;
  category: 'Technical' | 'Administrative' | 'Physical' | 'Organizational';
  evidenceSources: string[];
  check: (evidence: Evidence) => CheckResult;
}

export interface EvaluatedControlCheck extends ControlCheck {
  result: CheckResult;
}

function makeRef(source: string, detail: string, timestamp: string): EvidenceRef {
  return { source, detail, timestamp };
}

function pending(message = 'Manual attestation required — not technically measurable via Log360'): CheckResult {
  return {
    status: 'evidence_pending',
    score: 0,
    message,
    evidenceRefs: [],
  };
}

function getReportByKey(evidence: Evidence, contains: string): { key: string; sampleCount: number; totalItems: number; latestTimestamp: string | null } | null {
  const entry = Object.entries(evidence.recentReportSamples).find(([key, sample]) => {
    const hay = `${key} ${sample.uniqueKey} ${sample.reportName}`.toLowerCase();
    return hay.includes(contains.toLowerCase());
  });

  if (!entry) return null;

  const [key, sample] = entry;
  return {
    key,
    sampleCount: sample.sampleCount,
    totalItems: sample.totalItems,
    latestTimestamp: sample.latestTimestamp,
  };
}

export const CONTROL_CHECKS: ControlCheck[] = [
  {
    id: 'HIPAA-164.312(a)(1)-UniqueUserID',
    controlId: 'HIPAA-164.312(a)(1)',
    frameworkId: 'hipaa',
    family: 'Technical Safeguards',
    title: 'Unique User ID evidence in account management reports',
    weight: 5,
    category: 'Technical',
    evidenceSources: ['log360.recentReportSamples.account_management'],
    check: (evidence) => {
      const report = getReportByKey(evidence, 'account_management');
      const hasData = Boolean(report && report.totalItems > 0);
      return {
        status: hasData ? 'pass' : 'fail',
        score: hasData ? 100 : 0,
        message: hasData
          ? 'Account Management evidence found in last 7 days.'
          : 'No Account Management evidence found for unique user ID validation.',
        evidenceRefs: report
          ? [makeRef('log360.recentReportSamples', `Report ${report.key} total items: ${report.totalItems}`, report.latestTimestamp ?? evidence.collectedAt)]
          : [makeRef('log360.recentReportSamples', 'Account management report not found.', evidence.collectedAt)],
      };
    },
  },
  {
    id: 'HIPAA-164.312(a)(2)(i)-AutomaticLogoff',
    controlId: 'HIPAA-164.312(a)(2)(i)',
    frameworkId: 'hipaa',
    family: 'Technical Safeguards',
    title: 'Automatic logoff',
    weight: 2,
    category: 'Technical',
    evidenceSources: [],
    check: () => pending(),
  },
  {
    id: 'HIPAA-164.312(b)-AuditControls-LogSourcesPresent',
    controlId: 'HIPAA-164.312(b)',
    frameworkId: 'hipaa',
    family: 'Technical Safeguards',
    title: 'Audit controls - log sources present',
    weight: 5,
    category: 'Technical',
    evidenceSources: ['log360.logSources', 'log360.retention'],
    check: (evidence) => {
      const requiredRetentionDays = 180;
      const hasCoverage = evidence.logSources.inScopeCoverage.coverageRatio >= 1;
      const hasRetention = evidence.retention.retentionDays >= requiredRetentionDays;
      const pass = hasCoverage && hasRetention;
      return {
        status: pass ? 'pass' : hasCoverage || hasRetention ? 'partial' : 'fail',
        score: pass ? 100 : hasCoverage || hasRetention ? 60 : 0,
        message: pass
          ? `In-scope host coverage is complete and retention is ${evidence.retention.retentionDays} days.`
          : `Coverage ${Math.round(evidence.logSources.inScopeCoverage.coverageRatio * 100)}% and retention ${evidence.retention.retentionDays}/${requiredRetentionDays} days.`,
        evidenceRefs: [
          makeRef(
            'log360.logSources',
            `Covered hosts: ${evidence.logSources.inScopeCoverage.coveredHosts.join(', ') || 'none'} / ${evidence.logSources.inScopeCoverage.scopedHosts.join(', ')}`,
            evidence.collectedAt,
          ),
          makeRef('log360.retention', `Retention days: ${evidence.retention.retentionDays}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'HIPAA-164.312(b)-AuditControls-AgentsHealthy',
    controlId: 'HIPAA-164.312(b)',
    frameworkId: 'hipaa',
    family: 'Technical Safeguards',
    title: 'Audit controls - agents healthy',
    weight: 4,
    category: 'Technical',
    evidenceSources: ['log360.agents'],
    check: (evidence) => {
      if (evidence.agents.total === 0) {
        return {
          status: 'fail',
          score: 0,
          message: 'No agents detected for health validation.',
          evidenceRefs: [makeRef('log360.agents', '0 agents discovered', evidence.collectedAt)],
        };
      }
      const ratio = evidence.agents.healthy / evidence.agents.total;
      const score = Math.round(ratio * 100);
      return {
        status: ratio >= 0.95 ? 'pass' : ratio >= 0.6 ? 'partial' : 'fail',
        score,
        message: `Healthy agent ratio: ${evidence.agents.healthy}/${evidence.agents.total}`,
        evidenceRefs: [
          makeRef('log360.agents', `Unhealthy agents: ${evidence.agents.unhealthy.join(', ') || 'none'}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'HIPAA-164.312(b)-AuditControls-LogonReportActive',
    controlId: 'HIPAA-164.312(b)',
    frameworkId: 'hipaa',
    family: 'Technical Safeguards',
    title: 'Audit controls - logon report active',
    weight: 4,
    category: 'Technical',
    evidenceSources: ['log360.recentReportSamples.windows_logon_success'],
    check: (evidence) => {
      const report = getReportByKey(evidence, 'logon_success') ?? getReportByKey(evidence, 'windows_logon');
      const pass = Boolean(report && report.totalItems > 0);
      return {
        status: pass ? 'pass' : 'fail',
        score: pass ? 100 : 0,
        message: pass ? 'Windows logon activity report contains records in last 24h.' : 'No logon activity records found in last 24h.',
        evidenceRefs: [
          makeRef('log360.recentReportSamples', `Logon report items: ${report?.totalItems ?? 0}`, report?.latestTimestamp ?? evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'HIPAA-164.312(b)-AuditControls-PrivilegedUserMonitoring',
    controlId: 'HIPAA-164.312(b)',
    frameworkId: 'hipaa',
    family: 'Technical Safeguards',
    title: 'Audit controls - privileged user monitoring',
    weight: 5,
    category: 'Technical',
    evidenceSources: ['log360.recentReportSamples.privileged_user_activity'],
    check: (evidence) => {
      const report = getReportByKey(evidence, 'privileged_user_activity') ?? getReportByKey(evidence, 'privileged');
      const pass = Boolean(report && report.totalItems > 0);
      return {
        status: pass ? 'pass' : 'fail',
        score: pass ? 100 : 0,
        message: pass ? 'Privileged user activity report contains data in last 7d.' : 'No privileged user activity evidence found.',
        evidenceRefs: [
          makeRef('log360.recentReportSamples', `Privileged report items: ${report?.totalItems ?? 0}`, report?.latestTimestamp ?? evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'HIPAA-164.312(c)(1)-Integrity-FileIntegrityMonitoring',
    controlId: 'HIPAA-164.312(c)(1)',
    frameworkId: 'hipaa',
    family: 'Technical Safeguards',
    title: 'Integrity - file integrity monitoring reports available',
    weight: 4,
    category: 'Technical',
    evidenceSources: ['log360.reportProfiles'],
    check: (evidence) => {
      const exists = Object.keys(evidence.reportProfiles.byUniqueKey).some((key) => key.toLowerCase().includes('file_integrity'));
      return {
        status: exists ? 'pass' : 'fail',
        score: exists ? 100 : 0,
        message: exists ? 'File Integrity report profile exists.' : 'No File Integrity report profile found.',
        evidenceRefs: [
          makeRef('log360.reportProfiles', `Profiles indexed: ${Object.keys(evidence.reportProfiles.byUniqueKey).length}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'HIPAA-164.308(a)(1)(ii)(D)-InformationSystemActivityReview',
    controlId: 'HIPAA-164.308(a)(1)',
    frameworkId: 'hipaa',
    family: 'Administrative Safeguards',
    title: 'Information system activity review',
    weight: 4,
    category: 'Administrative',
    evidenceSources: ['log360.recentReportSamples'],
    check: (evidence) => {
      const queried = Object.keys(evidence.recentReportSamples).length > 0;
      return {
        status: queried ? 'pass' : 'fail',
        score: queried ? 100 : 0,
        message: queried ? 'At least one report has been queried in the last sync window.' : 'No reports queried yet.',
        evidenceRefs: [
          makeRef('log360.recentReportSamples', `Sampled report count: ${Object.keys(evidence.recentReportSamples).length}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'HIPAA-164.308(a)(5)(ii)(C)-LogMonitoring',
    controlId: 'HIPAA-164.308(a)(5)',
    frameworkId: 'hipaa',
    family: 'Administrative Safeguards',
    title: 'Log monitoring',
    weight: 4,
    category: 'Administrative',
    evidenceSources: ['log360.incidents'],
    check: (evidence) => {
      const hasIncidentData = evidence.incidents.total > 0 || evidence.incidents.open > 0;
      return {
        status: hasIncidentData ? 'pass' : 'partial',
        score: hasIncidentData ? 100 : 50,
        message: hasIncidentData ? 'Incident stream available for monitoring review.' : 'No incidents found yet; monitoring might still be active.',
        evidenceRefs: [
          makeRef('log360.incidents', `Total incidents: ${evidence.incidents.total}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'HIPAA-164.308(a)(6)(ii)-IncidentResponse',
    controlId: 'HIPAA-164.308(a)(6)',
    frameworkId: 'hipaa',
    family: 'Administrative Safeguards',
    title: 'Incident response closure performance',
    weight: 5,
    category: 'Administrative',
    evidenceSources: ['log360.incidents'],
    check: (evidence) => {
      const total = evidence.incidents.total;
      if (total === 0) {
        return {
          status: 'partial',
          score: 50,
          message: 'No incidents available to compute closure ratio.',
          evidenceRefs: [makeRef('log360.incidents', 'No incidents collected', evidence.collectedAt)],
        };
      }
      const ratio = evidence.incidents.closed / total;
      const score = Math.round(ratio * 100);
      return {
        status: ratio >= 0.8 ? 'pass' : ratio >= 0.5 ? 'partial' : 'fail',
        score,
        message: `Incident closure ratio: ${evidence.incidents.closed}/${total}`,
        evidenceRefs: [
          makeRef('log360.incidents', `Open incidents: ${evidence.incidents.open}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'PCI-10.2.1-AuditTrailsImplemented',
    controlId: 'PCI-10.2',
    frameworkId: 'pcidss',
    family: 'Monitoring & Testing',
    title: 'Audit trails implemented for card-data systems',
    weight: 5,
    category: 'Technical',
    evidenceSources: ['log360.logSources'],
    check: (evidence) => {
      const typeKeys = Object.keys(evidence.logSources.byType).map((key) => key.toLowerCase());
      const hasWindows = typeKeys.some((key) => key.includes('windows'));
      const hasDatabase = typeKeys.some((key) => key.includes('db') || key.includes('sql') || key.includes('database'));
      const hasNetwork = typeKeys.some((key) => key.includes('network') || key.includes('firewall') || key.includes('router'));
      const pass = hasWindows && hasDatabase && hasNetwork;
      return {
        status: pass ? 'pass' : hasWindows || hasDatabase || hasNetwork ? 'partial' : 'fail',
        score: pass ? 100 : 50,
        message: pass
          ? 'Windows, database, and network device log sources are present for PCI DSS 10.2.'
          : 'PCI DSS 10.2 needs Windows, database, and network log-source coverage.',
        evidenceRefs: [
          makeRef('log360.logSources', `Detected types: ${typeKeys.join(', ') || 'none'}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'PCI-10.2.2-UserActionsLogged',
    controlId: 'PCI-10.2',
    frameworkId: 'pcidss',
    family: 'Monitoring & Testing',
    title: 'User actions logged',
    weight: 5,
    category: 'Technical',
    evidenceSources: ['log360.recentReportSamples.account_management', 'log360.recentReportSamples.windows_logon'],
    check: (evidence) => {
      const account = getReportByKey(evidence, 'account_management');
      const logon = getReportByKey(evidence, 'logon_success') ?? getReportByKey(evidence, 'windows_logon');
      const pass = Boolean(account && logon && account.totalItems > 0 && logon.totalItems > 0);
      return {
        status: pass ? 'pass' : 'fail',
        score: pass ? 100 : 0,
        message: pass ? 'Account management and logon reports both contain data.' : 'Missing account management or logon report activity.',
        evidenceRefs: [
          makeRef('log360.recentReportSamples', `Account items: ${account?.totalItems ?? 0}; Logon items: ${logon?.totalItems ?? 0}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'PCI-10.4-TimeSync',
    controlId: 'PCI-10.4',
    frameworkId: 'pcidss',
    family: 'Monitoring & Testing',
    title: 'Time synchronization',
    weight: 3,
    category: 'Technical',
    evidenceSources: [],
    check: () => pending(),
  },
  {
    id: 'PCI-10.5-SecureAuditTrails',
    controlId: 'PCI-10.5',
    frameworkId: 'pcidss',
    family: 'Monitoring & Testing',
    title: 'Secure audit trails',
    weight: 4,
    category: 'Technical',
    evidenceSources: ['log360.logSources', 'log360.agents'],
    check: (evidence) => {
      const ratio = evidence.agents.total === 0 ? 0 : evidence.agents.healthy / evidence.agents.total;
      const pass = evidence.logSources.count > 0 && ratio > 0.8;
      return {
        status: pass ? 'pass' : ratio > 0.5 ? 'partial' : 'fail',
        score: pass ? 100 : Math.round(ratio * 100),
        message: pass ? 'Log sources configured and healthy agent ratio above 80%.' : 'Improve agent health or ingest coverage.',
        evidenceRefs: [
          makeRef('log360.agents', `Healthy ratio: ${(ratio * 100).toFixed(1)}%`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'PCI-10.6-DailyReview',
    controlId: 'PCI-10.6',
    frameworkId: 'pcidss',
    family: 'Monitoring & Testing',
    title: 'Daily review activity',
    weight: 4,
    category: 'Administrative',
    evidenceSources: ['log360.incidents', 'log360.alerts'],
    check: (evidence) => {
      const active = evidence.incidents.total > 0 || evidence.alerts.total > 0;
      return {
        status: active ? 'pass' : 'fail',
        score: active ? 100 : 0,
        message: active ? 'Incident/alert activity indicates daily review pipeline is active.' : 'No incident or alert activity observed in sample window.',
        evidenceRefs: [
          makeRef('log360.alerts', `Alerts: ${evidence.alerts.total}, incidents: ${evidence.incidents.total}`, evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'PCI-10.7-RetainAuditHistory',
    controlId: 'PCI-10.7',
    frameworkId: 'pcidss',
    family: 'Monitoring & Testing',
    title: 'Retain audit history',
    weight: 4,
    category: 'Administrative',
    evidenceSources: [],
    check: () => pending('Manual attestation required — not technically measurable via Log360. Verify retention settings in Log360.'),
  },
  {
    id: 'PCI-8.2-StrongAuth-AccountLockoutMonitoring',
    controlId: 'PCI-8.3',
    frameworkId: 'pcidss',
    family: 'Access Control',
    title: 'Account lockout monitoring',
    weight: 4,
    category: 'Technical',
    evidenceSources: ['log360.recentReportSamples.windows_logon_failure'],
    check: (evidence) => {
      const failures = getReportByKey(evidence, 'logon_failure');
      const pass = Boolean(failures && failures.totalItems > 0);
      return {
        status: pass ? 'pass' : 'fail',
        score: pass ? 100 : 0,
        message: pass ? 'Logon failure evidence available for lockout monitoring.' : 'No logon failure evidence detected.',
        evidenceRefs: [
          makeRef('log360.recentReportSamples', `Logon failure items: ${failures?.totalItems ?? 0}`, failures?.latestTimestamp ?? evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'PCI-8.1.6-AccountLockout',
    controlId: 'PCI-8.3',
    frameworkId: 'pcidss',
    family: 'Access Control',
    title: 'Account lockout pattern detection',
    weight: 4,
    category: 'Technical',
    evidenceSources: ['log360.recentReportSamples.windows_logon_failure'],
    check: (evidence) => {
      const failures = getReportByKey(evidence, 'logon_failure');
      const pass = Boolean(failures && failures.totalItems > 0);
      return {
        status: pass ? 'pass' : 'fail',
        score: pass ? 100 : 0,
        message: pass ? 'Logon failures detected, indicating lockout monitoring telemetry.' : 'No lockout-related failure pattern detected.',
        evidenceRefs: [
          makeRef('log360.recentReportSamples', `Logon failure samples: ${failures?.sampleCount ?? 0}`, failures?.latestTimestamp ?? evidence.collectedAt),
        ],
      };
    },
  },
  {
    id: 'PCI-2.2-VendorDefaults',
    controlId: 'PCI-2.2',
    frameworkId: 'pcidss',
    family: 'Network Security',
    title: 'Vendor default configuration checks',
    weight: 4,
    category: 'Technical',
    evidenceSources: [],
    check: () => pending(),
  },
  {
    id: 'PCI-11.5-ChangeDetection',
    controlId: 'PCI-11.5',
    frameworkId: 'pcidss',
    family: 'Monitoring & Testing',
    title: 'Change detection evidence',
    weight: 5,
    category: 'Technical',
    evidenceSources: ['log360.reportProfiles'],
    check: (evidence) => {
      const keys = Object.keys(evidence.reportProfiles.byUniqueKey).map((k) => k.toLowerCase());
      const pass = keys.some((key) => key.includes('file_integrity') || key.includes('change'));
      return {
        status: pass ? 'pass' : 'fail',
        score: pass ? 100 : 0,
        message: pass ? 'File Integrity or Change report profiles were detected.' : 'No File Integrity/Change report profiles found.',
        evidenceRefs: [
          makeRef('log360.reportProfiles', `Profile count: ${keys.length}`, evidence.collectedAt),
        ],
      };
    },
  },
];

export function runControlChecks(frameworkId: 'hipaa' | 'pcidss', evidence: Evidence): EvaluatedControlCheck[] {
  return CONTROL_CHECKS
    .filter((check) => check.frameworkId === frameworkId)
    .map((check) => ({
      ...check,
      result: check.check(evidence),
    }));
}
