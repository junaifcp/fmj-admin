// src/context/ImprovedAuthContext.tsx

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserRole,
  Permission,
  AuthenticatedUser,
  AuthState,
} from "@/types/auth";
import {
  getUserPermissions,
  hasRole as checkRole,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
} from "@/utils/authHelpers";
import { clearTokenCache } from "@/utils/auth";
import { useAuth as useJwtAuth } from "@/auth";

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
  const jwtAuth = useJwtAuth();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  // JWT (/auth/me) is the only identity source.
  const role = jwtAuth.user?.role as UserRole | undefined;
  const permissions = getUserPermissions(role);

  const authenticatedUser: AuthenticatedUser | null = useMemo(() => {
    if (!jwtAuth.user || !role) return null;

    return {
      id: jwtAuth.user._id,
      email: jwtAuth.user.email,
      role,
      permissions: getUserPermissions(role),
    };
  }, [jwtAuth.user, role]);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true);

      // Cancel all pending queries
      await queryClient.cancelQueries();

      await jwtAuth.signOut();

      // Clear all caches
      localStorage.clear();
      sessionStorage.clear();
      queryClient.clear();
      clearTokenCache();
    } catch (err) {
      console.error("Error signing out:", err);
      setIsSigningOut(false);
    }
  }, [queryClient, jwtAuth]);

  // Permission checking functions
  const hasRoleFunc = useCallback(
    (...roles: UserRole[]) => {
      return checkRole(role, ...roles);
    },
    [role]
  );

  const hasPermissionFunc = useCallback(
    (...requiredPermissions: Permission[]) => {
      return checkPermission(role, undefined, ...requiredPermissions);
    },
    [role]
  );

  const hasAnyPermissionFunc = useCallback(
    (...requiredPermissions: Permission[]) => {
      return checkAnyPermission(role, undefined, ...requiredPermissions);
    },
    [role]
  );

  // Build context value with error handling
  const value = useMemo<ImprovedAuthContextType>(() => {
    try {
      return {
        user: authenticatedUser,
        isAuthenticated: jwtAuth.isAuthenticated,
        isLoading: jwtAuth.isLoading,
        error:
          jwtAuth.isAuthenticated && !role ? "No role assigned to user" : null,
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
        isLoading: jwtAuth.isLoading,
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
    role,
    jwtAuth.isAuthenticated,
    jwtAuth.isLoading,
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
