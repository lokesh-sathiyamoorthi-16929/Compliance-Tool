import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Ad360PostureCard from './Ad360PostureCard';

const summary = {
  users: { total: 100, disabled: 10, lockedOut: 2, neverExpiringPassword: 3 },
  privilegedUsers: { count: 8, samNames: ['alice', 'bob'] },
  staleAccounts: { count: 4, samNames: ['legacy.user'] },
  computers: { total: 50, bitlockerEnabledPct: 92.5, osDistribution: { 'Windows 11': 40 } },
};

describe('Ad360PostureCard', () => {
  it('renders required tile values and details link', () => {
    render(
      <MemoryRouter>
        <Ad360PostureCard loading={false} error="" summary={summary} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Disabled: 10 · Locked: 2')).toBeInTheDocument();
    expect(screen.getByText('Privileged Users')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Stale Accounts')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('BitLocker %')).toBeInTheDocument();
    expect(screen.getByText('92.5%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View details →' })).toHaveAttribute('href', '/integrations/ad360');
  });
});
