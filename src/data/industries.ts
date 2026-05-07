export interface IndustryOption {
  id: string;
  label: string;
  description: string;
  iconName: string;
}

export const industries: IndustryOption[] = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Hospitals, clinics, health plans, clearinghouses, and business associates',
    iconName: 'HeartPulse',
  },
  {
    id: 'financial',
    label: 'Financial Services',
    description: 'Banks, credit unions, investment firms, insurance, and fintech',
    iconName: 'Banknote',
  },
  {
    id: 'retail',
    label: 'Retail / E-commerce',
    description: 'Retailers, e-commerce platforms, and merchants accepting card payments',
    iconName: 'ShoppingCart',
  },
  {
    id: 'technology',
    label: 'Tech / SaaS',
    description: 'Software companies, cloud service providers, and technology platforms',
    iconName: 'Laptop',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'K-12 schools, universities, and educational institutions receiving federal funds',
    iconName: 'GraduationCap',
  },
  {
    id: 'government',
    label: 'Government Contractor',
    description: 'Companies with federal contracts, DoD suppliers, and defense contractors',
    iconName: 'Landmark',
  },
  {
    id: 'law_enforcement',
    label: 'Law Enforcement',
    description: 'Police departments, sheriff offices, fusion centers, and agencies handling CJI',
    iconName: 'Shield',
  },
  {
    id: 'energy',
    label: 'Energy / Utilities',
    description: 'Electric utilities, oil & gas, water systems, and critical infrastructure',
    iconName: 'Zap',
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    description: 'Discrete and process manufacturers, including defense industrial base',
    iconName: 'Factory',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other industries and business types',
    iconName: 'Building2',
  },
];
