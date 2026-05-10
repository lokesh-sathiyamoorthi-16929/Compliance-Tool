import { Control } from '../../types';

export const iso27001Controls: Control[] = [
  {
    id: 'ISO-A.5.1',
    frameworkId: 'iso27001',
    family: 'Organizational Controls',
    title: 'A.5.1: Policies for Information Security',
    description: 'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals.',
    category: 'Organizational',
    required: true,
    weight: 3,
    technicalRequirements: ['Define information security policy', 'Obtain management approval', 'Communicate to all personnel', 'Review annually or when changes occur'],
    manageEngineProducts: [{ productId: 'ad360', coverage: 68, features: ['Policy acknowledgment tracking', 'Policy distribution workflows'], primary: true }],
    remediationSuggestions: ['Draft comprehensive information security policy', 'Implement policy acknowledgment via AD360', 'Schedule annual policy review cycle'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.5.15',
    frameworkId: 'iso27001',
    family: 'Organizational Controls',
    title: 'A.5.15: Access Control',
    description: 'Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.',
    category: 'Technical',
    required: true,
    weight: 5,
    technicalRequirements: ['Establish access control policy', 'Implement need-to-know access', 'Control access to information assets', 'Review access rights regularly'],
    manageEngineProducts: [
      { productId: 'ad360', coverage: 93, features: ['RBAC enforcement', 'Access governance', 'Access certification'], primary: true },
      { productId: 'pam360', coverage: 88, features: ['Privileged access management', 'Just-in-time access'], primary: false },
    ],
    remediationSuggestions: ['Implement RBAC across all systems via AD360', 'Deploy PAM360 for privileged access control', 'Conduct semi-annual access recertification campaigns'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.8.7',
    frameworkId: 'iso27001',
    family: 'Technological Controls',
    title: 'A.8.7: Protection Against Malware',
    description: 'Protection against malware shall be implemented and supported by appropriate user awareness.',
    category: 'Technical',
    required: true,
    weight: 4,
    technicalRequirements: ['Deploy anti-malware on all endpoints', 'Keep anti-malware signatures updated', 'Scan incoming and outgoing content', 'Provide user awareness on malware risks'],
    manageEngineProducts: [
      { productId: 'endpoint', coverage: 90, features: ['Anti-malware management', 'Real-time protection', 'Centralized scan management'], primary: true },
      { productId: 'log360', coverage: 78, features: ['Malware event correlation', 'Threat intelligence integration'], primary: false },
    ],
    remediationSuggestions: ['Deploy endpoint protection via Endpoint Central', 'Configure automatic daily signature updates', 'Forward malware alerts to Log360 for correlation'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.8.15',
    frameworkId: 'iso27001',
    family: 'Technological Controls',
    title: 'A.8.15: Logging',
    description: 'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.',
    category: 'Technical',
    required: true,
    weight: 5,
    technicalRequirements: ['Implement logging on all information systems', 'Protect logs from unauthorized modification', 'Retain logs per retention policy', 'Regularly review and analyze logs'],
    manageEngineProducts: [
      { productId: 'log360', coverage: 95, features: ['Centralized log management', 'Tamper-proof archival', 'Log analysis and correlation', 'Retention management'], primary: true },
      { productId: 'adaudit', coverage: 88, features: ['AD event logging', 'File system change logging'], primary: false },
    ],
    remediationSuggestions: ['Deploy Log360 as central log management platform', 'Enable logging on all systems and network devices', 'Implement tamper-proof log storage with hash verification'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.8.16',
    frameworkId: 'iso27001',
    family: 'Technological Controls',
    title: 'A.8.16: Monitoring Activities',
    description: 'Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.',
    category: 'Technical',
    required: true,
    weight: 5,
    technicalRequirements: ['Monitor networks and systems for anomalies', 'Implement SIEM/UEBA capabilities', 'Alert on suspicious activity', 'Investigate and respond to anomalies'],
    manageEngineProducts: [
      { productId: 'log360', coverage: 94, features: ['SIEM capabilities', 'UEBA', 'Network monitoring', 'Anomaly detection', 'Real-time alerting'], primary: true },
    ],
    remediationSuggestions: ['Deploy Log360 SIEM with UEBA for comprehensive monitoring', 'Establish monitoring coverage for all critical assets', 'Configure 24/7 automated alerting with response playbooks'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.8.8',
    frameworkId: 'iso27001',
    family: 'Technological Controls',
    title: 'A.8.8: Management of Technical Vulnerabilities',
    description: 'Information about technical vulnerabilities of information systems in use shall be obtained in a timely fashion, the organization\'s exposure to such vulnerabilities evaluated and appropriate measures taken.',
    category: 'Technical',
    required: true,
    weight: 4,
    technicalRequirements: ['Identify and assess technical vulnerabilities', 'Prioritize and remediate vulnerabilities by risk', 'Define patch management timelines', 'Monitor for new vulnerabilities'],
    manageEngineProducts: [
      { productId: 'vulnmanager', coverage: 92, features: ['Continuous vulnerability scanning', 'Risk-based prioritization', 'Remediation tracking', 'New CVE monitoring'], primary: true },
      { productId: 'patchmanager', coverage: 88, features: ['Automated patching', 'Patch compliance reporting'], primary: false },
    ],
    remediationSuggestions: ['Deploy Vulnerability Manager Plus for continuous assessment', 'Establish vulnerability SLAs: critical <30 days, high <60 days', 'Automate patching via Patch Manager Plus'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.5.23',
    frameworkId: 'iso27001',
    family: 'Organizational Controls',
    title: 'A.5.23: Information Security for Use of Cloud Services',
    description: 'Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization\'s information security requirements.',
    category: 'Organizational',
    required: true,
    weight: 3,
    technicalRequirements: ['Establish cloud service security requirements', 'Assess cloud providers security posture', 'Monitor cloud service usage', 'Manage cloud service exit processes'],
    manageEngineProducts: [
      { productId: 'log360', coverage: 82, features: ['Cloud audit trail collection (Azure, AWS, GCP)', 'Cloud security monitoring', 'CASB capabilities', 'Cloud service usage analytics'], primary: true },
    ],
    remediationSuggestions: ['Configure Log360 to collect audit logs from all cloud services', 'Implement cloud security posture monitoring', 'Document cloud provider security assessments'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.6.3',
    frameworkId: 'iso27001',
    family: 'People Controls',
    title: 'A.6.3: Information Security Awareness, Education and Training',
    description: 'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization\'s information security policy, topic-specific policies and procedures.',
    category: 'Administrative',
    required: true,
    weight: 3,
    technicalRequirements: ['Conduct security awareness training for all staff', 'Update training content when threats evolve', 'Track training completion', 'Test effectiveness of training'],
    manageEngineProducts: [
      { productId: 'ad360', coverage: 70, features: ['Training completion tracking', 'Policy awareness campaigns', 'Compliance attestation workflows'], primary: true },
    ],
    remediationSuggestions: ['Implement annual security awareness training for all staff', 'Track and report completion rates via AD360', 'Supplement with phishing simulation exercises'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.8.12',
    frameworkId: 'iso27001',
    family: 'Technological Controls',
    title: 'A.8.12: Data Leakage Prevention',
    description: 'Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.',
    category: 'Technical',
    required: true,
    weight: 4,
    technicalRequirements: ['Implement DLP tools on endpoints, network, and email', 'Classify sensitive data for DLP policies', 'Monitor and alert on sensitive data exfiltration', 'Block unauthorized data transfers'],
    manageEngineProducts: [
      { productId: 'datasecurity', coverage: 88, features: ['File server DLP', 'Sensitive data discovery', 'Unauthorized access prevention', 'Ransomware detection'], primary: true },
      { productId: 'log360', coverage: 82, features: ['Network DLP', 'Email DLP', 'Data exfiltration detection', 'DLP policy enforcement'], primary: false },
    ],
    remediationSuggestions: ['Deploy DataSecurity Plus for file server DLP', 'Configure Log360 for network and email DLP', 'Create DLP policies for each data classification level'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
  {
    id: 'ISO-A.8.24',
    frameworkId: 'iso27001',
    family: 'Technological Controls',
    title: 'A.8.24: Use of Cryptography',
    description: 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.',
    category: 'Technical',
    required: true,
    weight: 4,
    technicalRequirements: ['Define cryptography policy', 'Implement encryption for sensitive data at rest and in transit', 'Manage cryptographic keys securely', 'Review cryptographic standards annually'],
    manageEngineProducts: [
      { productId: 'pmp', coverage: 85, features: ['Cryptographic key management', 'Certificate lifecycle management', 'Key rotation automation'], primary: true },
      { productId: 'datasecurity', coverage: 78, features: ['Encryption compliance assessment', 'Unencrypted data detection'], primary: false },
    ],
    remediationSuggestions: ['Define and document cryptography policy', 'Implement key management via Password Manager Pro', 'Use DataSecurity Plus to discover unencrypted sensitive data', 'Enforce TLS 1.2+ on all systems'],
    referenceUrl: 'https://www.iso.org/standard/27001',
    inItScope: true,
  },
];

iso27001Controls.forEach((control) => {
  if (control.id.startsWith('ISO-A.5')) {
    control.theme = 'organizational';
    return;
  }
  if (control.id.startsWith('ISO-A.6')) {
    control.theme = 'people';
    return;
  }
  if (control.id.startsWith('ISO-A.7')) {
    control.theme = 'physical';
    return;
  }
  control.theme = 'technological';
});
