import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenMemory';
import { refreshAccessToken } from './refresh';
import { fetchMe, logout as logoutRequest } from './authApi';
import { PublicUser } from './types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  user: PublicUser | null;
  signOut: () => Promise<void>;
  setSession: (accessToken: string, user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

interface JwtSessionState {
  hasToken: boolean;
  user: PublicUser | null;
}

// JWT only (jwt-authentication phase 9.4): memory access token + httpOnly
// refresh cookie. Admins are provisioned, never self-registered — a session
// here only exists for a Mongo admin/superadmin.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const [jwt, setJwt] = useState<JwtSessionState>({
    hasToken: !!getAccessToken(),
    user: null,
  });
  const [isBooting, setIsBooting] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isMounted = useRef(true);

  // Used to remember if we went offline (so we don't sign out immediately)
  const offlineSinceRef = useRef<number | null>(null);

  // If we received an unauthorized while offline, remember that so we can act when back online
  const unauthorizedWhileOfflineRef = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Boot: restore a JWT session from the httpOnly refresh cookie, if any.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!getAccessToken()) {
        try {
          await refreshAccessToken();
        } catch {
          // no valid refresh cookie — stay signed out
        }
      }
      if (getAccessToken()) {
        try {
          const me = await fetchMe();
          if (mounted) setJwt({ hasToken: true, user: me });
        } catch {
          // A session isn't "established" unless the token AND the Mongo
          // profile resolve together — never leave hasToken:true with no
          // role information.
          clearAccessToken();
          if (mounted) setJwt({ hasToken: false, user: null });
        }
      }
      if (mounted) setIsBooting(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Called after a successful OTP/Google verify: flips isAuthenticated/user
  // reactively for every consumer of this context.
  const setSession = useCallback((accessToken: string, user: PublicUser) => {
    setAccessToken(accessToken);
    setJwt({ hasToken: true, user });
  }, []);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      try {
        await logoutRequest();
      } catch {
        // ignore — cookie may already be dead
      }
      clearAccessToken();
      setJwt({ hasToken: false, user: null });
      queryClient.clear();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('app:signed_out', Date.now().toString());
        } catch {
          /* ignore localStorage errors */
        }
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Error signing out', err);
      if (isMounted.current) setIsSigningOut(false);
    }
  }, [queryClient, isSigningOut]);

  /**
   * onUnauthorized handler: improved to NOT sign-out when browser is offline.
   * If offline, we set a flag and wait for the 'online' event to re-check.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onUnauthorized = () => {
      if (isSigningOut) return;

      clearAccessToken();
      setJwt({ hasToken: false, user: null });

      // If we're offline, don't sign out — remember and wait until we are back online.
      if (!navigator.onLine) {
        offlineSinceRef.current = Date.now();
        unauthorizedWhileOfflineRef.current = true;
        return;
      }

      try {
        window.location.href = '/sign-in';
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [isSigningOut]);

  // Cross-tab sign-out listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'app:signed_out') {
        try {
          window.location.href = '/';
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /**
   * Handle online/offline events:
   * - When offline: mark offlineSinceRef.
   * - When online: if we previously deferred an unauthorized, re-check session
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onOffline = () => {
      offlineSinceRef.current = Date.now();
    };

    const onOnline = async () => {
      // Clear offline marker
      offlineSinceRef.current = null;

      // If we recently saw an unauthorized while offline, re-check session state
      if (unauthorizedWhileOfflineRef.current) {
        unauthorizedWhileOfflineRef.current = false;
        try {
          window.location.href = '/sign-in';
        } catch (err) {
          console.error('Error verifying session on reconnect', err);
          // As a fallback, reload the page.
          window.location.reload();
        }
      }
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const value: AuthContextType = {
    isAuthenticated: jwt.hasToken,
    isLoading: isBooting,
    isSigningOut,
    user: jwt.user,
    signOut: handleSignOut,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
