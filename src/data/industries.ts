export interface IndustryOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const industries: IndustryOption[] = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Hospitals, clinics, health plans, clearinghouses, and business associates',
    icon: '🏥',
  },
  {
    id: 'financial',
    label: 'Financial Services',
    description: 'Banks, credit unions, investment firms, insurance, and fintech',
    icon: '🏦',
  },
  {
    id: 'retail',
    label: 'Retail / E-commerce',
    description: 'Retailers, e-commerce platforms, and merchants accepting card payments',
    icon: '🛒',
  },
  {
    id: 'technology',
    label: 'Tech / SaaS',
    description: 'Software companies, cloud service providers, and technology platforms',
    icon: '💻',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'K-12 schools, universities, and educational institutions receiving federal funds',
    icon: '🎓',
  },
  {
    id: 'government',
    label: 'Government Contractor',
    description: 'Companies with federal contracts, DoD suppliers, and defense contractors',
    icon: '🏛️',
  },
  {
    id: 'law_enforcement',
    label: 'Law Enforcement',
    description: 'Police departments, sheriff offices, fusion centers, and agencies handling CJI',
    icon: '🚔',
  },
  {
    id: 'energy',
    label: 'Energy / Utilities',
    description: 'Electric utilities, oil & gas, water systems, and critical infrastructure',
    icon: '⚡',
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    description: 'Discrete and process manufacturers, including defense industrial base',
    icon: '🏭',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other industries and business types',
    icon: '🏢',
  },
];
