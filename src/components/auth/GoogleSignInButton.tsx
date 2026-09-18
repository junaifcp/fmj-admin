import React, { useEffect, useRef, useState } from "react";
import { getConfig } from "@/config/env";
import { loadGisScript, loginWithGoogle, useAuth } from "@/auth";

let hasWarnedMissingClientId = false;

interface GoogleSignInButtonProps {
  onAuthenticated?: () => void;
}

/**
 * "Sign in with Google" via Google Identity Services (jwt-authentication
 * phase 9.2). Self-contained: renders its own divider + button container, or
 * nothing at all if VITE_*_GOOGLE_CLIENT_ID is empty — OTP still works.
 * Login only: the backend never creates a user on portal 'admin'.
 */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onAuthenticated }) => {
  const { setSession } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleClientId = getConfig().googleClientId;

  useEffect(() => {
    if (!googleClientId) {
      if (!hasWarnedMissingClientId) {
        hasWarnedMissingClientId = true;
        console.warn(
          "[GoogleSignInButton] VITE_*_GOOGLE_CLIENT_ID is not set; hiding the Google sign-in button.",
        );
      }
      return;
    }

    let cancelled = false;
    loadGisScript()
      .then(() => {
        if (!cancelled) setIsScriptReady(true);
      })
      .catch(() => {
        // Script failed to load — button just won't render; OTP still works.
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId]);

  useEffect(() => {
    if (!isScriptReady || !containerRef.current || !googleClientId) return;
    const google = (window as any).google;
    if (!google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async ({ credential }: { credential: string }) => {
        setError(null);
        try {
          // Send only the GIS ID token, never a Google access token.
          const result = await loginWithGoogle(credential);
          setSession(result.accessToken, result.user);
          onAuthenticated?.();
        } catch (err: any) {
          setError(err?.response?.data?.message || "Google sign-in failed. Please try again.");
        }
      },
    });

    google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
    });
  }, [isScriptReady, googleClientId, setSession, onAuthenticated]);

  if (!googleClientId) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div ref={containerRef} className="flex justify-center" />

      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

export default GoogleSignInButton;
