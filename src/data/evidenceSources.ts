export interface EvidenceSource {
  type: 'standard' | 'product' | 'methodology' | 'verification' | 'infographic';
  title: string;
  description: string;
  url?: string;
  confidence: 'verified' | 'interpreted' | 'reference';
}

const verificationEntry: EvidenceSource = {
  type: 'verification',
  title: 'Last reviewed: 2026-05-07',
  description:
    'Reviewed by Marcus Hale (compliance interpretation). Customer SME and ManageEngine product team validation pending.',
  confidence: 'interpreted',
};

const methodologyEntries: EvidenceSource[] = [
  {
    type: 'methodology',
    title: 'Applicability rules',
    description:
      "Derived from each framework's official scope statements (HIPAA covered entities, PCI DSS merchant levels, NIST 800-171 CUI handlers, etc.).",
    confidence: 'interpreted',
  },
  {
    type: 'methodology',
    title: 'ManageEngine product mapping',
    description:
      "Based on publicly documented product capabilities and ManageEngine's own compliance reporting modules. Mappings are interpretations, not certifications.",
    confidence: 'interpreted',
  },
  {
    type: 'methodology',
    title: 'Coverage % methodology',
    description:
      "Estimated coverage of a control's technical requirements by the indicated ManageEngine product, ranging 0–100%. Estimates are not audited.",
    confidence: 'interpreted',
  },
  {
    type: 'methodology',
    title: 'Score calculation',
    description:
      "Weighted composite of control pass/partial/fail status, where weight is the control's relative importance (1–5) within the framework.",
    confidence: 'interpreted',
  },
];

const genericStandards: EvidenceSource[] = [
  {
    type: 'standard',
    title: 'HIPAA Security Rule',
    description: 'Official HHS HIPAA Security Rule laws and regulations.',
    url: 'https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html',
    confidence: 'verified',
  },
  {
    type: 'standard',
    title: 'PCI DSS Document Library',
    description: 'Official PCI Security Standards Council document library.',
    url: 'https://www.pcisecuritystandards.org/document_library/',
    confidence: 'verified',
  },
  {
    type: 'standard',
    title: 'NIST Cybersecurity Framework 2.0',
    description: 'Official NIST CSF 2.0 framework reference.',
    url: 'https://www.nist.gov/cyberframework',
    confidence: 'verified',
  },
];

const productReferences: EvidenceSource[] = [
  {
    type: 'product',
    title: 'ManageEngine Compliance Hub',
    description: 'Top-level ManageEngine compliance resources.',
    url: 'https://www.manageengine.com/compliance.html',
    confidence: 'verified',
  },
  {
    type: 'product',
    title: 'ManageEngine Log360 Compliance Reporting',
    description:
      'Compliance reporting references for SOC 2, ISO 27001, NIST CSF, NIST 800-171, GDPR, CCPA, and related frameworks.',
    url: 'https://www.manageengine.com/log-management/compliance.html',
    confidence: 'verified',
  },
  {
    type: 'product',
    title: 'ManageEngine Compliance Manager Hub',
    description: 'Compliance Manager Plus compliance hub and resources.',
    url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
    confidence: 'reference',
  },
];

export const evidenceByPage: Record<string, EvidenceSource[]> = {
  home: [...genericStandards, ...productReferences, ...methodologyEntries, verificationEntry],
  wizard: [...genericStandards, ...productReferences, ...methodologyEntries, verificationEntry],
  frameworks: [...genericStandards, ...productReferences, ...methodologyEntries, verificationEntry],
  'framework-detail': [
    ...genericStandards,
    ...productReferences,
    ...methodologyEntries,
    verificationEntry,
  ],
  connections: [...genericStandards, ...productReferences, ...methodologyEntries, verificationEntry],
  dashboard: [...genericStandards, ...productReferences, ...methodologyEntries, verificationEntry],
  compare: [...genericStandards, ...productReferences, ...methodologyEntries, verificationEntry],
};

export const frameworkEvidence: Record<string, EvidenceSource[]> = {
  hipaa: [
    {
      type: 'standard',
      title: 'HHS HIPAA Security Rule',
      description: 'Official HIPAA Security Rule reference from HHS.',
      url: 'https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html',
      confidence: 'verified',
    },
    {
      type: 'standard',
      title: 'HIPAA eCFR Part 164',
      description: 'Electronic Code of Federal Regulations text for HIPAA safeguards.',
      url: 'https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine HIPAA Compliance',
      description: 'ManageEngine HIPAA compliance reference page.',
      url: 'https://www.manageengine.com/hipaa-compliance.html',
      confidence: 'verified',
    },
    {
      type: 'infographic',
      title: 'ManageEngine HIPAA Compliance Infographic (PDF)',
      description: 'Official ManageEngine infographic mapping products to HIPAA controls. Authoritative reference material for prospects and auditors.',
      url: 'https://download.manageengine.com/images/hipaa-compliance-infographic.pdf?HIPAACompliance',
      confidence: 'verified',
    },
  ],
  pcidss: [
    {
      type: 'standard',
      title: 'PCI DSS v4.0.1',
      description: 'PCI SSC source documents for PCI DSS.',
      url: 'https://www.pcisecuritystandards.org/document_library/',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine PCI DSS (EventLog Analyzer)',
      description: 'ManageEngine PCI DSS reporting reference.',
      url: 'https://www.manageengine.com/products/eventlog/pci-dss-compliance.html',
      confidence: 'verified',
    },
  ],
  soc2: [
    {
      type: 'standard',
      title: 'SOC 2 (AICPA TSC 2017)',
      description: 'AICPA SOC 2 Trust Services Criteria reference.',
      url: 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for SOC 2 reporting alignment.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'reference',
    },
    {
      type: 'product',
      title: 'ManageEngine Compliance Manager Hub',
      description: 'Secondary ManageEngine compliance reference.',
      url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
      confidence: 'reference',
    },
  ],
  iso27001: [
    {
      type: 'standard',
      title: 'ISO 27001',
      description: 'Official ISO 27001 standard page.',
      url: 'https://www.iso.org/standard/27001',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for ISO 27001 reporting alignment.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'reference',
    },
    {
      type: 'product',
      title: 'ManageEngine Compliance Manager Hub',
      description: 'Secondary ManageEngine compliance reference.',
      url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
      confidence: 'reference',
    },
  ],
  nistcsf: [
    {
      type: 'standard',
      title: 'NIST CSF 2.0',
      description: 'Official NIST Cybersecurity Framework source.',
      url: 'https://www.nist.gov/cyberframework',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for NIST CSF reporting alignment.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'reference',
    },
    {
      type: 'product',
      title: 'ManageEngine Compliance Manager Hub',
      description: 'Secondary ManageEngine compliance reference.',
      url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
      confidence: 'reference',
    },
  ],
  nist800171: [
    {
      type: 'standard',
      title: 'NIST SP 800-171 Rev 3',
      description: 'Official NIST publication for CUI protection controls.',
      url: 'https://csrc.nist.gov/pubs/sp/800/171/r3/final',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for NIST 800-171 reporting alignment.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'reference',
    },
    {
      type: 'product',
      title: 'ManageEngine Compliance Manager Hub',
      description: 'Secondary ManageEngine compliance reference.',
      url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
      confidence: 'reference',
    },
  ],
  nist80053: [
    {
      type: 'standard',
      title: 'NIST SP 800-53 Rev 5',
      description: 'Official NIST publication for security and privacy controls.',
      url: 'https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for NIST 800-53 reporting alignment.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'reference',
    },
    {
      type: 'product',
      title: 'ManageEngine Compliance Manager Hub',
      description: 'Secondary ManageEngine compliance reference.',
      url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
      confidence: 'reference',
    },
  ],
  cmmc: [
    {
      type: 'standard',
      title: 'CMMC 2.0',
      description: 'Official DoD CMMC program reference.',
      url: 'https://dodcio.defense.gov/CMMC/',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for CMMC-aligned compliance reporting.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'reference',
    },
    {
      type: 'product',
      title: 'ManageEngine Compliance Manager Hub',
      description: 'Secondary ManageEngine compliance reference.',
      url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
      confidence: 'reference',
    },
  ],
  fedramp: [
    {
      type: 'standard',
      title: 'FedRAMP Baselines',
      description: 'Official FedRAMP baseline control resources.',
      url: 'https://www.fedramp.gov/baselines/',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for FedRAMP-aligned compliance reporting.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'reference',
    },
    {
      type: 'product',
      title: 'ManageEngine Compliance Manager Hub',
      description: 'Secondary ManageEngine compliance reference.',
      url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
      confidence: 'reference',
    },
  ],
  cjis: [
    {
      type: 'standard',
      title: 'CJIS Security Policy Resource Center',
      description: 'Official FBI CJIS policy resources and reference material.',
      url: 'https://www.fbi.gov/services/cjis/cjis-security-policy-resource-center',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for CJIS-aligned compliance reporting.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'reference',
    },
    {
      type: 'product',
      title: 'ManageEngine Compliance Manager Hub',
      description: 'Secondary ManageEngine compliance reference.',
      url: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
      confidence: 'reference',
    },
  ],
  gdpr: [
    {
      type: 'standard',
      title: 'GDPR',
      description: 'Official GDPR text reference.',
      url: 'https://gdpr-info.eu/',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine GDPR Compliance',
      description: 'ManageEngine GDPR compliance reference page.',
      url: 'https://www.manageengine.com/gdpr-compliance.html',
      confidence: 'verified',
    },
  ],
  ccpa: [
    {
      type: 'standard',
      title: 'CCPA',
      description: 'California Attorney General CCPA reference.',
      url: 'https://oag.ca.gov/privacy/ccpa',
      confidence: 'verified',
    },
    {
      type: 'product',
      title: 'ManageEngine Log360 Compliance Reporting',
      description: 'Referenced for CCPA-aligned reporting capabilities.',
      url: 'https://www.manageengine.com/log-management/compliance.html',
      confidence: 'verified',
    },
  ],
};
