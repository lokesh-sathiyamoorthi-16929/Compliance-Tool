import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Log360ScoreCard from './Log360ScoreCard';
import type { Log360Summary } from '../api/integrations';

const sampleSummary: Log360Summary = {
  configured: true,
  ok: true,
  fetchedAt: '2026-05-08T00:00:00.000Z',
  productVersion: '2.0.0',
  sources: {
    total: 4,
    online: 3,
    offline: 1,
    unknown: 0,
    samples: [],
  },
  alerts: {
    total: 10,
    open: 3,
    closed: 7,
    bySeverity: {},
    samples: [],
  },
  score: {
    overall: 82,
    band: 'attention',
    breakdown: {
      health: { score: 80, weight: 0.25, reason: 'Good' },
      coverage: { score: 77, weight: 0.25, reason: 'Good' },
      detection: { score: 85, weight: 0.25, reason: 'Good' },
      response: { score: 79, weight: 0.25, reason: 'Good' },
    },
  },
  errors: [],
};

describe('Log360ScoreCard', () => {
  it('renders loading state', () => {
    render(
      <MemoryRouter>
        <Log360ScoreCard state="loading" />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Loading Log360 compliance score')).toBeInTheDocument();
  });

  it('renders not configured state', () => {
    render(
      <MemoryRouter>
        <Log360ScoreCard state="not-configured" />
      </MemoryRouter>,
    );

    expect(screen.getByText('🔌 Connect Log360 to see your score.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add Credential' })).toHaveAttribute('href', '/admin/credentials');
  });

  it('renders error state with retry', () => {
    const onRetry = vi.fn();

    render(
      <MemoryRouter>
        <Log360ScoreCard state="error" error="Forbidden" onRetry={onRetry} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders ok state with score breakdown and details link', () => {
    render(
      <MemoryRouter>
        <Log360ScoreCard state="ok" summary={sampleSummary} />
      </MemoryRouter>,
    );

    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('Attention')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View details →' })).toHaveAttribute('href', '/integrations/log360');
  });
});
