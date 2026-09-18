import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useImprovedAuth } from "@/context/ImprovedAuthContext";

interface AccessDeniedProps {
  message?: string;
}

/**
 * Shown to signed-in users who are not admin/superadmin.
 * Sign out is the only action — do not send them to recruiter routes.
 */
const AccessDenied: React.FC<AccessDeniedProps> = ({ message }) => {
  const { signOut, isSigningOut } = useImprovedAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="mt-2 text-lg font-semibold">
            FitMySkill Admin — access denied
          </AlertTitle>
          <AlertDescription className="mt-3 space-y-2">
            <p>
              This console is for FitMySkill administrators only. Recruiter,
              employer, and candidate accounts cannot sign in here.
            </p>
            {message && (
              <p className="text-sm mt-2 p-2 bg-destructive/10 rounded">
                {message}
              </p>
            )}
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => signOut()}
          disabled={isSigningOut}
          className="w-full"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </div>
  );
};

export default AccessDenied;
