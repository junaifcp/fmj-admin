// src/utils/auth.ts
import { useCallback } from "react";
import { useAuth as useJwtAuth, getAccessToken as getJwtAccessToken } from "@/auth";

/**
 * Shared token helper used by both non-hook and hook consumers.
 *
 * Exports:
 *  - getAuthToken(): Promise<string | null>   <-- non-hook, safe to call from apiClient
 *  - useAuthToken(): { getAuthToken, isAuthenticated, isLoading } <-- hook for components
 *  - clearTokenCache(): void
 */

/**
 * Non-hook token getter suitable for use in api clients / interceptors.
 * JWT memory token only — no caching/dedupe machinery needed since
 * tokenMemory's getter is already synchronous.
 *
 * IMPORTANT: this function does NOT use React hooks and is safe to call from non-React code.
 */
export async function getAuthToken(): Promise<string | null> {
  return getJwtAccessToken();
}

/**
 * Hook wrapper for token getter for React components.
 * - returns a hook-stable `getAuthToken` that will no-op until authenticated.
 * - also exposes basic auth state (isAuthenticated/isLoading).
 */
export const useAuthToken = () => {
  const jwtAuth = useJwtAuth();

  const getAuthTokenHook = useCallback(async (): Promise<string | null> => {
    if (!jwtAuth.isAuthenticated) return null;
    return await getAuthToken();
  }, [jwtAuth.isAuthenticated]);

  return {
    getAuthToken: getAuthTokenHook,
    isAuthenticated: jwtAuth.isAuthenticated,
    isLoading: jwtAuth.isLoading,
  };
};

/**
 * No-op: there's no cache left to clear now that getAuthToken() just reads
 * the JWT memory token directly. Kept so existing callers (the api modules'
 * onAuthError, AdminLayout, ImprovedAuthContext sign-out) don't need to change.
 */
export const clearTokenCache = () => {};
