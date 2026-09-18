import { AxiosError, AxiosHeaders, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from './tokenMemory';
import { refreshAccessToken } from './refresh';

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function setBearer(config: InternalAxiosRequestConfig, token: string): void {
  const headers =
    config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
}

function emitUnauthorized(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event('auth:unauthorized'));
  } catch {
    // ignore
  }
}

/**
 * Wires a JWT request interceptor and a refresh-and-retry response
 * interceptor onto an authenticated axios instance. Guest requests (no JWT)
 * go out with no Bearer.
 *
 * Not wired onto any client in this app — admin.ts/suggestions.ts/places.ts/
 * company.ts/candidateMetrics.ts/businessData.ts already get their tokens via
 * createApiClient's getAuthToken option instead; attaching this too would
 * double the 401-retry logic.
 */
export function attachInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(async (config: RetryableConfig) => {
    try {
      const jwt = getAccessToken();
      if (jwt) {
        setBearer(config, jwt);
      }
    } catch {
      // ignore token errors — allow guest requests
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const config = error.config as RetryableConfig | undefined;
      const status = error.response?.status;

      if (status !== 401 || !config) {
        return Promise.reject(error);
      }

      const url = config.url || '';
      const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/otp/');

      if (config._retry || isAuthEndpoint || !getAccessToken()) {
        emitUnauthorized();
        return Promise.reject(error);
      }

      try {
        const newToken = await refreshAccessToken();
        config._retry = true;
        setBearer(config, newToken);
        return client(config);
      } catch {
        emitUnauthorized();
        return Promise.reject(error);
      }
    },
  );
}
