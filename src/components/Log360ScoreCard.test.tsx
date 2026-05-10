import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Log360ScoreCard from './Log360ScoreCard';
import { SAMPLE_LOG360_EVIDENCE } from '../api/log360/__fixtures__/sampleEvidence';

describe('Log360ScoreCard', () => {
  it('renders connect state when disconnected and no sample mode', () => {
    render(
      <MemoryRouter>
        <Log360ScoreCard connected={false} evidence={null} />
      </MemoryRouter>,
    );

    expect(screen.getByText('🔌 Connect Log360 to see your score.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Connect Log360' })).toHaveAttribute('href', '/connections');
  });

  it('renders sample-data label when fixture mode is used', () => {
    render(
      <MemoryRouter>
        <Log360ScoreCard connected evidence={SAMPLE_LOG360_EVIDENCE} sampleData />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sample data')).toBeInTheDocument();
    expect(screen.getByText(/Score based on 4 of 5 inputs/)).toBeInTheDocument();
  });

  it('shows honest unavailable note when no evidence has been collected yet', () => {
    render(
      <MemoryRouter>
        <Log360ScoreCard connected evidence={null} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Score unavailable — no successful metric inputs yet.')).toBeInTheDocument();
    expect(screen.getAllByText('Not collected yet').length).toBeGreaterThan(0);
  });
});
