// ⚠️ DEPRECATED: Use useRoleAuth() or useImprovedAuth() instead
// This file is kept for backward compatibility only (AdminLayout reads the
// /admin/me profile through it).

import { useQuery } from "@tanstack/react-query";
import { getAdminMe } from "@/api/admin";
import { useAuth as useJwtAuth } from "@/auth";
import { AdminAuthResponse } from "@/types/admin";

interface AdminAuthState {
  isAdmin: boolean;
  checking: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  error: string | null;
}

export const useAdminAuth = (): AdminAuthState => {
  const jwtAuth = useJwtAuth();

  // jwt-authentication phase 9.3: JWT only — verifies against /admin/me
  // scoped to the session user's Mongo _id. Admins are provisioned, never
  // self-registered, so a failure here is real (no "webhook pending").
  const { data, error, isLoading } = useQuery<AdminAuthResponse, Error>({
    queryKey: ["adminMe", jwtAuth.user?._id ?? "jwt"],
    queryFn: async () => {
      return await getAdminMe();
    },
    enabled: jwtAuth.isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (jwtAuth.isLoading) {
    return {
      isAdmin: false,
      checking: true,
      user: null,
      error: null,
    };
  }

  if (!jwtAuth.isAuthenticated) {
    return {
      isAdmin: false,
      checking: false,
      user: null,
      error: "Not authenticated",
    };
  }

  if (isLoading) {
    return {
      isAdmin: false,
      checking: true,
      user: null,
      error: null,
    };
  }

  if (error) {
    return {
      isAdmin: false,
      checking: false,
      user: null,
      error:
        error instanceof Error ? error.message : "Failed to check admin status",
    };
  }

  if (data) {
    const isAdminRole = ["admin", "superadmin"].includes(data.user.role);
    return {
      isAdmin: isAdminRole,
      checking: false,
      user: {
        id: data.user._id,
        email: data.user.email,
        role: data.user.role,
      },
      error: null,
    };
  }

  return {
    isAdmin: false,
    checking: false,
    user: null,
    error: "Unable to determine authentication status",
  };
};
