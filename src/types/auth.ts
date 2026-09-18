// src/types/auth.ts

/**
 * Centralized authentication and authorization types
 */

// User roles that may sign in to this admin app
export enum UserRole {
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
}

// Permissions that can be granted to admin users
export enum Permission {
  MANAGE_USERS = "manage_users",
  MANAGE_RECRUITERS = "manage_recruiters",
  MANAGE_PLANS = "manage_plans",
  VIEW_ANALYTICS = "view_analytics",
  MANAGE_SYSTEM = "manage_system",
}

// Role-to-permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_RECRUITERS,
    Permission.MANAGE_PLANS,
    Permission.VIEW_ANALYTICS,
  ],

  [UserRole.SUPERADMIN]: Object.values(Permission),
};

// Authenticated user structure
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  organizationId?: string;
}

// Auth state
export interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Role check result
export interface RoleCheckResult {
  hasRole: boolean;
  checking: boolean;
  user: AuthenticatedUser | null;
  error: string | null;
  /**
   * A JWT session whose Mongo role isn't admin/superadmin — a stale/copied/
   * wrong-portal session, never a sync race. The guard signs out and bounces
   * with a generic message, never revealing the real role.
   */
  isWrongJwtRole?: boolean;
  /**
   * No session at all. The guard redirects straight to sign-in instead of
   * showing an "Access Denied" card.
   */
  isUnauthenticated?: boolean;
}
