import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { collectLog360Overview, type Log360Overview } from '../services/log360Overview';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to load Log360 evidence.';
}

interface UseLog360EvidenceOptions {
  autoRefresh?: boolean;
}

export function useLog360Evidence({ autoRefresh = true }: UseLog360EvidenceOptions = {}) {
  const connected = useAppStore((state) => state.connections.log360.connected);
  const updateConnection = useAppStore((state) => state.updateConnection);
  const [overview, setOverview] = useState<Log360Overview | null>(null);
  const [loading, setLoading] = useState(autoRefresh);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const nextOverview = await collectLog360Overview();
      setOverview(nextOverview);
      updateConnection('log360', {
        connected: nextOverview.configured && nextOverview.ok,
        lastSync: nextOverview.fetchedAt,
        lastError: nextOverview.ok ? null : (nextOverview.errors[0] ?? null),
      });
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      setOverview(null);
      updateConnection('log360', {
        connected: false,
        lastError: message,
      });
    } finally {
      setLoading(false);
    }
  }, [updateConnection]);

  useEffect(() => {
    if (!autoRefresh) {
      setLoading(false);
      return;
    }

    void refresh();
  }, [autoRefresh, refresh]);

  return {
    connected,
    overview,
    loading,
    error,
    refresh,
  };
}
