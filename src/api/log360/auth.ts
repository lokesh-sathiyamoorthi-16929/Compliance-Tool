import type { Log360ConnectionConfig, Log360SessionToken, Log360TokenResponse } from './types';

const CONFIG_STORAGE_KEY = 'complianceiq-log360-config-v2';
const TOKEN_STORAGE_KEY = 'complianceiq-log360-token-v2';

let memoryToken: Log360SessionToken | null = null;

function encodeObfuscated(value: string): string {
  const encoded = new TextEncoder().encode(value);
  const binary = Array.from(encoded, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

function decodeObfuscated(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function saveObfuscatedConfig(config: Log360ConnectionConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, encodeObfuscated(JSON.stringify(config)));
}

export function loadObfuscatedConfig(): Log360ConnectionConfig | null {
  const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(decodeObfuscated(raw)) as Log360ConnectionConfig;
  } catch {
    return null;
  }
}

export function clearStoredConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  memoryToken = null;
}

export function saveSessionToken(token: Log360SessionToken): void {
  memoryToken = token;
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
}

export function loadSessionToken(): Log360SessionToken | null {
  if (memoryToken) return memoryToken;

  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;

  try {
    const token = JSON.parse(raw) as Log360SessionToken;
    memoryToken = token;
    return token;
  } catch {
    return null;
  }
}

export function tokenExpiresInSeconds(token: Log360SessionToken | null): number | null {
  if (!token) return null;
  const seconds = Math.floor((token.expiresAt - Date.now()) / 1000);
  return Math.max(0, seconds);
}

function toSessionToken(payload: Log360TokenResponse, fallbackRefreshToken: string): Log360SessionToken {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? fallbackRefreshToken,
    expiresAt: Date.now() + Math.max(1, payload.expires_in) * 1000,
  };
}

export class Log360AuthManager {
  constructor(private readonly config: Log360ConnectionConfig, private readonly fetcher: typeof fetch = fetch) {}

  getToken(): Log360SessionToken | null {
    return loadSessionToken();
  }

  async exchangeToken(): Promise<Log360SessionToken> {
    const response = await this.fetcher(`${this.config.baseUrl}/api/v2/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed (${response.status})`);
    }

    const payload = (await response.json()) as Log360TokenResponse;
    const token = toSessionToken(payload, this.config.refreshToken);
    saveSessionToken(token);
    return token;
  }

  async refreshToken(current?: Log360SessionToken | null): Promise<Log360SessionToken> {
    const refreshToken = current?.refreshToken ?? this.config.refreshToken;
    const response = await this.fetcher(`${this.config.baseUrl}/api/v2/oauth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed (${response.status})`);
    }

    const payload = (await response.json()) as Log360TokenResponse;
    const token = toSessionToken(payload, refreshToken);
    saveSessionToken(token);
    return token;
  }

  async getValidAccessToken(): Promise<string> {
    const current = this.getToken();
    if (current && current.expiresAt - Date.now() > 15_000) {
      return current.accessToken;
    }

    if (current) {
      const refreshed = await this.refreshToken(current);
      return refreshed.accessToken;
    }

    const exchanged = await this.exchangeToken();
    return exchanged.accessToken;
  }
}

export const log360AuthStorageKeys = {
  config: CONFIG_STORAGE_KEY,
  token: TOKEN_STORAGE_KEY,
};
