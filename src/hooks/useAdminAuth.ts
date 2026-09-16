// ⚠️ DEPRECATED: Use useRoleAuth() or useImprovedAuth() instead
// This file is kept for backward compatibility only.
// See CLAUDE.md for current auth (useRoleAuth / ImprovedAuthContext).

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { getAdminMe } from "@/api/admin";
import { useAuthToken } from "@/utils/auth";
import { AdminAuthResponse } from "@/types/admin";

interface AdminAuthState {
  isAdmin: boolean;
  checking: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  error: string | null;
}

export const useAdminAuth = (): AdminAuthState => {
  const { isAuthenticated, isLoading: authLoading } = useAuthToken();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  // Fast-path: optimistically read from Clerk metadata
  const clerkRole =
    (clerkUser?.publicMetadata as any)?.role ??
    (clerkUser?.unsafeMetadata as any)?.role;
  const optimisticIsAdmin = ["admin", "superadmin"].includes(clerkRole);

  // Use clerk user id in the query key so cache is scoped per user.
  // This prevents leaking admin info across users in the same tab.
  const clerkUserId = clerkUser?.id ?? "anon";

  // Background verification with React Query
  const { data, error, isLoading } = useQuery<AdminAuthResponse, Error>({
    // include the user id in the key to scope cache
    queryKey: ["adminMe", clerkUserId],
    queryFn: async () => {
      // NOTE: getAdminMe currently doesn't accept a token in your codebase.
      // If you later switch to token-based admin API, include a token here.
      return await getAdminMe();
    },
    enabled: !authLoading && isAuthenticated && clerkLoaded && !!clerkUser,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Return state while Clerk or auth helper loading
  if (!clerkLoaded || authLoading) {
    return {
      isAdmin: false,
      checking: true,
      user: null,
      error: null,
    };
  }

  if (!isAuthenticated) {
    return {
      isAdmin: false,
      checking: false,
      user: null,
      error: "Not authenticated",
    };
  }

  // If backend data available, use it
  if (data) {
    const isAdminRole = ["admin", "superadmin"].includes(data.user.role);
    return {
      isAdmin: isAdminRole,
      checking: false,
      user: {
        id: data.user._id,
        email: data.user.email,
        role: data.user.role,
      },
      error: null,
    };
  }

  // If backend errored, fall back to optimistic clerk role but mark checking=false
  if (error) {
    return {
      isAdmin: optimisticIsAdmin,
      checking: false,
      user: null,
      error:
        error instanceof Error ? error.message : "Failed to check admin status",
    };
  }

  // While loading backend, use optimistic value but mark as checking
  return {
    isAdmin: optimisticIsAdmin,
    checking: isLoading,
    user: null,
    error: null,
  };
};
