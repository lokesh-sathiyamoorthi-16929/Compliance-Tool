import { WizardAnswers, Framework } from '../types';
import { frameworks } from '../data/frameworks';

export interface ApplicabilityResult {
  mandatory: Framework[];
  recommended: Framework[];
}

export function determineApplicableFrameworks(
  answers: WizardAnswers
): ApplicabilityResult {
  const mandatoryIds = new Set<string>();
  const recommendedIds = new Set<string>(['soc2', 'nistcsf', 'iso27001']);

  const { industry, dataTypes, customerGeography, publiclyTraded, businessContext, states } = answers;

  // HIPAA: Healthcare industry AND PHI data
  if (industry === 'healthcare' && dataTypes.includes('phi')) {
    mandatoryIds.add('hipaa');
  }

  // PCI DSS: Payment card data
  if (dataTypes.includes('payment_card') || businessContext.includes('process_credit_cards')) {
    mandatoryIds.add('pcidss');
  }

  // CCPA: California state OR California residents as customers
  if (states.includes('CA') || customerGeography.includes('california')) {
    mandatoryIds.add('ccpa');
  }

  // GDPR: EU customers
  if (customerGeography.includes('eu')) {
    mandatoryIds.add('gdpr');
  }

  // SOX: Publicly traded company
  if (publiclyTraded === true) {
    mandatoryIds.add('sox');
  }

  // FERPA: Education industry
  if (industry === 'education' || dataTypes.includes('student_records')) {
    mandatoryIds.add('ferpa');
  }

  // NIST 800-171 + CMMC: Government contractor OR CUI data
  if (
    industry === 'government' ||
    dataTypes.includes('cui') ||
    dataTypes.includes('federal_data') ||
    businessContext.includes('federal_contractor')
  ) {
    mandatoryIds.add('nist800171');
    mandatoryIds.add('cmmc');
  }

  // GLBA: Financial services industry
  if (industry === 'financial' || dataTypes.includes('financial_data')) {
    mandatoryIds.add('glba');
  }

  // Remove any recommended that became mandatory
  for (const id of mandatoryIds) {
    recommendedIds.delete(id);
  }

  const mandatory = frameworks
    .filter((f) => mandatoryIds.has(f.id))
    .map((f) => ({ ...f, mandatory: true }));

  const recommended = frameworks
    .filter((f) => recommendedIds.has(f.id))
    .map((f) => ({ ...f, mandatory: false }));

  return { mandatory, recommended };
}
