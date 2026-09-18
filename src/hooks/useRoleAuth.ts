// src/hooks/useRoleAuth.ts

import { useAuth as useJwtAuth, getAccessToken } from "@/auth";
import {
  UserRole,
  Permission,
  AuthenticatedUser,
  RoleCheckResult,
} from "@/types/auth";
import { hasRole, getUserPermissions } from "@/utils/authHelpers";
import { getAdminMe } from "@/api/admin";

interface RoleAuthOptions {
  /**
   * Roles to check against. If provided, `hasRole` will be true only if user has one of these roles.
   */
  requiredRoles?: UserRole[];

  /**
   * Kept for call-site compatibility; unused since jwt-authentication phase
   * 9.3 (the role comes straight from /auth/me via AuthProvider).
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
   * Kept for call-site compatibility; unused since 9.3.
   */
  enableBackendVerify?: boolean;

  /**
   * Kept for call-site compatibility; unused since 9.3.
   */
  staleTime?: number;
}

/**
 * Authentication hook for this admin app. Defaults to requiring admin or
 * superadmin. JWT only: the Mongo role from /auth/me is the source of truth.
 */
export const useRoleAuth = (options: RoleAuthOptions = {}): RoleCheckResult => {
  const { requiredRoles = [UserRole.ADMIN, UserRole.SUPERADMIN] } = options;

  const jwtAuth = useJwtAuth();
  const jwtToken = getAccessToken();

  if (jwtAuth.isLoading) {
    return {
      hasRole: false,
      checking: true,
      user: null,
      error: null,
    };
  }

  if (!jwtToken || !jwtAuth.isAuthenticated) {
    return {
      hasRole: false,
      checking: false,
      user: null,
      error: "Not authenticated",
      isUnauthenticated: true,
    };
  }

  if (!jwtAuth.user) {
    // AuthProvider always sets hasToken and user together, so this is
    // defense-in-depth rather than a state this app actually reaches today.
    return {
      hasRole: false,
      checking: true,
      user: null,
      error: null,
    };
  }

  const jwtRole = jwtAuth.user.role as UserRole;
  const jwtRoleOk = requiredRoles ? hasRole(jwtRole, ...requiredRoles) : true;

  if (!jwtRoleOk) {
    // Admins are provisioned, never self-registered — a role mismatch here
    // is a stale/copied/wrong-portal session, never a sync race, so the
    // guard signs out and bounces with a generic message.
    return {
      hasRole: false,
      checking: false,
      user: null,
      error: null,
      isWrongJwtRole: true,
    };
  }

  const jwtAuthenticatedUser: AuthenticatedUser = {
    id: jwtAuth.user._id,
    email: jwtAuth.user.email,
    role: jwtRole,
    permissions: getUserPermissions(jwtRole),
  };

  return {
    hasRole: true,
    checking: false,
    user: jwtAuthenticatedUser,
    error: null,
  };
};

/**
 * Admin authentication (convenience wrapper).
 */
export const useAdminRoleAuth = () => {
  return useRoleAuth({
    requiredRoles: [UserRole.ADMIN, UserRole.SUPERADMIN],
    backendVerify: getAdminMe,
  });
};
