import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../api/client';
import { Ad360Client } from './ad360Client';

vi.mock('../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof client>();
  return {
    ...original,
    apiRequest: vi.fn(),
  };
});

const apiRequestMock = vi.mocked(client.apiRequest);

describe('Ad360Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('testConnection uses backend proxy contract endpoint', async () => {
    apiRequestMock.mockResolvedValue({ ok: true });
    const ad360 = new Ad360Client();
    const result = await ad360.testConnection();
    expect(result).toEqual({ ok: true });
    expect(apiRequestMock).toHaveBeenCalledWith('/integrations/ad360/test');
  });

  it('passes fields/filter/from/limit/refresh query params to listUsers', async () => {
    apiRequestMock.mockResolvedValue({
      data: [],
      meta: { start_index: 1, limit: 50, total_no_of_objects: 0 },
    });

    const ad360 = new Ad360Client();
    await ad360.listUsers({
      fields: ['SAM_ACCOUNT_NAME', 'ACCOUNT_STATUS'],
      filter: '(ACCOUNT_STATUS eq Disabled)',
      from: 11,
      limit: 50,
      refresh: true,
    });

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/integrations/ad360/users?fields=SAM_ACCOUNT_NAME%2CACCOUNT_STATUS&filter=%28ACCOUNT_STATUS+eq+Disabled%29&from=11&limit=50&refresh=true',
    );
  });

  it('listAll paginates until total_no_of_objects', async () => {
    const ad360 = new Ad360Client();
    const loader = vi
      .fn()
      .mockResolvedValueOnce({
        data: [{ id: 1 }, { id: 2 }],
        meta: { start_index: 1, limit: 2, total_no_of_objects: 3 },
      })
      .mockResolvedValueOnce({
        data: [{ id: 3 }],
        meta: { start_index: 3, limit: 2, total_no_of_objects: 3 },
      });

    const rows = await ad360.listAll(loader, { limit: 2 });
    expect(rows).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(loader).toHaveBeenCalledTimes(2);
    expect(loader).toHaveBeenNthCalledWith(1, { limit: 2, from: 1 });
    expect(loader).toHaveBeenNthCalledWith(2, { limit: 2, from: 3 });
  });

  it('maps 404 errors to backend proxy not deployed guidance', async () => {
    apiRequestMock.mockRejectedValue(new client.ApiError('NOT_FOUND', 'Request failed with status 404', 404));
    const ad360 = new Ad360Client();
    await expect(ad360.getSummary()).rejects.toMatchObject({
      message: 'Backend proxy not yet deployed — see docs/integrations/ad360/backend-proxy-spec.md',
      status: 404,
    });
  });
});
