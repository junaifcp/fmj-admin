// src/components/auth/RoleGuard.tsx

import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { UserRole, Permission } from "@/types/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
  children: ReactNode;

  /**
   * Required roles. User must have at least one of these roles.
   */
  requiredRoles?: UserRole[];

  /**
   * Required permissions. User must have all of these permissions.
   */
  requiredPermissions?: Permission[];

  /**
   * Where to redirect if user doesn't have access
   * Default: "/sign-in"
   */
  redirectTo?: string;

  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;

  /**
   * Custom access denied component
   */
  accessDeniedComponent?: ReactNode;

  /**
   * Backend verification function
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
   * Whether to show access denied message or redirect immediately
   * Default: true (show message)
   */
  showAccessDenied?: boolean;
}

/**
 * Unified route guard component that replaces RecruiterRoute and AdminRoute.
 *
 * @example
 * // Protect route for recruiters only
 * <RoleGuard requiredRoles={[UserRole.RECRUITER]}>
 *   <RecruiterDashboard />
 * </RoleGuard>
 *
 * @example
 * // Protect route for admins only
 * <RoleGuard
 *   requiredRoles={[UserRole.ADMIN, UserRole.SUPERADMIN]}
 *   backendVerify={getAdminMe}
 * >
 *   <AdminPanel />
 * </RoleGuard>
 *
 * @example
 * // Protect route with permission check
 * <RoleGuard requiredPermissions={[Permission.MANAGE_USERS]}>
 *   <UserManagement />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles,
  requiredPermissions,
  redirectTo = "/sign-in",
  loadingComponent,
  accessDeniedComponent,
  backendVerify,
  showAccessDenied = true,
}) => {
  const location = useLocation();
  const { hasRole, checking, user, error, isPendingBackendSync } = useRoleAuth({
    requiredRoles,
    backendVerify,
  });

  // Check permissions if required
  const hasRequiredPermissions = React.useMemo(() => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    if (!user) return false;

    return requiredPermissions.every((perm) => user.permissions.includes(perm));
  }, [user, requiredPermissions]);

  // Show loading state
  if (checking) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center max-w-md">
          <Shield className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has access
  const hasAccess = hasRole && hasRequiredPermissions;

  // If user doesn't have access (but allow pending users to pass through)
  if ((!hasAccess || error) && !isPendingBackendSync) {
    if (showAccessDenied) {
      if (accessDeniedComponent) {
        return <>{accessDeniedComponent}</>;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="mt-2 text-lg font-semibold">
                Access Denied
              </AlertTitle>
              <AlertDescription className="mt-3 space-y-2">
                <p>
                  You don't have permission to access this page.
                  {requiredRoles && requiredRoles.length > 0 && (
                    <span className="block mt-1 text-sm">
                      Required role:{" "}
                      {requiredRoles.map((r) => r.toUpperCase()).join(" or ")}
                    </span>
                  )}
                </p>
                {error && (
                  <p className="text-sm mt-2 p-2 bg-destructive/10 rounded">
                    {error}
                  </p>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      );
    }

    // Redirect immediately without showing message
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User has access - render children
  // Show notification if user is pending backend sync
  if (isPendingBackendSync) {
    return (
      <>
        <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Setting up your account...
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Your account is being created. This usually takes a few
                  seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
};

// Convenience exports for common use cases
export const RecruiterGuard: React.FC<{
  children: ReactNode;
  backendVerify?: RoleGuardProps["backendVerify"];
}> = ({ children, backendVerify }) => (
  <RoleGuard requiredRoles={[UserRole.RECRUITER]} backendVerify={backendVerify}>
    {children}
  </RoleGuard>
);

export const AdminGuard: React.FC<{
  children: ReactNode;
  backendVerify?: RoleGuardProps["backendVerify"];
}> = ({ children, backendVerify }) => (
  <RoleGuard
    requiredRoles={[UserRole.ADMIN, UserRole.SUPERADMIN]}
    backendVerify={backendVerify}
  >
    {children}
  </RoleGuard>
);

export default RoleGuard;
