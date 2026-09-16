// AuthContext.tsx
// ⚠️ DEPRECATED: Use ImprovedAuthContext.tsx instead
// This file is kept for backward compatibility only.
// See CLAUDE.md for current auth (ImprovedAuthContext).

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSigningOut: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  // Deprecation warning
  if (import.meta.env.DEV) {
    console.warn(
      "⚠️ DEPRECATED: useAuth() from AuthContext is deprecated. " +
        "Please use useImprovedAuth() from ImprovedAuthContext instead. " +
        "See CLAUDE.md for current auth (ImprovedAuthContext)."
    );
  }

  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { signOut: clerkSignOut } = useClerk();
  const { isLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true);
      await queryClient.cancelQueries();
      localStorage.removeItem("has-uploaded-resume");
      queryClient.clear();
      await clerkSignOut({ redirectUrl: "/" });
    } catch (err) {
      console.error("Error signing out", err);
      setIsSigningOut(false);
    }
  }, [queryClient, clerkSignOut]);

  const value = useMemo(
    () => ({
      isAuthenticated: !!isSignedIn,
      isLoading: !isLoaded,
      isSigningOut,
      signOut: handleSignOut,
    }),
    [isSignedIn, isLoaded, isSigningOut, handleSignOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
