// src/context/ImprovedAuthContext.tsx

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserRole,
  Permission,
  AuthenticatedUser,
  AuthState,
} from "@/types/auth";
import {
  extractRoleFromClerk,
  extractPermissionsFromClerk,
  getUserPermissions,
  hasRole as checkRole,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
} from "@/utils/authHelpers";
import { clearTokenCache } from "@/utils/auth";

interface ImprovedAuthContextType extends AuthState {
  /**
   * Sign out the user and clear all cached data
   */
  signOut: () => Promise<void>;

  /**
   * Check if user has a specific role
   */
  hasRole: (...roles: UserRole[]) => boolean;

  /**
   * Check if user has specific permissions (all required)
   */
  hasPermission: (...permissions: Permission[]) => boolean;

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission: (...permissions: Permission[]) => boolean;

  /**
   * Get all permissions for the current user
   */
  permissions: Permission[];

  /**
   * Current user's role
   */
  role: UserRole | null;

  /**
   * Whether sign out is in progress
   */
  isSigningOut: boolean;
}

const ImprovedAuthContext = createContext<ImprovedAuthContextType | undefined>(
  undefined
);

export const useImprovedAuth = () => {
  const ctx = useContext(ImprovedAuthContext);
  if (!ctx) {
    throw new Error("useImprovedAuth must be used within ImprovedAuthProvider");
  }
  return ctx;
};

interface ImprovedAuthProviderProps {
  children: ReactNode;
}

export const ImprovedAuthProvider: React.FC<ImprovedAuthProviderProps> = ({
  children,
}) => {
  const { signOut: clerkSignOut } = useClerk();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  // Extract role and permissions from Clerk (with safety checks)
  const role = React.useMemo(() => {
    if (!clerkUser) return undefined;
    return extractRoleFromClerk(
      clerkUser.publicMetadata,
      clerkUser.unsafeMetadata
    );
  }, [clerkUser]);

  const customPermissions = React.useMemo(() => {
    if (!clerkUser) return undefined;
    return extractPermissionsFromClerk(
      clerkUser.publicMetadata,
      clerkUser.unsafeMetadata
    );
  }, [clerkUser]);

  const permissions = getUserPermissions(role, customPermissions);

  // Build authenticated user object
  const authenticatedUser: AuthenticatedUser | null = useMemo(() => {
    if (!isSignedIn || !clerkUser || !role) return null;

    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      role,
      permissions,
      clerkUserId: clerkUser.id,
    };
  }, [isSignedIn, clerkUser, role, permissions]);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true);

      // Cancel all pending queries
      await queryClient.cancelQueries();

      // Clear all caches
      localStorage.clear();
      sessionStorage.clear();
      queryClient.clear();

      // Clear token cache
      clearTokenCache();

      // Sign out from Clerk
      await clerkSignOut({ redirectUrl: "/" });
    } catch (err) {
      console.error("Error signing out:", err);
      setIsSigningOut(false);
    }
  }, [queryClient, clerkSignOut]);

  // Permission checking functions
  const hasRoleFunc = useCallback(
    (...roles: UserRole[]) => {
      return checkRole(role, ...roles);
    },
    [role]
  );

  const hasPermissionFunc = useCallback(
    (...requiredPermissions: Permission[]) => {
      return checkPermission(role, customPermissions, ...requiredPermissions);
    },
    [role, customPermissions]
  );

  const hasAnyPermissionFunc = useCallback(
    (...requiredPermissions: Permission[]) => {
      return checkAnyPermission(
        role,
        customPermissions,
        ...requiredPermissions
      );
    },
    [role, customPermissions]
  );

  // Build context value with error handling
  const value = useMemo<ImprovedAuthContextType>(() => {
    try {
      return {
        user: authenticatedUser,
        isAuthenticated: !!isSignedIn && !!role,
        isLoading: !isLoaded,
        error: isSignedIn && !role ? "No role assigned to user" : null,
        signOut: handleSignOut,
        hasRole: hasRoleFunc,
        hasPermission: hasPermissionFunc,
        hasAnyPermission: hasAnyPermissionFunc,
        permissions,
        role: role || null,
        isSigningOut,
      };
    } catch (error) {
      console.error("Error building auth context:", error);
      // Return safe default values
      return {
        user: null,
        isAuthenticated: false,
        isLoading: !isLoaded,
        error: error instanceof Error ? error.message : "Auth context error",
        signOut: handleSignOut,
        hasRole: () => false,
        hasPermission: () => false,
        hasAnyPermission: () => false,
        permissions: [],
        role: null,
        isSigningOut,
      };
    }
  }, [
    authenticatedUser,
    isSignedIn,
    role,
    isLoaded,
    handleSignOut,
    hasRoleFunc,
    hasPermissionFunc,
    hasAnyPermissionFunc,
    permissions,
    isSigningOut,
  ]);

  return (
    <ImprovedAuthContext.Provider value={value}>
      {children}
    </ImprovedAuthContext.Provider>
  );
};
