// ⚠️ DEPRECATED: Use useRoleAuth() or useImprovedAuth() instead
// This file is kept for backward compatibility only.
// See CLAUDE.md for current auth (useRoleAuth / ImprovedAuthContext).

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { getRecruiterMe } from "@/api/recruiter";
import { useAuthToken } from "@/utils/auth";
import type { RecruiterUser } from "@/types/recruiter";

interface RecruiterAuthState {
  isRecruiter: boolean;
  checking: boolean;
  user: RecruiterUser | null;
  error: string | null;
}

export const useRecruiterAuth = (): RecruiterAuthState => {
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAuthToken,
  } = useAuthToken();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  // Fast-path: optimistically read from Clerk metadata
  const clerkRole =
    (clerkUser?.publicMetadata as any)?.role ??
    (clerkUser?.unsafeMetadata as any)?.role;
  const optimisticIsRecruiter = clerkRole === "recruiter";

  // Scope the query cache to the clerk user id to avoid cross-user leakage
  const clerkUserId = clerkUser?.id ?? "anon";

  // Background verification with React Query
  const { data, error, isLoading } = useQuery({
    queryKey: ["recruiterMe", clerkUserId],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) {
        // throw so react-query marks it as an error if enabled was wrongly set
        throw new Error("No authentication token available");
      }
      // Token is now handled by axios interceptor
      return await getRecruiterMe();
    },
    enabled: isAuthenticated && clerkLoaded && !!clerkUser,
    retry: 3, // Retry 3 times for new users whose webhook might be pending
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    refetchInterval: (query) => {
      // If backend verification failed (likely pending user), poll every 3 seconds
      const hasError = query.state.error;
      return hasError ? 3000 : false;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Return state while Clerk or auth helper loading
  if (!clerkLoaded || authLoading) {
    return {
      isRecruiter: false,
      checking: true,
      user: null,
      error: null,
    };
  }

  if (!isAuthenticated) {
    return {
      isRecruiter: false,
      checking: false,
      user: null,
      error: "Not authenticated",
    };
  }

  // If backend data available, use it
  if (data) {
    return {
      isRecruiter: data.user.role === "recruiter",
      checking: false,
      user: data.user,
      error: null,
    };
  }

  // If backend errored, use optimistic value but mark as not checking
  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to check recruiter status";
    const errorStatus = (error as any)?.status;

    // Check if error is "user not found" (404) - indicates pending webhook/backend sync
    const isUserNotFoundError =
      errorStatus === 404 ||
      errorMessage.toLowerCase().includes("not found") ||
      errorMessage.toLowerCase().includes("404") ||
      errorMessage.toLowerCase().includes("user does not exist") ||
      errorMessage.toLowerCase().includes("recruiter not found");

    console.log("🔍 useRecruiterAuth - Backend error:", {
      errorMessage,
      errorStatus,
      isUserNotFoundError,
      optimisticIsRecruiter,
    });

    // If user not found and Clerk says they're a recruiter, treat as pending
    if (isUserNotFoundError && optimisticIsRecruiter) {
      console.log(
        "✅ useRecruiterAuth - Allowing optimistic recruiter access (webhook pending)"
      );
      return {
        isRecruiter: true, // Allow optimistic access
        checking: false,
        user: null,
        error: null, // Clear error for pending users
      };
    }

    return {
      isRecruiter: optimisticIsRecruiter,
      checking: false,
      user: null,
      error: errorMessage,
    };
  }

  // While loading backend, use optimistic value but mark as checking
  return {
    isRecruiter: optimisticIsRecruiter,
    checking: isLoading,
    user: null,
    error: null,
  };
};
