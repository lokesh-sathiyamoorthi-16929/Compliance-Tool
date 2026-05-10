import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearStoredConfig,
  loadObfuscatedConfig,
  saveObfuscatedConfig,
  saveSessionToken,
  tokenExpiresInSeconds,
} from './auth';

describe('log360 auth storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    clearStoredConfig();
  });

  it('round-trips obfuscated connection config', () => {
    saveObfuscatedConfig({
      baseUrl: 'http://log360.local:8095',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      refreshToken: 'refresh-token',
    });

    const loaded = loadObfuscatedConfig();
    expect(loaded?.baseUrl).toBe('http://log360.local:8095');
    expect(loaded?.clientId).toBe('client-id');
  });

  it('calculates token expiry countdown in seconds', () => {
    saveSessionToken({
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: Date.now() + 30_000,
    });

    const expiresIn = tokenExpiresInSeconds({
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: Date.now() + 30_000,
    });

    expect(expiresIn).not.toBeNull();
    expect((expiresIn ?? 0) <= 30).toBe(true);
    expect((expiresIn ?? 0) >= 0).toBe(true);
  });
});
