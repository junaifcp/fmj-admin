// src/types/auth.ts

/**
 * Centralized authentication and authorization types
 */

// User roles in the system
export enum UserRole {
  USER = "user",
  RECRUITER = "recruiter",
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
}

// Permissions that can be granted to users
export enum Permission {
  // User permissions
  VIEW_PROFILE = "view_profile",
  EDIT_PROFILE = "edit_profile",

  // Recruiter permissions
  POST_JOB = "post_job",
  VIEW_JOBS = "view_jobs",
  EDIT_JOB = "edit_job",
  DELETE_JOB = "delete_job",
  VIEW_APPLICATIONS = "view_applications",
  VIEW_CANDIDATES = "view_candidates",
  MANAGE_COMPANY = "manage_company",

  // Admin permissions
  MANAGE_USERS = "manage_users",
  MANAGE_RECRUITERS = "manage_recruiters",
  MANAGE_PLANS = "manage_plans",
  VIEW_ANALYTICS = "view_analytics",
  MANAGE_SYSTEM = "manage_system",
}

// Role-to-permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [Permission.VIEW_PROFILE, Permission.EDIT_PROFILE],

  [UserRole.RECRUITER]: [
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.POST_JOB,
    Permission.VIEW_JOBS,
    Permission.EDIT_JOB,
    Permission.DELETE_JOB,
    Permission.VIEW_APPLICATIONS,
    Permission.VIEW_CANDIDATES,
    Permission.MANAGE_COMPANY,
  ],

  [UserRole.ADMIN]: [
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.MANAGE_USERS,
    Permission.MANAGE_RECRUITERS,
    Permission.MANAGE_PLANS,
    Permission.VIEW_ANALYTICS,
  ],

  [UserRole.SUPERADMIN]: [
    // Superadmin has all permissions
    ...Object.values(Permission),
  ],
};

// Clerk user metadata structure (type-safe)
export interface ClerkUserMetadata {
  role?: UserRole;
  permissions?: Permission[];
  organizationId?: string;
  customClaims?: Record<string, unknown>;
}

// Authenticated user structure
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  clerkUserId: string;
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
   * Indicates if user is authenticated in Clerk but backend hasn't synced yet
   * (e.g., webhook pending for new signups)
   */
  isPendingBackendSync?: boolean;
}
