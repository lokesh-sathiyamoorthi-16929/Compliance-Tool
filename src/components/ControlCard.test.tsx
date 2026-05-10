import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ControlCard from './ControlCard';
import { getControlsByFrameworkId } from '../data/controls';
import { useAppStore } from '../store/useAppStore';
import type { Evidence } from '../services/evidenceCollector';

const sampleControl = getControlsByFrameworkId('hipaa')[0];

function makeEvidence(): Evidence {
  return {
    logSources: { count: 0, byType: {}, names: [], items: [] },
    agents: { total: 0, healthy: 0, unhealthy: [], items: [] },
    logSourceGroups: [],
    reportProfiles: { byUniqueKey: {}, all: [] },
    recentReportSamples: {},
    incidents: { total: 0, open: 0, closed: 0, bySeverity: {}, items: [] },
    alerts: { total: 0 },
    collectedAt: '2026-05-10T00:00:00.000Z',
    partialSuccess: false,
    errors: {},
  };
}

describe('ControlCard scoring CTA state machine', () => {
  beforeEach(() => {
    useAppStore.setState({
      connections: {
        log360: {
          connected: false,
          serverUrl: '',
          connectedAt: null,
          lastSync: null,
          testing: false,
          lastError: null,
        },
        ad360: {
          connected: false,
          serverUrl: '',
          connectedAt: null,
          lastSync: null,
          testing: false,
          lastError: null,
        },
      },
      log360Evidence: null,
      evidenceErrors: {},
      evidenceLoading: {},
    });
  });

  it('shows Connect Log360 CTA when disconnected and removes legacy copy', () => {
    render(
      <MemoryRouter>
        <ControlCard control={sampleControl} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Connect Log360 → Score' })).toHaveAttribute('href', '/connections');
    expect(screen.queryByText('Connect & Score')).not.toBeInTheDocument();
  });

  it('shows Sync Log360 CTA when connected but evidence has not been collected', () => {
    useAppStore.setState((state) => ({
      connections: {
        ...state.connections,
        log360: { ...state.connections.log360, connected: true },
      },
      log360Evidence: null,
    }));

    render(
      <MemoryRouter>
        <ControlCard control={sampleControl} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Sync Log360 → Score' })).toBeInTheDocument();
  });

  it('shows Re-score CTA when connected and evidence is available', () => {
    useAppStore.setState((state) => ({
      connections: {
        ...state.connections,
        log360: { ...state.connections.log360, connected: true },
      },
      log360Evidence: makeEvidence(),
    }));

    render(
      <MemoryRouter>
        <ControlCard control={sampleControl} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Re-score with live data' })).toBeInTheDocument();
  });
});
