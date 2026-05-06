import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WizardAnswers, ConnectionState } from '../types';

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
  apiKey: '',
  lastSync: null,
  testing: false,
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
        })),
    }),
    {
      name: 'complianceiq-store',
    }
  )
);
