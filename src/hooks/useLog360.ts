import { useMemo } from 'react';
import { createLog360Api } from '../api/log360';
import { loadObfuscatedConfig } from '../api/log360/auth';
import { useAppStore } from '../store/useAppStore';

export function useLog360() {
  const connection = useAppStore((state) => state.connections.log360);
  const config = loadObfuscatedConfig();

  const api = useMemo(() => createLog360Api(config ?? undefined), [config?.baseUrl, config?.clientId]);

  return {
    client: api,
    isConfigured: Boolean(config?.baseUrl && config?.clientId && config?.clientSecret && config?.refreshToken),
    isConnected: connection.connected,
    lastError: connection.lastError ?? null,
  };
}
