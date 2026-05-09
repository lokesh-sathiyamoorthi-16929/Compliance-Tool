import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Log360Client } from './log360Client';

describe('Log360Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends auth and content-type headers for API requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ response: { log_fields: [{ field_name: 'host' }] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new Log360Client({
      baseUrl: 'https://log360.example.com',
      token: 'token-123',
    });

    await client.getLogFields();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, requestInit] = fetchMock.mock.calls[0];
    expect(url).toBe('https://log360.example.com/api/v2/meta/log-fields');
    expect((requestInit?.headers as Record<string, string>).Authorization).toBe('Bearer token-123');
    expect((requestInit?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('uses proxy url when useProxy is enabled', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ response: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new Log360Client({
      baseUrl: 'https://log360.example.com',
      token: 'token-123',
      useProxy: true,
    });

    await client.getLogSources();

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/proxy?target=');
    expect(String(url)).toContain(encodeURIComponent('https://log360.example.com/api/v2/log-sources'));
  });

  it('retries once on 5xx and succeeds', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { detail: 'server down' } }), { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: [] }), { status: 200 }));

    const client = new Log360Client({
      baseUrl: 'https://log360.example.com',
      token: 'token-123',
    });

    const sources = await client.getLogSources();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sources).toEqual([]);
  });

  it('maps unauthorized in testConnection to friendly message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: '07001113', title: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new Log360Client({
      baseUrl: 'https://log360.example.com',
      token: 'bad-token',
    });

    const result = await client.testConnection();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid or expired token');
  });

  it('throws typed error on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    const client = new Log360Client({
      baseUrl: 'https://log360.example.com',
      token: 'token-123',
    });

    await expect(client.getLogFields()).rejects.toMatchObject({
      kind: 'NETWORK_ERROR',
    });
  });
});
