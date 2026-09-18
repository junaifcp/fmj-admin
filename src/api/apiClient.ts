// src/api/apiClient.ts
import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
  AxiosRequestConfig,
  AxiosHeaders,
} from "axios";
import { getAccessToken, refreshAccessToken } from "@/auth";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Async token getter type.
 * Should return a token string or null.
 */
export type AsyncTokenGetter = () => Promise<string | null>;

/**
 * Options for createApiClient
 */
export interface CreateApiClientOptions {
  baseURL: string;
  getAuthToken?: AsyncTokenGetter;
  /**
   * Optional callback invoked when a 401/Unauthorized response is received.
   * Useful to clear token caches / trigger sign-out flow.
   */
  onAuthError?: () => void;
  timeoutMs?: number;
}

/**
 * Create a configured axios instance.
 *
 * Notes:
 * - If `getAuthToken` is provided, it will be awaited for each request and the token
 *   will be attached as `Authorization: Bearer <token>` unless the request already
 *   supplies an Authorization header (per-call override).
 * - If an `onAuthError` callback is provided, it'll be invoked when a 401 response
 *   is detected in the response interceptor.
 */
export const createApiClient = (
  opts: CreateApiClientOptions
): AxiosInstance => {
  const { baseURL, getAuthToken, onAuthError, timeoutMs = 15000 } = opts;

  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Helper: check whether headers already contain an Authorization header (case-insensitive)
  const hasAuthHeader = (headers?: InternalAxiosRequestConfig["headers"]) => {
    try {
      // Normalize into AxiosHeaders for a reliable API
      const axiosHeaders = new AxiosHeaders(headers as any);
      return axiosHeaders.has("Authorization");
    } catch {
      // Fallback: inspect keys if normalization fails
      try {
        const keys = Object.keys((headers as Record<string, any>) || {});
        return keys.some((k) => k.toLowerCase() === "authorization");
      } catch {
        return false;
      }
    }
  };

  // Request interceptor: attach Authorization header if token available and not provided already.
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        if (getAuthToken && !hasAuthHeader(config.headers)) {
          const token = await getAuthToken();
          if (token) {
            // Normalize existing headers into AxiosHeaders and set Authorization
            const axiosHeaders = new AxiosHeaders(config.headers as any);
            axiosHeaders.set("Authorization", `Bearer ${token}`);
            // Assign back the AxiosHeaders instance (satisfies axios types)
            config.headers = axiosHeaders;
          }
        }
      } catch (err) {
        // Don't block request if token fetch fails - allow request to proceed unauthenticated.
        // eslint-disable-next-line no-console
        console.warn("createApiClient: getAuthToken failed", err);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: normalize errors, call onAuthError for 401
  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      // If axios received a response from server
      if (error.response) {
        const status = error.response.status;
        const config = error.config as RetryableConfig | undefined;

        // A JWT session gets one refresh-and-retry before falling through to
        // the onAuthError path.
        if (
          status === 401 &&
          config &&
          !config._retry &&
          getAccessToken() &&
          !(config.url || "").includes("/auth/refresh")
        ) {
          try {
            const newToken = await refreshAccessToken();
            config._retry = true;
            const headers =
              config.headers instanceof AxiosHeaders
                ? config.headers
                : new AxiosHeaders(config.headers);
            headers.set("Authorization", `Bearer ${newToken}`);
            config.headers = headers;
            return client(config);
          } catch {
            // refresh failed — fall through to onAuthError below
          }
        }

        // Optional auth error hook
        if (status === 401 && typeof onAuthError === "function") {
          try {
            onAuthError();
          } catch (e) {
            // swallow
            // eslint-disable-next-line no-console
            console.warn("createApiClient: onAuthError failed", e);
          }
        }

        // Try to build a useful message from response data
        const data = error.response.data;
        let message = `HTTP ${status}`;
        try {
          if (data && typeof data === "object") {
            const body = data as { message?: unknown; error?: unknown };
            if (typeof body.message === "string" && body.message.trim()) {
              message = body.message;
            } else if (typeof body.error === "string" && body.error.trim()) {
              message = body.error;
            }
          } else if (typeof data === "string" && data.trim()) {
            message = data;
          }
        } catch {
          // ignore parse errors, fall back to status-based message
        }

        const normalized = new Error(message) as Error & {
          status?: number;
          original?: AxiosError;
        };
        normalized.status = status;
        normalized.original = error;
        return Promise.reject(normalized);
      }

      // If request was aborted, axios sets error.code === 'ERR_CANCELED'
      if ((error as any)?.code === "ERR_CANCELED") {
        const e = new Error("Request aborted") as Error & {
          original?: AxiosError;
        };
        e.original = error;
        return Promise.reject(e);
      }

      // Network or unknown error - forward as-is
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Default getAuthToken using the JWT memory token. Keep this here as a
 * convenience; in production prefer injecting your stable token getter
 * (e.g. the non-hook getAuthToken exported from src/utils/auth.ts).
 */
export const defaultGetAuthToken: AsyncTokenGetter = async () => {
  return getAccessToken();
};
