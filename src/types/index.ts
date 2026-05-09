export interface MEProductMapping {
  productId: string;
  coverage: number; // 0-100
  features: string[];
  primary: boolean;
}

export interface Control {
  id: string;
  frameworkId: string;
  family: string;
  title: string;
  description: string;
  category: 'Technical' | 'Administrative' | 'Physical' | 'Organizational';
  required: boolean;
  addressable?: boolean;
  weight: 1 | 2 | 3 | 4 | 5;
  technicalRequirements: string[];
  manageEngineProducts: MEProductMapping[];
  remediationSuggestions: string[];
  referenceUrl?: string;
  sourceMetadata?: {
    standardSourceUrl: string;
    meComplianceBriefUrl?: string;
    confidence: 'verified' | 'interpreted' | 'reference';
    lastReviewed: string;
    reviewedBy: string;
    notes?: string;
  };
  inItScope: boolean;
}

export interface Framework {
  id: string;
  name: string;
  fullName: string;
  description: string;
  category: 'regulatory' | 'industry' | 'framework';
  region: string[];
  controlCount: number;
  meCoveragePercent: number;
  color: string;
  iconName: string;
  mandatory?: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
  validationStatus: 'sme_validated' | 'interpreted' | 'auto_generated';
  lastValidated?: string;
}

export interface MEProduct {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  website: string;
  useCases: string[];
  color: string;
}

export type Industry =
  | 'healthcare'
  | 'financial'
  | 'retail'
  | 'technology'
  | 'education'
  | 'government'
  | 'law_enforcement'
  | 'energy'
  | 'manufacturing'
  | 'other';

export type DataType =
  | 'phi'
  | 'payment_card'
  | 'pii'
  | 'cui'
  | 'federal_data'
  | 'student_records'
  | 'financial_data';

export type CustomerGeography =
  | 'us'
  | 'eu'
  | 'uk'
  | 'canada'
  | 'california'
  | 'other';

export type BusinessContext =
  | 'saas_enterprise'
  | 'federal_contractor'
  | 'process_credit_cards'
  | 'cloud_hosted';

export interface WizardAnswers {
  country: string;
  states: string[];
  industry: Industry | null;
  dataTypes: DataType[];
  customerGeography: CustomerGeography[];
  publiclyTraded: boolean | null;
  revenueRange: string;
  employeeCount: string;
  businessContext: BusinessContext[];
}

export interface ConnectionState {
  connected: boolean;
  serverUrl: string;
  token: string;
  useProxy: boolean;
  connectedAt: string | null;
  lastSync: string | null;
  testing: boolean;
  lastConnectionLatencyMs?: number;
  lastError?: string | null;
}

export type MaturityTier = {
  tier: number;
  label: string;
  color: string;
  range: [number, number];
};

export interface ScoreTrendPoint {
  month: string;
  score: number;
}

export interface FamilyScore {
  family: string;
  score: number;
  controlCount: number;
}

export interface RemediationAction {
  id: string;
  controlId: string;
  controlTitle: string;
  scoreGain: number;
  recommendedProduct: string;
  actionDescription: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

export interface MockScoreData {
  frameworkId: string;
  overallScore: number;
  trend: ScoreTrendPoint[];
  familyScores: FamilyScore[];
  passed: number;
  failed: number;
  partial: number;
  notApplicable: number;
  remediationActions: RemediationAction[];
}
