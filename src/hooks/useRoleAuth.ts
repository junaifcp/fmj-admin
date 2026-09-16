// src/hooks/useRoleAuth.ts

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { useAuthToken } from "@/utils/auth";
import {
  UserRole,
  Permission,
  AuthenticatedUser,
  RoleCheckResult,
} from "@/types/auth";
import {
  extractRoleFromClerk,
  extractPermissionsFromClerk,
  hasRole,
  getUserPermissions,
} from "@/utils/authHelpers";

interface RoleAuthOptions {
  /**
   * Roles to check against. If provided, `hasRole` will be true only if user has one of these roles.
   */
  requiredRoles?: UserRole[];

  /**
   * Backend verification function. Should return user data from your backend.
   * If not provided, only Clerk metadata will be used (less secure).
   */
  backendVerify?: () => Promise<{
    user: {
      _id: string;
      email: string;
      role: string;
      permissions?: Permission[];
    };
  }>;

  /**
   * Whether to enable backend verification.
   * Default: true (recommended for security)
   */
  enableBackendVerify?: boolean;

  /**
   * Cache time for backend verification (in milliseconds)
   * Default: 5 minutes
   */
  staleTime?: number;
}

/**
 * Unified authentication hook that works for any role.
 * Replaces useRecruiterAuth and useAdminAuth with a single, flexible hook.
 *
 * @example
 * // Check if user is a recruiter
 * const { hasRole, user } = useRoleAuth({
 *   requiredRoles: [UserRole.RECRUITER]
 * });
 *
 * @example
 * // Check if user is admin with backend verification
 * const { hasRole, user } = useRoleAuth({
 *   requiredRoles: [UserRole.ADMIN, UserRole.SUPERADMIN],
 *   backendVerify: getAdminMe
 * });
 */
export const useRoleAuth = (options: RoleAuthOptions = {}): RoleCheckResult => {
  const {
    requiredRoles,
    backendVerify,
    enableBackendVerify = true,
    staleTime = 5 * 60 * 1000,
  } = options;

  const { isAuthenticated, isLoading: authLoading } = useAuthToken();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  // Extract role and permissions from Clerk metadata (optimistic)
  const clerkRole = extractRoleFromClerk(
    clerkUser?.publicMetadata,
    clerkUser?.unsafeMetadata
  );
  const clerkPermissions = extractPermissionsFromClerk(
    clerkUser?.publicMetadata,
    clerkUser?.unsafeMetadata
  );

  // Check if optimistic role matches required roles
  const optimisticHasRole = requiredRoles
    ? hasRole(clerkRole, ...requiredRoles)
    : true;

  // Scope query cache to user ID to prevent cross-user data leakage
  const clerkUserId = clerkUser?.id ?? "anon";

  // Backend verification query (if enabled and function provided)
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["userAuth", clerkUserId, requiredRoles?.join(",")],
    queryFn: async () => {
      if (!backendVerify) {
        // No backend verify function, return null
        return null;
      }
      return await backendVerify();
    },
    enabled:
      !authLoading && // Wait for auth loading to complete
      isAuthenticated &&
      clerkLoaded &&
      !!clerkUser &&
      enableBackendVerify &&
      !!backendVerify,
    retry: 3, // Retry 3 times for new users whose webhook might be pending
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff: 1s, 2s, 4s
    refetchInterval: (query) => {
      // If backend verification failed (likely pending user), poll every 3 seconds
      // This will automatically refetch when webhook completes
      const hasError = query.state.error;
      return hasError ? 3000 : false; // Poll every 3s if error, otherwise no polling
    },
    staleTime,
    gcTime: staleTime * 2,
  });

  // Return loading state while Clerk or auth is loading
  if (!clerkLoaded || authLoading) {
    return {
      hasRole: false,
      checking: true,
      user: null,
      error: null,
    };
  }

  // Return not authenticated state
  if (!isAuthenticated) {
    return {
      hasRole: false,
      checking: false,
      user: null,
      error: "Not authenticated",
    };
  }

  // If backend verification is enabled and we have data
  if (enableBackendVerify && backendVerify && data && data.user) {
    const backendRole = data.user.role as UserRole;
    const backendPermissions = data.user.permissions || [];
    const allPermissions = getUserPermissions(backendRole, backendPermissions);

    const backendHasRole = requiredRoles
      ? hasRole(backendRole, ...requiredRoles)
      : true;

    const authenticatedUser: AuthenticatedUser = {
      id: data.user._id,
      email: data.user.email,
      role: backendRole,
      permissions: allPermissions,
      clerkUserId: clerkUser?.id || "",
    };

    return {
      hasRole: backendHasRole,
      checking: false,
      user: authenticatedUser,
      error: null,
    };
  }

  // If backend verification returned data but with unexpected structure
  if (enableBackendVerify && backendVerify && data && !data.user) {
    console.warn(
      "Backend auth verification returned unexpected data structure:",
      data
    );

    // Fall back to optimistic Clerk role but indicate the error
    return {
      hasRole: optimisticHasRole,
      checking: false,
      user: clerkRole
        ? {
            id: clerkUser?.id || "",
            email: clerkUser?.primaryEmailAddress?.emailAddress || "",
            role: clerkRole,
            permissions: getUserPermissions(clerkRole, clerkPermissions),
            clerkUserId: clerkUser?.id || "",
          }
        : null,
      error: "Backend returned unexpected data format",
    };
  }

  // If backend verification failed but we have Clerk data
  if (enableBackendVerify && backendVerify && error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStatus = (error as any)?.status;

    // Check if error is "user not found" (404) - indicates pending webhook/backend sync
    const isUserNotFoundError =
      errorStatus === 404 ||
      errorMessage.toLowerCase().includes("not found") ||
      errorMessage.toLowerCase().includes("404") ||
      errorMessage.toLowerCase().includes("user does not exist") ||
      errorMessage.toLowerCase().includes("recruiter not found") ||
      errorMessage.toLowerCase().includes("no recruiter found");

    console.log("🔍 Backend auth verification failed:", {
      errorMessage,
      errorStatus,
      isPendingSync: isUserNotFoundError,
      clerkRole,
      optimisticHasRole,
      hasClerkUser: !!clerkUser,
      clerkUserId: clerkUser?.id,
    });

    // If user is authenticated in Clerk but not found in backend (webhook pending),
    // allow optimistic access if Clerk metadata has the required role
    if (isUserNotFoundError) {
      console.log(
        "✅ User not found in backend (webhook pending), checking Clerk role..."
      );

      // If we have Clerk role and it matches requirements, allow access
      if (clerkRole && optimisticHasRole) {
        console.log(
          "✅ Allowing optimistic access - Clerk role matches requirements"
        );
        return {
          hasRole: true, // Allow access optimistically
          checking: false,
          user: {
            id: clerkUser?.id || "",
            email: clerkUser?.primaryEmailAddress?.emailAddress || "",
            role: clerkRole,
            permissions: getUserPermissions(clerkRole, clerkPermissions),
            clerkUserId: clerkUser?.id || "",
          },
          error: null, // Clear error since we're allowing optimistic access
          isPendingBackendSync: true, // Flag for UI to show "setting up account"
        };
      }

      // If no required roles specified, allow optimistic access anyway (user is authenticated in Clerk)
      if (!requiredRoles || requiredRoles.length === 0) {
        console.log(
          "✅ Allowing optimistic access - no specific role required"
        );
        return {
          hasRole: true,
          checking: false,
          user: clerkRole
            ? {
                id: clerkUser?.id || "",
                email: clerkUser?.primaryEmailAddress?.emailAddress || "",
                role: clerkRole,
                permissions: getUserPermissions(clerkRole, clerkPermissions),
                clerkUserId: clerkUser?.id || "",
              }
            : null,
          error: null,
          isPendingBackendSync: true,
        };
      }

      // User not found AND Clerk role doesn't match or is missing
      console.warn(
        "⚠️ User not found in backend and Clerk role doesn't match requirements"
      );
    }

    // For other errors (network, permission issues, etc.), fall back but show error
    return {
      hasRole: optimisticHasRole,
      checking: false,
      user: clerkRole
        ? {
            id: clerkUser?.id || "",
            email: clerkUser?.primaryEmailAddress?.emailAddress || "",
            role: clerkRole,
            permissions: getUserPermissions(clerkRole, clerkPermissions),
            clerkUserId: clerkUser?.id || "",
          }
        : null,
      error: errorMessage,
      isPendingBackendSync: false,
    };
  }

  // While backend verification is loading
  if (enableBackendVerify && backendVerify && isLoading) {
    // If optimistic role matches, render optimistically
    if (optimisticHasRole) {
      return {
        hasRole: true,
        checking: true,
        user: clerkRole
          ? {
              id: clerkUser?.id || "",
              email: clerkUser?.primaryEmailAddress?.emailAddress || "",
              role: clerkRole,
              permissions: getUserPermissions(clerkRole, clerkPermissions),
              clerkUserId: clerkUser?.id || "",
            }
          : null,
        error: null,
      };
    }

    // Otherwise, show loading state
    return {
      hasRole: false,
      checking: true,
      user: null,
      error: null,
    };
  }

  // No backend verification - use Clerk metadata only (less secure)
  if (!enableBackendVerify || !backendVerify) {
    console.warn(
      "Using Clerk metadata for auth without backend verification. This is less secure."
    );

    return {
      hasRole: optimisticHasRole,
      checking: false,
      user: clerkRole
        ? {
            id: clerkUser?.id || "",
            email: clerkUser?.primaryEmailAddress?.emailAddress || "",
            role: clerkRole,
            permissions: getUserPermissions(clerkRole, clerkPermissions),
            clerkUserId: clerkUser?.id || "",
          }
        : null,
      error: clerkRole ? null : "No role found in user metadata",
    };
  }

  // Default fallback
  return {
    hasRole: false,
    checking: false,
    user: null,
    error: "Unable to determine authentication status",
  };
};

/**
 * Hook specifically for recruiter authentication (convenience wrapper)
 */
export const useRecruiterRoleAuth = () => {
  return useRoleAuth({
    requiredRoles: [UserRole.RECRUITER],
    // You can add backend verification here if needed:
    // backendVerify: getRecruiterMe,
  });
};

/**
 * Hook specifically for admin authentication (convenience wrapper)
 */
export const useAdminRoleAuth = () => {
  return useRoleAuth({
    requiredRoles: [UserRole.ADMIN, UserRole.SUPERADMIN],
    // You can add backend verification here if needed:
    // backendVerify: getAdminMe,
  });
};
