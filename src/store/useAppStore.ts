import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WizardAnswers, ConnectionState } from '../types';
import type { Evidence } from '../services/evidenceCollector';

export type EvidenceErrorKey = keyof Evidence['errors'];

interface AppState {
  // Wizard
  wizardAnswers: WizardAnswers;
  wizardStep: number;
  setWizardAnswer: <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) => void;
  setWizardStep: (step: number) => void;
  resetWizard: () => void;

  // Selected framework for dashboard
  selectedFrameworkId: string;
  setSelectedFrameworkId: (id: string) => void;

  // Connections
  connections: {
    log360: ConnectionState;
    ad360: ConnectionState;
  };
  updateConnection: (product: 'log360' | 'ad360', state: Partial<ConnectionState>) => void;
  disconnectProduct: (product: 'log360' | 'ad360') => void;

  // Log360 evidence cache
  log360Evidence: Evidence | null;
  evidenceLoading: Partial<Record<EvidenceErrorKey | 'all', boolean>>;
  evidenceErrors: Partial<Record<EvidenceErrorKey, string>>;
  setLog360Evidence: (evidence: Evidence | null) => void;
  setEvidenceLoading: (key: EvidenceErrorKey | 'all', loading: boolean) => void;
  setEvidenceError: (key: EvidenceErrorKey, error?: string) => void;
  clearEvidenceErrors: () => void;
}

const defaultWizardAnswers: WizardAnswers = {
  country: 'United States',
  states: [],
  industry: null,
  dataTypes: [],
  customerGeography: [],
  publiclyTraded: null,
  revenueRange: '',
  employeeCount: '',
  businessContext: [],
};

const defaultConnectionState: ConnectionState = {
  connected: false,
  serverUrl: '',
  connectedAt: null,
  lastSync: null,
  testing: false,
  lastConnectionLatencyMs: undefined,
  lastError: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      wizardAnswers: defaultWizardAnswers,
      wizardStep: 0,

      setWizardAnswer: (key, value) =>
        set((state) => ({
          wizardAnswers: { ...state.wizardAnswers, [key]: value },
        })),

      setWizardStep: (step) => set({ wizardStep: step }),

      resetWizard: () =>
        set({ wizardAnswers: defaultWizardAnswers, wizardStep: 0 }),

      selectedFrameworkId: 'hipaa',
      setSelectedFrameworkId: (id) => set({ selectedFrameworkId: id }),

      connections: {
        log360: { ...defaultConnectionState },
        ad360: { ...defaultConnectionState },
      },

      updateConnection: (product, state) =>
        set((prev) => ({
          connections: {
            ...prev.connections,
            [product]: { ...prev.connections[product], ...state },
          },
        })),

      disconnectProduct: (product) =>
        set((prev) => ({
          connections: {
            ...prev.connections,
            [product]: { ...defaultConnectionState },
          },
          ...(product === 'log360'
            ? {
                log360Evidence: null,
                evidenceErrors: {},
                evidenceLoading: {},
              }
            : {}),
        })),

      log360Evidence: null,
      evidenceLoading: {},
      evidenceErrors: {},
      setLog360Evidence: (log360Evidence) => set({ log360Evidence }),
      setEvidenceLoading: (key, loading) =>
        set((prev) => ({
          evidenceLoading: {
            ...prev.evidenceLoading,
            [key]: loading,
          },
        })),
      setEvidenceError: (key, error) =>
        set((prev) => {
          const nextErrors = { ...prev.evidenceErrors };
          if (!error) {
            delete nextErrors[key];
          } else {
            nextErrors[key] = error;
          }
          return { evidenceErrors: nextErrors };
        }),
      clearEvidenceErrors: () => set({ evidenceErrors: {} }),
    }),
    {
      name: 'complianceiq-store',
    }
  )
);
