// src/pages/SignInLanding.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/auth";
import { PATHS } from "@/routes/paths";
import AdminOtpForm from "@/components/auth/AdminOtpForm";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import {
  ACCESS_DENIED_FLAG,
  ACCESS_DENIED_MESSAGE,
} from "@/components/auth/accessDeniedFlag";

const SignInLanding: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ACCESS_DENIED_FLAG)) {
        sessionStorage.removeItem(ACCESS_DENIED_FLAG);
        setDeniedMessage(ACCESS_DENIED_MESSAGE);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  // Login only: the admin portal only ever issues a session for an existing
  // Mongo admin/superadmin (backend 401s unknown emails, 403s other roles).
  useEffect(() => {
    if (location.pathname !== PATHS.HOME) return;
    if (!isLoading && isAuthenticated) {
      navigate(PATHS.ADMIN.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="font-mono text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            FitMySkill Admin
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Sign in to the internal administration console.
          </p>
        </div>

        {deniedMessage && (
          <p role="alert" className="text-sm text-destructive">
            {deniedMessage}
          </p>
        )}

        <div id="admin-otp-form" className="bg-card border rounded-lg p-4 sm:p-6 text-left">
          <AdminOtpForm />
          <div className="mt-4">
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInLanding;
