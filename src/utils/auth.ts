// src/utils/auth.ts
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useCallback } from "react";

/**
 * Shared token helper (module-level) used by both non-hook and hook consumers.
 *
 * - Dedupes inflight calls
 * - Caches token until its expiry (JWT `exp`)
 * - Applies a safety buffer before expiry
 *
 * Exports:
 *  - getAuthToken(): Promise<string | null>   <-- non-hook, safe to call from apiClient
 *  - useAuthToken(): { getAuthToken, isAuthenticated, isLoading } <-- hook for components
 *  - clearTokenCache(): void
 */

// Safety buffer (ms) before token `exp` that we consider it expired locally
const EXPIRY_BUFFER_MS = 15 * 1000; // 15 seconds

// Fallback cache TTL if token has no exp claim (ms)
const FALLBACK_CACHE_TTL_MS = 60 * 1000; // 60s

// Inflight / cache (module-level per tab)
type CacheEntry = { token: string; expiresAt: number } | undefined;
const tokenCacheRef: { entry: CacheEntry } = { entry: undefined };
const inflightRef: { promise: Promise<string | null> | undefined } = {
  promise: undefined,
};

// Helper: decode JWT payload (base64url). Returns `any` or null on failure.
// Note: this runs in browser so `atob` is available.
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // fix padding
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    return JSON.parse(json);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("decodeJwtPayload failed:", err);
    return null;
  }
}

/**
 * Non-hook token getter suitable for use in api clients / interceptors.
 * - Uses module-level cache (tokenCacheRef) and inflight dedupe (inflightRef).
 * - Reads token from `window.Clerk.session.getToken()` if available.
 *
 * IMPORTANT: this function does NOT use React hooks and is safe to call from non-React code.
 */
export async function getAuthToken(): Promise<string | null> {
  // Return cached token if still valid
  const cached = tokenCacheRef.entry;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  // If there's an inflight fetch, return it (dedupe)
  if (inflightRef.promise) {
    return inflightRef.promise;
  }

  // Start inflight fetch
  const p = (async () => {
    try {
      const maybeClerk: any = (window as any).Clerk;
      if (!maybeClerk?.session?.getToken) {
        // No Clerk global available — nothing we can do here
        return null;
      }

      const token: string | null = await maybeClerk.session.getToken();
      if (!token) return null;

      // Try to decode token exp
      const payload = decodeJwtPayload(token);
      let expiresAt = Date.now() + FALLBACK_CACHE_TTL_MS; // fallback
      if (payload && typeof payload.exp === "number") {
        // payload.exp is in seconds since epoch
        expiresAt = payload.exp * 1000 - EXPIRY_BUFFER_MS;
        // avoid negative expiry
        if (expiresAt <= Date.now()) {
          // token is already expired (or exp too close) — treat as null
          console.warn("Token already expired according to exp claim");
          return null;
        }
      }

      tokenCacheRef.entry = { token, expiresAt };
      return token;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("getAuthToken error:", err);
      tokenCacheRef.entry = undefined;
      return null;
    } finally {
      inflightRef.promise = undefined;
    }
  })();

  inflightRef.promise = p;
  return p;
}

/**
 * Hook wrapper for token getter for React components.
 * - returns a hook-stable `getAuthToken` that will no-op until Clerk is loaded & user signed in.
 * - also exposes basic auth state (isAuthenticated/isLoading).
 */
export const useAuthToken = () => {
  const { getToken: clerkGetToken, isLoaded, isSignedIn } = useClerkAuth();

  // Wrap the non-hook getAuthToken to respect Clerk hook readiness.
  const getAuthTokenHook = useCallback(async (): Promise<string | null> => {
    // If Clerk isn't ready or user not signed in, bail out early.
    if (!isLoaded || !isSignedIn) return null;

    // Prefer using Clerk's hook-getToken when available for slightly faster path,
    // but still reuse module-level cache & inflight dedupe by delegating to getAuthToken().
    // We attempt the fast path with clerkGetToken to avoid double requests in rare cases.
    try {
      if (typeof clerkGetToken === "function") {
        const token = await clerkGetToken();
        if (token) {
          // decode and cache similarly to non-hook function
          const payload = decodeJwtPayload(token);
          let expiresAt = Date.now() + FALLBACK_CACHE_TTL_MS;
          if (payload && typeof payload.exp === "number") {
            expiresAt = payload.exp * 1000 - EXPIRY_BUFFER_MS;
            if (expiresAt <= Date.now()) {
              // fall back to module-level implementation
              // eslint-disable-next-line no-console
              console.warn(
                "Clerk getToken returned token that is already expired according to exp claim"
              );
            } else {
              tokenCacheRef.entry = { token, expiresAt };
              return token;
            }
          } else {
            tokenCacheRef.entry = { token, expiresAt };
            return token;
          }
        }
      }
    } catch (err) {
      // swallow and fall back to shared getAuthToken
      // eslint-disable-next-line no-console
      console.warn("clerkGetToken fast path failed:", err);
    }

    // Fallback to the shared non-hook implementation (handles cache/inflight)
    return await getAuthToken();
  }, [clerkGetToken, isLoaded, isSignedIn]);

  return {
    getAuthToken: getAuthTokenHook,
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
  };
};

/**
 * Clear the cached token and any inflight promise (call on sign-out).
 */
export const clearTokenCache = () => {
  tokenCacheRef.entry = undefined;
  inflightRef.promise = undefined;
};
