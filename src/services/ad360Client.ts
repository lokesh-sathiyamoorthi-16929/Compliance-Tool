import { ApiError, apiRequest } from '../api/client';
import type {
  Ad360Computer,
  Ad360Error,
  Ad360Group,
  Ad360ListResponse,
  Ad360OU,
  Ad360SummaryResponse,
  Ad360User,
} from '../types/ad360';

export interface Ad360ListOptions {
  fields?: string[];
  filter?: string;
  from?: number;
  limit?: number;
  refresh?: boolean;
}

export interface Ad360TestConnectionResult {
  ok: boolean;
  error?: string;
}

export class Ad360ClientError extends Error {
  status?: number;
  code?: string;
  detail?: string;

  constructor(message: string, options?: { status?: number; code?: string; detail?: string }) {
    super(message);
    this.status = options?.status;
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function mapAd360Error(error: unknown): Ad360ClientError {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return new Ad360ClientError(
        'Backend proxy not yet deployed — see docs/integrations/ad360/backend-proxy-spec.md',
        { status: 404, code: error.code },
      );
    }
    return new Ad360ClientError(error.message, { status: error.status, code: error.code });
  }

  if (error && typeof error === 'object' && 'error' in error) {
    const payload = error as Ad360Error;
    return new Ad360ClientError(payload.error.title || 'AD360 request failed.', {
      code: payload.error.code,
      detail: payload.error.detail,
    });
  }

  if (error instanceof Error) {
    return new Ad360ClientError(error.message);
  }

  return new Ad360ClientError('AD360 request failed.');
}

function toQueryString(opts: Ad360ListOptions): string {
  const params = new URLSearchParams();
  if (opts.fields?.length) params.set('fields', opts.fields.join(','));
  if (opts.filter) params.set('filter', opts.filter);
  if (opts.from !== undefined) params.set('from', String(opts.from));
  if (opts.limit !== undefined) params.set('limit', String(opts.limit));
  if (opts.refresh !== undefined) params.set('refresh', String(opts.refresh));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export class Ad360Client {
  async testConnection(): Promise<Ad360TestConnectionResult> {
    try {
      return await apiRequest<Ad360TestConnectionResult>('/integrations/ad360/test');
    } catch (error) {
      throw mapAd360Error(error);
    }
  }

  async listUsers(opts: Ad360ListOptions = {}): Promise<Ad360ListResponse<Ad360User>> {
    return this.list<Ad360User>('users', opts);
  }

  async listGroups(opts: Ad360ListOptions = {}): Promise<Ad360ListResponse<Ad360Group>> {
    return this.list<Ad360Group>('groups', opts);
  }

  async listComputers(opts: Ad360ListOptions = {}): Promise<Ad360ListResponse<Ad360Computer>> {
    return this.list<Ad360Computer>('computers', opts);
  }

  async listOrganizationalUnits(opts: Ad360ListOptions = {}): Promise<Ad360ListResponse<Ad360OU>> {
    return this.list<Ad360OU>('organizational_units', opts);
  }

  async getSummary(): Promise<Ad360SummaryResponse> {
    try {
      return await apiRequest<Ad360SummaryResponse>('/integrations/ad360/summary');
    } catch (error) {
      throw mapAd360Error(error);
    }
  }

  async listAll<T>(loader: (opts: Ad360ListOptions) => Promise<Ad360ListResponse<T>>, opts: Ad360ListOptions = {}): Promise<T[]> {
    const pageLimit = Math.min(opts.limit ?? 500, 500);
    const maxRows = 5000;
    let from = opts.from ?? 1;
    let total = Number.POSITIVE_INFINITY;
    const rows: T[] = [];

    while (rows.length < maxRows && from <= total) {
      const page = await loader({ ...opts, from, limit: pageLimit });
      rows.push(...page.data);
      total = page.meta.total_no_of_objects;
      from += page.data.length;
      if (page.data.length === 0) break;
    }

    return rows.slice(0, maxRows);
  }

  private async list<T>(resource: 'users' | 'groups' | 'computers' | 'organizational_units', opts: Ad360ListOptions): Promise<Ad360ListResponse<T>> {
    try {
      const query = toQueryString(opts);
      return await apiRequest<Ad360ListResponse<T>>(`/integrations/ad360/${resource}${query}`);
    } catch (error) {
      throw mapAd360Error(error);
    }
  }
}
