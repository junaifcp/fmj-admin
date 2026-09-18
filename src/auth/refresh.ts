import { requestRefresh } from './authApi';

// Single in-flight refresh: two parallel 401s must share one POST
// /auth/refresh, never two. Never call this from the refresh request itself.
let inflight: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!inflight) {
    inflight = requestRefresh().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
