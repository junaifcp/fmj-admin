// src/utils/authHelpers.ts

import { UserRole, Permission, ROLE_PERMISSIONS } from "@/types/auth";

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
 * Validate role value
 */
export const isValidRole = (role: unknown): role is UserRole => {
  return (
    typeof role === "string" &&
    Object.values(UserRole).includes(role as UserRole)
  );
};
