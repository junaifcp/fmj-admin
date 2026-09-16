// ⚠️ DEPRECATED: Use RoleGuard from @/components/auth/RoleGuard instead
// This file is kept for backward compatibility only.
// See CLAUDE.md for current auth (RoleGuard).

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRecruiterAuth } from "@/hooks/useRecruiterAuth";
import { useUser } from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecruiterRouteProps {
  children: React.ReactNode;
}

const RecruiterRoute: React.FC<RecruiterRouteProps> = ({ children }) => {
  const { isRecruiter, checking, error } = useRecruiterAuth();
  const { isLoaded, user } = useUser();
  const location = useLocation();

  // If Clerk hasn't loaded yet, show loader
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // While backend verification is in progress, avoid redirecting.
  // If Clerk metadata already says recruiter, we can optimistically render children,
  // otherwise show skeleton until backend check finishes.
  const publicRole = (user?.publicMetadata as any)?.role as string | undefined;
  const unsafeRole = (user?.unsafeMetadata as any)?.role as string | undefined;
  const clerkRole = publicRole ?? unsafeRole ?? undefined;

  if (checking) {
    if (clerkRole === "recruiter") {
      // optimistic render while backend confirms
      return <>{children}</>;
    }
    // otherwise wait
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Now backend check finished — if not a recruiter, redirect to sign-in
  if (!isRecruiter) {
    console.warn(
      "Recruiter guard: not a recruiter or verification failed",
      error
    );
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // All good
  return <>{children}</>;
};

export default RecruiterRoute;
