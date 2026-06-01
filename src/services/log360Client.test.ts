import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Log360Client, Log360ClientError } from './log360Client';
import * as client from '../api/client';

vi.mock('../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof client>();
  return {
    ...original,
    apiRequest: vi.fn(),
  };
});

const apiRequestMock = vi.mocked(client.apiRequest);

describe('Log360Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes requests through backend proxy path', async () => {
    apiRequestMock.mockResolvedValue({ response: { log_fields: [{ field_name: 'host' }] } });

    const log360 = new Log360Client();
    await log360.getLogFields();

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const [path, options] = apiRequestMock.mock.calls[0];
    expect(path).toBe('/integrations/log360/proxy/api/v2/meta/log-fields');
    expect((options as { method?: string })?.method).toBe('GET');
    expect((options as { body?: unknown })?.body).toBeUndefined();
  });

  it('getAlerts() uses POST /integrations/log360/proxy/api/v2/alerts with filter body', async () => {
    apiRequestMock.mockResolvedValue({ response: [] });

    const log360 = new Log360Client();
    await log360.getAlerts();

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const [path, options] = apiRequestMock.mock.calls[0];
    expect(path).toBe('/integrations/log360/proxy/api/v2/alerts');
    expect((options as { method?: string })?.method).toBe('POST');
    expect((options as { body?: unknown })?.body).toEqual({});
  });

  it('getAlertProfiles() uses GET /integrations/log360/proxy/api/v2/alerts/profile (singular)', async () => {
    apiRequestMock.mockResolvedValue({ response: [{ profile_id: 'p1', profile_name: 'Critical Alerts' }] });

    const log360 = new Log360Client();
    const result = await log360.getAlertProfiles();

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    const [path, options] = apiRequestMock.mock.calls[0];
    expect(path).toBe('/integrations/log360/proxy/api/v2/alerts/profile');
    expect((options as { method?: string })?.method).toBe('GET');
    expect(result).toEqual([{ profile_id: 'p1', profile_name: 'Critical Alerts' }]);
  });

  it('maps LOG360_NOT_CONFIGURED to NOT_CONFIGURED error', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('LOG360_NOT_CONFIGURED', 'No credentials configured.', 409),
    );

    const log360 = new Log360Client();

    await expect(log360.getLogSources()).rejects.toMatchObject({
      kind: 'NOT_CONFIGURED',
      message: 'No Log360 connection saved. Configure it on the Connections page.',
    });
  });

  it('maps LOG360_UNREACHABLE to NETWORK_ERROR', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('LOG360_UNREACHABLE', 'Cannot reach Log360.', 502),
    );

    const log360 = new Log360Client();

    await expect(log360.getLogSources()).rejects.toMatchObject({
      kind: 'NETWORK_ERROR',
      message: 'Backend could not reach Log360 server (network error).',
    });
  });

  it('maps LOG360_TIMEOUT to TIMEOUT error', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('LOG360_TIMEOUT', 'Log360 timed out.', 504),
    );

    const log360 = new Log360Client();

    await expect(log360.getLogSources()).rejects.toMatchObject({
      kind: 'TIMEOUT',
      message: 'Log360 did not respond within 30 seconds.',
    });
  });

  it('maps 401 from backend to UNAUTHORIZED', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('UNAUTHORIZED', 'Session expired.', 401),
    );

    const log360 = new Log360Client();

    await expect(log360.getLogSources()).rejects.toMatchObject({
      kind: 'UNAUTHORIZED',
      message: 'Your ComplianceIQ session expired. Please log in again.',
    });
  });

  it('maps NETWORK_UNREACHABLE to NETWORK_ERROR', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('NETWORK_UNREACHABLE', 'Backend is unreachable.'),
    );

    const log360 = new Log360Client();

    await expect(log360.getLogSources()).rejects.toMatchObject({
      kind: 'NETWORK_ERROR',
    });
  });

  it('passes through upstream Log360 5xx as SERVER_ERROR', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('UPSTREAM_ERROR', 'Internal server error.', 500),
    );

    const log360 = new Log360Client();

    await expect(log360.getLogSources()).rejects.toMatchObject({
      kind: 'SERVER_ERROR',
      status: 500,
    });
  });

  it('testConnection probes the proxy log fields endpoint', async () => {
    apiRequestMock.mockResolvedValue({ response: { log_fields: [{ field_name: 'host' }, { field_name: 'source' }] } });

    const log360 = new Log360Client();
    const result = await log360.testConnection();

    expect(result.success).toBe(true);
    expect(result.fieldCount).toBe(2);
    expect(apiRequestMock).toHaveBeenCalledWith('/integrations/log360/proxy/api/v2/meta/log-fields', {
      method: 'GET',
      body: undefined,
    });
  });

  it('testConnection returns success=false when the proxy probe fails', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('LOG360_UNREACHABLE', 'Cannot reach Log360.', 502),
    );

    const log360 = new Log360Client();
    const result = await log360.testConnection();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Backend could not reach Log360 server (network error).');
  });

  it('testConnection returns success=false when apiRequest throws', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('LOG360_NOT_CONFIGURED', 'No credentials.', 409),
    );

    const log360 = new Log360Client();
    const result = await log360.testConnection();

    expect(result.success).toBe(false);
    expect(result.error).toBe('No Log360 connection saved. Configure it on the Connections page.');
  });

  it('Log360ClientError preserves kind, status, and code', () => {
    const err = new Log360ClientError('NOT_CONFIGURED', 'msg', 409, 'LOG360_NOT_CONFIGURED');
    expect(err.kind).toBe('NOT_CONFIGURED');
    expect(err.status).toBe(409);
    expect(err.code).toBe('LOG360_NOT_CONFIGURED');
  });

  it('maps upstream 404 to NOT_AVAILABLE_IN_BUILD', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('NOT_FOUND', 'Not found.', 404),
    );

    const log360 = new Log360Client();

    await expect(log360.getLogSources()).rejects.toMatchObject({
      kind: 'NOT_AVAILABLE_IN_BUILD',
      status: 404,
    });
  });

  it('maps upstream 501 to NOT_AVAILABLE_IN_BUILD', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('NOT_IMPLEMENTED', 'Not implemented.', 501),
    );

    const log360 = new Log360Client();

    await expect(log360.getLogSources()).rejects.toMatchObject({
      kind: 'NOT_AVAILABLE_IN_BUILD',
      status: 501,
    });
  });

  it('getDetections() returns [] when endpoint returns NOT_AVAILABLE_IN_BUILD (404)', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('NOT_FOUND', 'Not found.', 404),
    );

    const log360 = new Log360Client();
    const result = await log360.getDetections();

    expect(result).toEqual([]);
  });

  it('getDetections() returns real data when endpoint is available', async () => {
    apiRequestMock.mockResolvedValue({ response: [{ detection_id: 'd1', severity: 'high' }] });

    const log360 = new Log360Client();
    const result = await log360.getDetections();

    expect(result).toEqual([{ detection_id: 'd1', severity: 'high' }]);
    const [path] = apiRequestMock.mock.calls[0];
    expect(path).toBe('/integrations/log360/proxy/api/v2/detection/detections');
  });

  it('getMitreCatalog() returns [] when endpoint returns NOT_AVAILABLE_IN_BUILD (501)', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('NOT_IMPLEMENTED', 'Not implemented.', 501),
    );

    const log360 = new Log360Client();
    const result = await log360.getMitreCatalog();

    expect(result).toEqual([]);
  });

  it('simpleSearch() returns [] when endpoint returns NOT_AVAILABLE_IN_BUILD', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('NOT_FOUND', 'Not found.', 404),
    );

    const log360 = new Log360Client();
    const result = await log360.simpleSearch({ query: 'host:server1' });

    expect(result).toEqual([]);
  });

  it('simpleSearch() uses POST /api/v2/search with payload', async () => {
    apiRequestMock.mockResolvedValue({ response: [{ message: 'login success' }] });

    const log360 = new Log360Client();
    const result = await log360.simpleSearch({ query: 'host:server1' });

    expect(result).toEqual([{ message: 'login success' }]);
    const [path, options] = apiRequestMock.mock.calls[0];
    expect(path).toBe('/integrations/log360/proxy/api/v2/search');
    expect((options as { method?: string })?.method).toBe('POST');
  });

  it('getAlertProfile() returns null when endpoint returns NOT_AVAILABLE_IN_BUILD', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('NOT_FOUND', 'Not found.', 404),
    );

    const log360 = new Log360Client();
    const result = await log360.getAlertProfile('p1');

    expect(result).toBeNull();
  });

  it('aggregatedSearch() returns null when endpoint returns NOT_AVAILABLE_IN_BUILD', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('NOT_FOUND', 'Not found.', 404),
    );

    const log360 = new Log360Client();
    const result = await log360.aggregatedSearch({ query: 'host:server1' });

    expect(result).toBeNull();
  });

  it('getDetections() still throws for non-NOT_AVAILABLE_IN_BUILD errors', async () => {
    apiRequestMock.mockRejectedValue(
      new client.ApiError('LOG360_UNREACHABLE', 'Cannot reach Log360.', 502),
    );

    const log360 = new Log360Client();

    await expect(log360.getDetections()).rejects.toMatchObject({
      kind: 'NETWORK_ERROR',
    });
  });
});
