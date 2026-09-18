// src/components/auth/SignInForm.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/auth";
import { PATHS } from "@/routes/paths";
import AdminOtpForm from "./AdminOtpForm";
import GoogleSignInButton from "./GoogleSignInButton";
import { ACCESS_DENIED_FLAG, ACCESS_DENIED_MESSAGE } from "./accessDeniedFlag";

const SignInForm: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
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
    if (!isLoading && isAuthenticated) {
      navigate(PATHS.ADMIN.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex justify-center mb-2">
            <div className="flex items-center">
              <span className="font-mono text-2xl font-bold text-primary mr-2">
                FitMySkill Admin
              </span>
            </div>
          </div>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Sign in to the internal administration console.
          </p>

          {deniedMessage && (
            <p role="alert" className="mb-4 text-center text-sm text-destructive">
              {deniedMessage}
            </p>
          )}

          <AdminOtpForm />

          <div className="mt-4">
            <GoogleSignInButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInForm;
