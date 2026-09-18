// src/components/auth/RoleGuard.tsx

import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { useAuth } from "@/auth";
import { UserRole, Permission } from "@/types/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";
import AccessDenied from "@/components/auth/AccessDenied";
import { PATHS } from "@/routes/paths";
import { ACCESS_DENIED_FLAG } from "./accessDeniedFlag";

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
   * Backend verification function (kept for call-site compatibility; the
   * role comes from /auth/me since jwt-authentication phase 9.3)
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
 * Route guard for this admin app. Defaults to admin/superadmin via useRoleAuth.
 * Guests are sent to sign-in; a JWT session with any other Mongo role is
 * signed out and bounced to sign-in with a generic message.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles = [UserRole.ADMIN, UserRole.SUPERADMIN],
  requiredPermissions,
  redirectTo = PATHS.SIGN_IN,
  loadingComponent,
  accessDeniedComponent,
  backendVerify,
  showAccessDenied = true,
}) => {
  const location = useLocation();
  const { hasRole, checking, user, error, isWrongJwtRole, isUnauthenticated } =
    useRoleAuth({
      requiredRoles,
      backendVerify,
    });
  const { signOut } = useAuth();

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

  // A JWT session whose Mongo role isn't allowed here: sign out and bounce
  // with a generic message — never render admin children, never leak the
  // real role, never redirect to another app.
  if (isWrongJwtRole) {
    try {
      sessionStorage.setItem(ACCESS_DENIED_FLAG, "1");
    } catch {
      /* ignore storage errors */
    }
    signOut().catch(() => {});
    return <Navigate to={redirectTo} replace />;
  }

  // No session at all — straight to sign-in.
  if (isUnauthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const hasAccess = hasRole && hasRequiredPermissions;

  if (!hasAccess) {
    if (showAccessDenied) {
      if (accessDeniedComponent) {
        return <>{accessDeniedComponent}</>;
      }

      return <AccessDenied message={error ?? undefined} />;
    }

    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

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
