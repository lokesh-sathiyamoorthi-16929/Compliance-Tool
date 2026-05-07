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

export const getControlsByFrameworkId = (frameworkId: string): Control[] =>
  controlsByFrameworkId[frameworkId] ?? [];

export const allControls: Control[] = Object.values(controlsByFrameworkId).flat();
