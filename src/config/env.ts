function normalizeApiBaseUrl(url: string | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string | null {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
}

export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true' || !getApiBaseUrl();
}

export function isConnectedMode(): boolean {
  return !isDemoMode();
}

export function isLog360MockMode(): boolean {
  return import.meta.env.VITE_LOG360_MOCK === 'true';
}
