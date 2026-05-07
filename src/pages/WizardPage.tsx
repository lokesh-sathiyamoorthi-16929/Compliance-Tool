import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import WizardStep from '../components/WizardStep';
import { usStates } from '../data/usStates';
import { industries } from '../data/industries';
import type { DataType, CustomerGeography, BusinessContext, Industry } from '../types';

const TOTAL_STEPS = 8;

const dataTypeOptions: { id: DataType; label: string; description: string }[] = [
  { id: 'phi', label: 'PHI', description: 'Protected Health Information' },
  { id: 'payment_card', label: 'Payment Card Data', description: 'Credit/debit card numbers (PAN)' },
  { id: 'pii', label: 'PII', description: 'Personally Identifiable Information' },
  { id: 'cui', label: 'CUI', description: 'Controlled Unclassified Information' },
  { id: 'federal_data', label: 'Federal Government Data', description: 'Data from federal agencies' },
  { id: 'student_records', label: 'Student Records', description: 'Education records covered by FERPA' },
  { id: 'financial_data', label: 'Financial / Banking Data', description: 'Customer financial account data' },
];

const geographyOptions: { id: CustomerGeography; label: string; flag: string }[] = [
  { id: 'us', label: 'United States', flag: '🇺🇸' },
  { id: 'eu', label: 'European Union', flag: '🇪🇺' },
  { id: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'canada', label: 'Canada', flag: '🇨🇦' },
  { id: 'california', label: 'California Residents', flag: '☀️' },
  { id: 'other', label: 'Other Regions', flag: '🌍' },
];

const businessContextOptions: { id: BusinessContext; label: string }[] = [
  { id: 'saas_enterprise', label: 'Sells SaaS to enterprises' },
  { id: 'federal_contractor', label: 'Federal government contractor' },
  { id: 'process_credit_cards', label: 'Processes credit cards' },
  { id: 'cloud_hosted', label: 'Cloud-hosted infrastructure' },
];

const revenueRanges = [
  'Under $1M', '$1M–$10M', '$10M–$50M', '$50M–$250M', '$250M–$1B', 'Over $1B',
];

const employeeRanges = [
  '1–50', '51–250', '251–1,000', '1,001–5,000', '5,001–25,000', '25,000+',
];

function MultiSelectChip<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: { id: T; label: string; description?: string; flag?: string }[];
  selected: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            {opt.flag && <span>{opt.flag}</span>}
            <span>{opt.label}</span>
            {opt.description && !isSelected && (
              <span className="text-xs text-slate-400 hidden sm:inline">— {opt.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function WizardPage() {
  const navigate = useNavigate();
  const { wizardAnswers, wizardStep, setWizardAnswer, setWizardStep, resetWizard } =
    useAppStore();
  const [stateSearch, setStateSearch] = useState('');

  const step = wizardStep;

  const next = () => {
    if (step < TOTAL_STEPS - 1) setWizardStep(step + 1);
    else navigate('/frameworks');
  };
  const back = () => {
    if (step > 0) setWizardStep(step - 1);
  };

  const toggleArrayValue = <T extends string>(
    key: 'states' | 'dataTypes' | 'customerGeography' | 'businessContext',
    value: T
  ) => {
    const current = wizardAnswers[key] as T[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setWizardAnswer(key, updated as any);
  };

  const filteredStates = usStates.filter((s) =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(stateSearch.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applicability Wizard</h1>
          <p className="text-slate-500 mt-1">Answer questions to discover which compliance frameworks apply to your organization.</p>
        </div>
        <button
          onClick={() => { resetWizard(); }}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="card p-6">
        {/* Step 1: Country */}
        {step === 0 && (
          <WizardStep
            title="Country"
            description="Select your organization's primary country of operation."
            stepNumber={1}
            totalSteps={TOTAL_STEPS}
          >
            <div className="space-y-3">
              {['United States', 'Canada (Coming Soon)', 'United Kingdom (Coming Soon)', 'European Union (Coming Soon)'].map((country) => {
                const disabled = country.includes('Coming Soon');
                return (
                  <button
                    key={country}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setWizardAnswer('country', country)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-150 ${
                      wizardAnswers.country === country
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : disabled
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {country}
                  </button>
                );
              })}
            </div>
          </WizardStep>
        )}

        {/* Step 2: States */}
        {step === 1 && (
          <WizardStep
            title="State(s)"
            description="Select all US states where your organization operates."
            stepNumber={2}
            totalSteps={TOTAL_STEPS}
          >
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search states..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {wizardAnswers.states.length > 0 && (
                <p className="text-sm text-blue-600 font-medium">
                  {wizardAnswers.states.length} state(s) selected
                </p>
              )}
              <div className="max-h-60 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredStates.map((state) => {
                  const isSelected = wizardAnswers.states.includes(state.code);
                  return (
                    <button
                      key={state.code}
                      type="button"
                      onClick={() => toggleArrayValue('states', state.code)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-mono text-xs">{state.code}</span>{' '}
                      {state.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </WizardStep>
        )}

        {/* Step 3: Industry */}
        {step === 2 && (
          <WizardStep
            title="Industry"
            description="Select your organization's primary industry."
            stepNumber={3}
            totalSteps={TOTAL_STEPS}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {industries.map((ind) => {
                const isSelected = wizardAnswers.industry === ind.id;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setWizardAnswer('industry', ind.id as Industry)}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{ind.icon}</span>
                    <span className="font-semibold block">{ind.label}</span>
                    <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {ind.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </WizardStep>
        )}

        {/* Step 4: Data Types */}
        {step === 3 && (
          <WizardStep
            title="Data Types Handled"
            description="Select all types of sensitive data your organization processes or stores."
            stepNumber={4}
            totalSteps={TOTAL_STEPS}
          >
            <MultiSelectChip
              options={dataTypeOptions}
              selected={wizardAnswers.dataTypes}
              onToggle={(id) => toggleArrayValue('dataTypes', id)}
            />
          </WizardStep>
        )}

        {/* Step 5: Customer Geography */}
        {step === 4 && (
          <WizardStep
            title="Customer Geography"
            description="Where are your customers located?"
            stepNumber={5}
            totalSteps={TOTAL_STEPS}
          >
            <MultiSelectChip
              options={geographyOptions}
              selected={wizardAnswers.customerGeography}
              onToggle={(id) => toggleArrayValue('customerGeography', id)}
            />
          </WizardStep>
        )}

        {/* Step 6: Company Profile */}
        {step === 5 && (
          <WizardStep
            title="Company Profile"
            description="Tell us about your organization's size and structure."
            stepNumber={6}
            totalSteps={TOTAL_STEPS}
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Is your company publicly traded?
                </label>
                <div className="flex gap-3">
                  {[
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' },
                  ].map(({ value, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setWizardAnswer('publiclyTraded', value)}
                      className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all duration-150 ${
                        wizardAnswers.publiclyTraded === value
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Annual Revenue
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {revenueRanges.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setWizardAnswer('revenueRange', range)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-150 ${
                        wizardAnswers.revenueRange === range
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Number of Employees
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {employeeRanges.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setWizardAnswer('employeeCount', range)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-150 ${
                        wizardAnswers.employeeCount === range
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </WizardStep>
        )}

        {/* Step 7: Business Context */}
        {step === 6 && (
          <WizardStep
            title="Business Context"
            description="Select all that apply to your organization."
            stepNumber={7}
            totalSteps={TOTAL_STEPS}
          >
            <MultiSelectChip
              options={businessContextOptions}
              selected={wizardAnswers.businessContext}
              onToggle={(id) => toggleArrayValue('businessContext', id)}
            />
          </WizardStep>
        )}

        {/* Step 8: Review */}
        {step === 7 && (
          <WizardStep
            title="Review & Submit"
            description="Review your answers and see your applicable compliance frameworks."
            stepNumber={8}
            totalSteps={TOTAL_STEPS}
            completed
          >
            <div className="space-y-3">
              {[
                { label: 'Country', value: wizardAnswers.country },
                { label: 'States', value: wizardAnswers.states.length > 0 ? wizardAnswers.states.join(', ') : 'None selected' },
                { label: 'Industry', value: wizardAnswers.industry ?? 'Not selected' },
                { label: 'Data Types', value: wizardAnswers.dataTypes.length > 0 ? wizardAnswers.dataTypes.join(', ') : 'None' },
                { label: 'Customer Geography', value: wizardAnswers.customerGeography.length > 0 ? wizardAnswers.customerGeography.join(', ') : 'None' },
                { label: 'Publicly Traded', value: wizardAnswers.publiclyTraded === null ? 'Not answered' : wizardAnswers.publiclyTraded ? 'Yes' : 'No' },
                { label: 'Revenue Range', value: wizardAnswers.revenueRange || 'Not selected' },
                { label: 'Employees', value: wizardAnswers.employeeCount || 'Not selected' },
                { label: 'Business Context', value: wizardAnswers.businessContext.length > 0 ? wizardAnswers.businessContext.join(', ') : 'None' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-600">{label}</span>
                  <span className="text-sm text-slate-900 text-right max-w-xs truncate">{value}</span>
                </div>
              ))}
            </div>
          </WizardStep>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            onClick={next}
            className="btn-primary"
          >
            {step === TOTAL_STEPS - 1 ? 'See My Frameworks' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
