import { Control } from '../../types';
import { hipaaControls } from './hipaa';
import { pcidssControls } from './pcidss';
import { soc2Controls } from './soc2';
import { nistcsfControls } from './nistcsf';
import { iso27001Controls } from './iso27001';
import { cmmcControls } from './cmmc';
import { nist800171Controls } from './nist800171';
import { nist80053Controls } from './nist80053';
import { cjisControls } from './cjis';
import { fedrampControls } from './fedramp';

export const controlsByFrameworkId: Record<string, Control[]> = {
  hipaa: hipaaControls,
  pcidss: pcidssControls,
  soc2: soc2Controls,
  nistcsf: nistcsfControls,
  iso27001: iso27001Controls,
  cmmc: cmmcControls,
  nist800171: nist800171Controls,
  nist80053: nist80053Controls,
  cjis: cjisControls,
  fedramp: fedrampControls,
};

const standardSourceByFramework: Record<string, string> = {
  hipaa: 'https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html',
  pcidss: 'https://www.pcisecuritystandards.org/document_library/',
  soc2: 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2',
  iso27001: 'https://www.iso.org/standard/27001',
  nistcsf: 'https://www.nist.gov/cyberframework',
  nist800171: 'https://csrc.nist.gov/pubs/sp/800/171/r3/final',
  nist80053: 'https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final',
  cmmc: 'https://dodcio.defense.gov/CMMC/',
  fedramp: 'https://www.fedramp.gov/baselines/',
  cjis: 'https://www.fbi.gov/services/cjis/cjis-security-policy-resource-center',
};

const meComplianceBriefByFramework: Record<string, string> = {
  hipaa: 'https://www.manageengine.com/hipaa-compliance.html',
  pcidss: 'https://www.manageengine.com/products/eventlog/pci-dss-compliance.html',
  soc2: 'https://www.manageengine.com/log-management/compliance.html',
  iso27001: 'https://www.manageengine.com/log-management/compliance.html',
  nistcsf: 'https://www.manageengine.com/log-management/compliance.html',
  nist800171: 'https://www.manageengine.com/log-management/compliance.html',
  nist80053: 'https://www.manageengine.com/log-management/compliance.html',
  cmmc: 'https://www.manageengine.com/log-management/compliance.html',
  fedramp: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
  cjis: 'https://www.manageengine.com/compliance-manager/compliance-hub.html',
};

Object.entries(controlsByFrameworkId).forEach(([frameworkId, controls]) => {
  controlsByFrameworkId[frameworkId] = controls.map((control) => ({
    ...control,
    sourceMetadata: {
      standardSourceUrl:
        standardSourceByFramework[frameworkId] ?? control.referenceUrl ?? 'https://www.manageengine.com/compliance.html',
      meComplianceBriefUrl: meComplianceBriefByFramework[frameworkId],
      confidence: 'interpreted',
      lastReviewed: '2026-05-07',
      reviewedBy: 'Marcus Hale (compliance interpretation)',
      notes: 'Mapping based on public framework documentation and ManageEngine product references.',
    },
  }));
});

export const getControlsByFrameworkId = (frameworkId: string): Control[] =>
  controlsByFrameworkId[frameworkId] ?? [];

export const allControls: Control[] = Object.values(controlsByFrameworkId).flat();
