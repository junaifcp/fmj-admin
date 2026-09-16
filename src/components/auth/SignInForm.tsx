// src/components/auth/SignInForm.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, useUser } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRecruiterAuth } from "@/hooks/useRecruiterAuth";

const SignInForm: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, user, isLoaded } = useUser();
  const { isRecruiter, checking } = useRecruiterAuth();

  // Handle redirect after successful sign in
  useEffect(() => {
    // wait until both clerk user and recruiter-check are ready
    if (!isLoaded || checking) return;
    if (!isSignedIn) return;

    // Prefer trusted server-side value first
    const publicRole = (user?.publicMetadata as any)?.role as
      | string
      | undefined;
    const unsafeRole = (user?.unsafeMetadata as any)?.role as
      | string
      | undefined;
    const role = publicRole ?? unsafeRole ?? undefined;

    // If role missing -> show error message (user needs role assigned)
    if (!role) {
      console.error("User has no role assigned");
      return;
    }

    // Admin routes
    if (role === "admin" || role === "superadmin") {
      navigate("/admin", { replace: true });
      return;
    }

    // If recruiter auth hook says recruiter -> go to recruiter dashboard
    if (isRecruiter || role === "recruiter") {
      navigate("/recruiter/dashboard", { replace: true });
      return;
    }

    // User role -> default route
    if (role === "user") {
      navigate("/", { replace: true });
      return;
    }
  }, [isSignedIn, isLoaded, user, isRecruiter, checking, navigate]);

  const goToSignUp = (e?: React.MouseEvent) => {
    e?.preventDefault();
    navigate("/sign-up");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <span className="font-mono text-2xl font-bold text-primary mr-2">
                FitMyJob
              </span>
              {/* <span className="font-mono text-xl">Resume</span> */}
            </div>
          </div>

          {/* Clerk SignIn - return here after auth; we'll route by role in useEffect */}
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
                formButtonPrimary: "bg-primary hover:bg-primary/90",
                footer: "clerk-hidden-footer",
              },
            }}
          />

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <button
              onClick={goToSignUp}
              className="ml-1 inline-block text-primary underline decoration-primary/30 hover:decoration-primary/60 focus:outline-none"
              aria-label="Sign up"
            >
              Sign up
            </button>
          </p>

          <style>{`.clerk-hidden-footer { display: none !important; }`}</style>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInForm;
