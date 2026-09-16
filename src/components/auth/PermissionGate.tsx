// src/components/auth/PermissionGate.tsx

import React, { ReactNode } from "react";
import { useImprovedAuth } from "@/context/ImprovedAuthContext";
import { UserRole, Permission } from "@/types/auth";

interface PermissionGateProps {
  children: ReactNode;

  /**
   * Required roles. User must have at least one.
   */
  roles?: UserRole[];

  /**
   * Required permissions. User must have all.
   */
  permissions?: Permission[];

  /**
   * Required permissions (any). User must have at least one.
   */
  anyPermissions?: Permission[];

  /**
   * Content to show when user doesn't have permission.
   * Default: null (nothing rendered)
   */
  fallback?: ReactNode;

  /**
   * Whether to render children while loading.
   * Default: false
   */
  renderWhileLoading?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions.
 * Useful for hiding/showing UI elements based on permissions.
 *
 * @example
 * // Show only for recruiters
 * <PermissionGate roles={[UserRole.RECRUITER]}>
 *   <PostJobButton />
 * </PermissionGate>
 *
 * @example
 * // Show only if user can manage users
 * <PermissionGate permissions={[Permission.MANAGE_USERS]}>
 *   <UserManagementPanel />
 * </PermissionGate>
 *
 * @example
 * // Show with fallback
 * <PermissionGate
 *   permissions={[Permission.POST_JOB]}
 *   fallback={<UpgradePrompt />}
 * >
 *   <CreateJobForm />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  roles,
  permissions,
  anyPermissions,
  fallback = null,
  renderWhileLoading = false,
}) => {
  const auth = useImprovedAuth();

  // Show loading state if configured
  if (auth.isLoading && !renderWhileLoading) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (roles && roles.length > 0) {
    if (!auth.hasRole(...roles)) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirement (all required)
  if (permissions && permissions.length > 0) {
    if (!auth.hasPermission(...permissions)) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirement (any required)
  if (anyPermissions && anyPermissions.length > 0) {
    if (!auth.hasAnyPermission(...anyPermissions)) {
      return <>{fallback}</>;
    }
  }

  // User has required permissions
  return <>{children}</>;
};

/**
 * Hook for checking permissions in functional components.
 *
 * @example
 * const canPostJob = usePermission(Permission.POST_JOB);
 * const isAdmin = useRole(UserRole.ADMIN, UserRole.SUPERADMIN);
 */
export const usePermission = (...permissions: Permission[]): boolean => {
  const { hasPermission } = useImprovedAuth();
  return hasPermission(...permissions);
};

/**
 * Hook for checking roles in functional components.
 */
export const useRole = (...roles: UserRole[]): boolean => {
  const { hasRole } = useImprovedAuth();
  return hasRole(...roles);
};

/**
 * Hook for checking if user has any of the specified permissions.
 */
export const useAnyPermission = (...permissions: Permission[]): boolean => {
  const { hasAnyPermission } = useImprovedAuth();
  return hasAnyPermission(...permissions);
};

export default PermissionGate;
