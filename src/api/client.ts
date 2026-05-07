import { getApiBaseUrl } from '../config/env';

export interface BackendErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface ApiClientAuthBridge {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void> | void;
}

const defaultBridge: ApiClientAuthBridge = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  setTokens: () => undefined,
  logout: () => undefined,
};

let authBridge: ApiClientAuthBridge = defaultBridge;
let refreshPromise: Promise<boolean> | null = null;

export function configureApiClient(bridge: ApiClientAuthBridge) {
  authBridge = bridge;
}

function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError('API_NOT_CONFIGURED', 'Backend API is not configured.');
  }
  return `${baseUrl}${path}`;
}

async function parseApiError(response: Response): Promise<ApiError> {
  let payload: BackendErrorResponse | null = null;
  try {
    payload = (await response.json()) as BackendErrorResponse;
  } catch {
    payload = null;
  }

  const code = payload?.error?.code ?? 'UNKNOWN_ERROR';
  const message = payload?.error?.message ?? `Request failed with status ${response.status}`;
  return new ApiError(code, message, response.status);
}

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = authBridge.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(getApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };

      authBridge.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
  retryOn401?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    headers,
    body,
    skipAuth = false,
    retryOn401 = true,
    ...rest
  } = options;

  const requestHeaders = new Headers(headers ?? {});
  if (!requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const accessToken = authBridge.getAccessToken();
    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  try {
    const response = await fetch(getApiUrl(path), {
      ...rest,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401 && retryOn401 && path !== '/auth/refresh' && path !== '/auth/logout') {
      const didRefresh = await refreshTokens();
      if (didRefresh) {
        return apiRequest<T>(path, { ...options, retryOn401: false });
      }

      await authBridge.logout();
      throw new ApiError('UNAUTHORIZED', 'Your session has expired. Please sign in again.', 401);
    }

    if (!response.ok) {
      throw await parseApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      'NETWORK_UNREACHABLE',
      'Backend is unreachable. Start the API server and try again.',
    );
  }
}
