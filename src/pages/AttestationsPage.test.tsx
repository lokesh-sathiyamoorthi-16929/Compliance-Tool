import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AttestationsPage from './AttestationsPage';
import { useAppStore } from '../store/useAppStore';

function renderPage() {
  return render(
    <MemoryRouter>
      <AttestationsPage />
    </MemoryRouter>,
  );
}

describe('AttestationsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      attestations: {},
      connections: {
        log360: {
          connected: true,
          serverUrl: 'https://example',
          connectedAt: new Date().toISOString(),
          lastSync: null,
          testing: false,
          lastConnectionLatencyMs: undefined,
          lastError: null,
        },
        ad360: {
          connected: false,
          serverUrl: '',
          connectedAt: null,
          lastSync: null,
          testing: false,
          lastConnectionLatencyMs: undefined,
          lastError: null,
        },
      },
      log360Evidence: {
        logSources: { count: 1, byType: { windows: 1 }, names: ['dc'], items: [] },
        agents: { total: 1, healthy: 1, unhealthy: [], items: [] },
        logSourceGroups: [],
        reportProfiles: { byUniqueKey: {}, all: [] },
        recentReportSamples: {},
        incidents: { total: 0, open: 0, closed: 0, bySeverity: {}, items: [] },
        alerts: { total: 1 },
        collectedAt: new Date().toISOString(),
        partialSuccess: false,
        errors: {},
      },
    });
  });

  it('persists attestations with default expiry (365d) and survives localStorage round-trip', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    vi.setSystemTime(now);

    renderPage();

    fireEvent.click(screen.getAllByRole('button', { name: 'Attest L1' })[0]);
    fireEvent.change(screen.getByLabelText('Statement'), {
      target: { value: 'Policy approved by leadership' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save attestation' }));

    await waitFor(() => {
      const raw = localStorage.getItem('complianceiq-attestations-v1');
      expect(raw).toBeTruthy();
    });

    const raw = localStorage.getItem('complianceiq-attestations-v1');
    const parsed = JSON.parse(raw ?? '{}') as Record<string, Array<{ expiresAt: string }>>;
    const firstControlKey = Object.keys(parsed)[0];
    const expiresAt = new Date(parsed[firstControlKey][0].expiresAt).getTime();
    expect(expiresAt - now.getTime()).toBe(365 * 24 * 60 * 60 * 1000);

    renderPage();
    expect(screen.getAllByText(/expires/).length).toBeGreaterThan(0);
  });

  it('shows upload size cap warning for files larger than 1 MB', async () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: 'Attest L1' })[0]);

    const input = screen.getByTestId('attestation-file-input') as HTMLInputElement;
    const oversized = new File([new Uint8Array(1024 * 1024 + 5)], 'big.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [oversized] } });

    expect(await screen.findByText('File exceeds 1 MB. Please upload a smaller file.')).toBeInTheDocument();
  });
});
