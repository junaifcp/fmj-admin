// src/utils/authHelpers.ts

import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  ClerkUserMetadata,
} from "@/types/auth";

/**
 * Check if a user has a specific role
 */
export const hasRole = (
  userRole: UserRole | undefined,
  ...roles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return roles.includes(userRole);
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (
  userRole: UserRole | undefined,
  customPermissions: Permission[] | undefined,
  ...requiredPermissions: Permission[]
): boolean => {
  if (!userRole) return false;

  // Get role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

  // Combine with custom permissions
  const allPermissions = [...rolePermissions, ...(customPermissions || [])];

  // Check if user has all required permissions
  return requiredPermissions.every((perm) => allPermissions.includes(perm));
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (
  userRole: UserRole | undefined,
  customPermissions: Permission[] | undefined,
  ...requiredPermissions: Permission[]
): boolean => {
  if (!userRole) return false;

  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  const allPermissions = [...rolePermissions, ...(customPermissions || [])];

  return requiredPermissions.some((perm) => allPermissions.includes(perm));
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = (
  userRole: UserRole | undefined,
  customPermissions?: Permission[]
): Permission[] => {
  if (!userRole) return [];

  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return [...rolePermissions, ...(customPermissions || [])];
};

/**
 * Safely extract role from Clerk user metadata
 * Prioritizes publicMetadata (server-controlled) over unsafeMetadata
 */
export const extractRoleFromClerk = (
  publicMetadata: unknown,
  unsafeMetadata: unknown
): UserRole | undefined => {
  // Try public metadata first (server-controlled, more secure)
  const publicRole = (publicMetadata as ClerkUserMetadata)?.role;
  if (publicRole && Object.values(UserRole).includes(publicRole)) {
    return publicRole;
  }

  // Fallback to unsafe metadata (client can modify, less secure)
  const unsafeRole = (unsafeMetadata as ClerkUserMetadata)?.role;
  if (unsafeRole && Object.values(UserRole).includes(unsafeRole)) {
    return unsafeRole;
  }

  return undefined;
};

/**
 * Safely extract permissions from Clerk user metadata
 */
export const extractPermissionsFromClerk = (
  publicMetadata: unknown,
  unsafeMetadata: unknown
): Permission[] | undefined => {
  const publicPerms = (publicMetadata as ClerkUserMetadata)?.permissions;
  if (Array.isArray(publicPerms)) {
    return publicPerms.filter((p) => Object.values(Permission).includes(p));
  }

  const unsafePerms = (unsafeMetadata as ClerkUserMetadata)?.permissions;
  if (Array.isArray(unsafePerms)) {
    return unsafePerms.filter((p) => Object.values(Permission).includes(p));
  }

  return undefined;
};

/**
 * Check if a role is an admin role
 */
export const isAdminRole = (role: UserRole | undefined): boolean => {
  return hasRole(role, UserRole.ADMIN, UserRole.SUPERADMIN);
};

/**
 * Check if a role is a recruiter role
 */
export const isRecruiterRole = (role: UserRole | undefined): boolean => {
  return hasRole(role, UserRole.RECRUITER);
};

/**
 * Get user-friendly role name
 */
export const getRoleName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    [UserRole.USER]: "User",
    [UserRole.RECRUITER]: "Recruiter",
    [UserRole.ADMIN]: "Admin",
    [UserRole.SUPERADMIN]: "Super Admin",
  };
  return roleNames[role] || role;
};

/**
 * Validate role value
 */
export const isValidRole = (role: unknown): role is UserRole => {
  return (
    typeof role === "string" &&
    Object.values(UserRole).includes(role as UserRole)
  );
};
