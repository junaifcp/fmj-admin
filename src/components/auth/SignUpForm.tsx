// src/components/auth/SignUpForm.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SignUp, useUser } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthToken } from "@/utils/auth";
import { toast } from "sonner";
import * as recruiterApi from "@/api/recruiter";

const REF_LOCAL_KEY = "signup_referral";

const SignUpForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, user, isLoaded } = useUser();
  const { getAuthToken } = useAuthToken();

  // Track if we've already attempted redirect to prevent loops
  const [hasRedirected, setHasRedirected] = useState(false);

  // 1) Capture ?ref=CODE into localStorage so it survives Clerk redirects and reloads.
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const ref = params.get("ref");
      if (ref) {
        localStorage.setItem(REF_LOCAL_KEY, ref);
      }
    } catch (err) {
      // defensive: ignore
    }
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    let claimed = false;

    const waitForToken = async (
      attempts = 6,
      delayMs = 500
    ): Promise<string | null> => {
      for (let i = 0; i < attempts; i++) {
        try {
          const token = await getAuthToken();
          if (token) return token;
        } catch (err) {
          // Token not available yet, retry
        }
        // small sleep
        await new Promise((r) => setTimeout(r, delayMs));
      }
      return null;
    };

    const claimReferralIfPresent = async () => {
      // don't proceed unless clerk loaded & signed in
      if (!isLoaded) {
        return;
      }
      if (!isSignedIn) {
        return;
      }

      // only attempt once per mount
      if (claimed) {
        return;
      }

      const referralCode = localStorage.getItem(REF_LOCAL_KEY);

      if (!referralCode) return;

      // Try to obtain auth token with small retries
      const token = await waitForToken();

      if (!token) {
        return;
      }

      // sanity: ensure recruiterApi method exists
      if (
        !recruiterApi ||
        typeof recruiterApi.linkReferralCode !== "function"
      ) {
        return;
      }

      // attempt the API call (with one retry on failure)
      try {
        const res = await recruiterApi.linkReferralCode(referralCode);

        // consider success if backend returns { success: true } or message
        const ok =
          res && (res.success === true || typeof res.message === "string");
        if (ok && mounted) {
          localStorage.removeItem(REF_LOCAL_KEY);
          toast.success(
            res.success === true
              ? "Referral applied — thanks!"
              : res.message || "Referral linked"
          );
          claimed = true;
        }
      } catch (err: any) {
        // transient retry once
        try {
          const res2 = await recruiterApi.linkReferralCode(referralCode);
          if (
            res2 &&
            (res2.success === true || typeof res2.message === "string")
          ) {
            if (mounted) {
              localStorage.removeItem(REF_LOCAL_KEY);
              toast.success(
                res2.success === true
                  ? "Referral applied — thanks!"
                  : res2.message || "Referral linked"
              );
              claimed = true;
            }
          }
        } catch (err2) {
          if (mounted) {
            toast.error(
              "Could not apply referral automatically — it will be retried later."
            );
          }
          // keep referral in localStorage for future retry
        }
      }
    };

    // run
    claimReferralIfPresent();

    return () => {
      mounted = false;
    };
    // note: keep deps minimal and include things that matter
    // getAuthToken is stable from your hook, recruiterApi is module import (stable)
  }, [isLoaded, isSignedIn]);

  // 2) When user becomes signed in, try to claim/link referral if we have it stored.
  // This runs in the background and does not block the redirect flow.
  // useEffect(() => {
  //   let mounted = true;

  //   const claimReferralIfPresent = async () => {
  //     if (!isLoaded || !isSignedIn) return;

  //     const referralCode = localStorage.getItem(REF_LOCAL_KEY);
  //     if (!referralCode) return;

  //     try {
  //       const token = await getAuthToken();
  //       if (!token) {
  //         console.warn("No auth token available to claim referral");
  //         return;
  //       }

  //       // Use recruiter API client instead of raw fetch
  //       const result = await recruiterApi.linkReferralCode(token, referralCode);

  //       if (result && (result.success === true || result.message)) {
  //         // Consider success if API returns success=true OR a message object
  //         localStorage.removeItem(REF_LOCAL_KEY);
  //         if (!mounted) return;
  //         toast.success(
  //           result.success === true
  //             ? "Referral applied — thanks for signing up!"
  //             : result.message || "Referral processing completed"
  //         );
  //       } else {
  //         // If the endpoint returned an empty object, still clear (optional).
  //         // If you'd rather retry later, don't remove from localStorage.
  //         console.warn("Referral link returned no explicit success:", result);
  //       }
  //     } catch (err: any) {
  //       // createAuthenticatedRequest will throw RecruiterAPIError on non-2xx
  //       console.error("Referral link failed:", err);
  //       // keep referral in localStorage for retry later (do not remove)
  //       // offer a gentle toast for visibility (non-blocking)
  //       if (mounted) {
  //         toast.error(
  //           err?.message ||
  //             "Could not apply referral automatically — it will be retried later."
  //         );
  //       }
  //     }
  //   };

  //   claimReferralIfPresent();

  //   return () => {
  //     mounted = false;
  //   };
  //   // note: we intentionally don't add getAuthToken or recruiterApi to deps since they're stable
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isLoaded, isSignedIn]);

  // 3) Role-based redirect logic (do not override deep links)
  useEffect(() => {
    // CRITICAL: Prevent multiple redirects
    if (hasRedirected) {
      return;
    }

    // Wait until Clerk is ready - CRITICAL: don't proceed if still loading
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      return;
    }

    // CRITICAL: Only auto-redirect if we're actually on the sign-up page.
    // This prevents redirect loops when user is already on destination page
    if (location.pathname !== "/sign-up") {
      return;
    }

    // If user came here because a guard redirected them, prefer returning them.
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== "/sign-up") {
      setHasRedirected(true);
      navigate(from, { replace: true });
      return;
    }

    // Get role from Clerk metadata
    const role =
      (user?.publicMetadata as any)?.role ||
      (user?.unsafeMetadata as any)?.role;

    if (!role) {
      // Don't redirect without a role - prevents loops
      return;
    }

    // Mark that we're about to redirect
    setHasRedirected(true);

    // Perform redirect based on role
    if (role === "admin" || role === "superadmin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (role === "recruiter") {
      navigate("/recruiter/dashboard", { replace: true });
      return;
    }

    if (role === "user") {
      navigate("/", { replace: true });
      return;
    }
  }, [
    hasRedirected,
    isSignedIn,
    isLoaded,
    location.pathname,
    location.state,
    user?.publicMetadata,
    user?.unsafeMetadata,
    navigate,
  ]);

  const goToSignIn = (e?: React.MouseEvent) => {
    e?.preventDefault();
    navigate("/sign-in");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-6">
          {/* Logo */}
          {/* <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <span className="font-mono text-2xl font-bold text-primary mr-2">
                FitMyJob
              </span>
              <span className="font-mono text-xl">Resume</span>
            </div>
          </div> */}

          {/* Clerk SignUp — no role passed; redirect to role-selection for post-signup onboarding */}
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
                formButtonPrimary: "bg-primary hover:bg-primary/90",
                footer: "clerk-hidden-footer",
              },
            }}
          />

          {/* Custom sign-in text */}
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={goToSignIn}
              className="ml-1 inline-block text-primary underline decoration-primary/30 hover:decoration-primary/60 focus:outline-none"
              aria-label="Go to Sign in"
            >
              Sign in
            </button>
          </p>

          {/* Hide Clerk's footer (dev-safe). Move to global CSS if preferred. */}
          <style>{`.clerk-hidden-footer { display: none !important; }`}</style>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpForm;

// // SignUpForm.tsx
// import React, { useEffect } from "react";

// import { useNavigate, useLocation } from "react-router-dom";
// import { SignUp, useUser } from "@clerk/clerk-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { useRecruiterAuth } from "@/hooks/useRecruiterAuth";

// const SignUpForm: React.FC = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { isRecruiter, checking } = useRecruiterAuth();
//   const { isSignedIn, user, isLoaded } = useUser();

//   useEffect(() => {
//   const params = new URLSearchParams(location.search);
//   const ref = params.get("ref");
//   if (ref) {
//     // save to localStorage to survive redirects
//     localStorage.setItem("signup_referral", ref);
//   }
// }, [location.search]);

//   useEffect(() => {
//     // wait until both clerk user and recruiter-check are ready
//     if (!isLoaded || checking) return;
//     if (!isSignedIn) return;

//     // If user came here because a guard redirected them, prefer returning them.
//     const from = (location.state as any)?.from?.pathname;
//     if (from) {
//       navigate(from, { replace: true });
//       return;
//     }

//     // Only auto-redirect if we're actually on the sign-in page.
//     // This prevents overriding deep-links like /recruiter/profile during reload.
//     if (location.pathname !== "/sign-in") {
//       // do nothing — user is already on a non-sign-in page (leave them there)
//       return;
//     }

//     // Prefer trusted server-side value first
//     const publicRole = (user?.publicMetadata as any)?.role as
//       | string
//       | undefined;
//     const unsafeRole = (user?.unsafeMetadata as any)?.role as
//       | string
//       | undefined;
//     const role = publicRole ?? unsafeRole ?? undefined;

//     if (!role) {
//       console.error("User has no role assigned");
//       return;
//     }

//     if (role === "admin" || role === "superadmin") {
//       navigate("/admin", { replace: true });
//       return;
//     }

//     if (isRecruiter || role === "recruiter") {
//       navigate("/recruiter/dashboard", { replace: true });
//       return;
//     }

//     if (role === "user") {
//       navigate("/", { replace: true });
//       return;
//     }
//   }, [isSignedIn, isLoaded, user, isRecruiter, checking, navigate, location]);

//   const goToSignIn = (e?: React.MouseEvent) => {
//     e?.preventDefault();
//     navigate("/sign-in");
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-background p-4">
//       <Card className="w-full max-w-md">
//         <CardContent className="pt-6 space-y-6">
//           {/* Logo */}
//           <div className="flex justify-center mb-6">
//             <div className="flex items-center">
//               <span className="font-mono text-2xl font-bold text-primary mr-2">
//                 FitMyJob
//               </span>
//               <span className="font-mono text-xl">Resume</span>
//             </div>
//           </div>

//           {/* Clerk SignUp — no role passed; redirect to role-selection for post-signup onboarding */}
//           <SignUp
//             appearance={{
//               elements: {
//                 rootBox: "w-full",
//                 card: "shadow-none",
//                 formButtonPrimary: "bg-primary hover:bg-primary/90",
//                 footer: "clerk-hidden-footer",
//               },
//             }}
//           />

//           {/* Custom sign-in text */}
//           <p className="mt-2 text-center text-sm text-muted-foreground">
//             Already have an account?{" "}
//             <button
//               onClick={goToSignIn}
//               className="ml-1 inline-block text-primary underline decoration-primary/30 hover:decoration-primary/60 focus:outline-none"
//               aria-label="Go to Sign in"
//             >
//               Sign in
//             </button>
//           </p>

//           {/* Hide Clerk's footer (dev-safe). Move to global CSS if preferred. */}
//           <style>{`.clerk-hidden-footer { display: none !important; }`}</style>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default SignUpForm;
