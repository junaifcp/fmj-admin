// src/pages/SignInLanding.tsx
import React, { useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { SignIn, useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load AnimatedCarousel for better performance
const AnimatedCarousel = lazy(
  () => import("@/components/animations/AnimatedCarousel")
);

const SignInLanding: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run redirect if Clerk is fully loaded and user is signed in.
    if (!isLoaded || !isSignedIn) return;

    // If the user didn't actually land on the landing page, don't override their path
    if (location.pathname !== "/") return;

    const publicRole = (user?.publicMetadata as any)?.role as
      | string
      | undefined;
    const unsafeRole = (user?.unsafeMetadata as any)?.role as
      | string
      | undefined;
    const role = publicRole ?? unsafeRole ?? undefined;

    if (!role) {
      navigate("/sign-in", { replace: true });
    } else if (role === "admin" || role === "superadmin") {
      navigate("/admin", { replace: true });
    } else if (role === "recruiter") {
      navigate("/recruiter/dashboard", { replace: true });
    } else if (role === "user") {
      navigate("/", { replace: true });
    } else {
      navigate("/sign-in", { replace: true });
    }
  }, [isLoaded, isSignedIn, user, navigate, location]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const coupon = params.get("coupon");

      if (coupon) {
        localStorage.setItem("checkout_coupon", coupon);
        console.log("[COUPON] Stored coupon code:", coupon);
      }
    } catch (err) {
      console.error("[COUPON] Failed to store coupon from URL:", err);
    }
  }, [location.search]);

  // Show loading only while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If signed in, show loading while redirecting
  if (isSignedIn) {
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* central page container ensures symmetric left/right padding on mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen lg:min-h-[calc(100vh-96px)]">
          {/* Carousel (hidden on small screens, lazy loaded) */}
          <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-background to-muted/30 p-8 items-center justify-center">
            <div className="w-full max-w-3xl">
              <Suspense
                fallback={
                  <div className="space-y-4 w-full">
                    <Skeleton className="h-[220px] w-[220px] mx-auto rounded-full" />
                    <Skeleton className="h-8 w-64 mx-auto" />
                    <Skeleton className="h-4 w-96 mx-auto" />
                  </div>
                }
              >
                <AnimatedCarousel />
              </Suspense>
            </div>
          </div>

          {/* Sign-in column (visible on all sizes) */}
          <div className="lg:col-span-5 flex items-center justify-center py-12 lg:py-8 order-1 lg:order-2">
            <div className="w-full max-w-md mx-auto">
              {/* Sign In Card */}
              <div
                id="clerk-sign-in"
                className="bg-card border rounded-lg shadow-lg p-4 sm:p-6"
              >
                <SignIn
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none",
                      formButtonPrimary:
                        "bg-primary hover:bg-primary/90 text-primary-foreground",
                      footer: "clerk-hidden-footer",
                    },
                  }}
                />
              </div>

              {/* Optional helper link */}
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Don’t have an account?{" "}
                <Link to="/sign-up" className="text-primary underline">
                  Create one
                </Link>
              </p>

              {/* Accessibility skip link */}
              <a
                href="#clerk-sign-in"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
              >
                Skip to sign in
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links — centered text with contact link on the right */}
      <footer className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p className="text-xs text-muted-foreground text-center w-full">
            <span className="inline-block">
              <Link to="/terms-and-conditions" className="hover:underline">
                Terms of Service
              </Link>
              {" • "}
              <Link to="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
            </span>
          </p>

          <div className="ml-4 flex-shrink-0">
            <Link
              to="/contact"
              className="text-xs text-muted-foreground hover:underline"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </footer>

      <style>{`.clerk-hidden-footer { display: none !important; }`}</style>
    </div>
  );
};

export default SignInLanding;

// // src/pages/SignInLanding.tsx
// import React, { useEffect, useState, lazy, Suspense } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { SignIn, useUser } from "@clerk/clerk-react";
// import { Loader2 } from "lucide-react";
// import { Skeleton } from "@/components/ui/skeleton";
// // Lazy load AnimatedCarousel for better performance
// const AnimatedCarousel = lazy(
//   () => import("@/components/animations/AnimatedCarousel")
// );

// const SignInLanding: React.FC = () => {
//   const { isLoaded, isSignedIn, user } = useUser();
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     // Only run redirect if Clerk is fully loaded and user is signed in.
//     if (!isLoaded || !isSignedIn) return;

//     // If the user didn't actually land on the landing page, don't override their path
//     if (location.pathname !== "/") return;

//     const publicRole = (user?.publicMetadata as any)?.role as
//       | string
//       | undefined;
//     const unsafeRole = (user?.unsafeMetadata as any)?.role as
//       | string
//       | undefined;
//     const role = publicRole ?? unsafeRole ?? undefined;

//     if (!role) {
//       navigate("/sign-in", { replace: true });
//     } else if (role === "admin" || role === "superadmin") {
//       navigate("/admin", { replace: true });
//     } else if (role === "recruiter") {
//       navigate("/recruiter/dashboard", { replace: true });
//     } else if (role === "user") {
//       navigate("/", { replace: true });
//     } else {
//       navigate("/sign-in", { replace: true });
//     }
//   }, [isLoaded, isSignedIn, user, navigate, location]);

//   // Show loading only while Clerk is loading
//   if (!isLoaded) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-background">
//         <div className="space-y-4 text-center">
//           <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
//           <p className="text-sm text-muted-foreground">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // If signed in, show loading while redirecting
//   if (isSignedIn) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-background">
//         <div className="space-y-4 text-center">
//           <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
//           <p className="text-sm text-muted-foreground">Redirecting...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background text-foreground">
//       {/* central page container ensures symmetric left/right padding on mobile */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
//           {/* Carousel (hidden on small screens, lazy loaded) */}
//           <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-background to-muted/30 p-8 items-center justify-center">
//             <div className="w-full max-w-3xl">
//               <Suspense
//                 fallback={
//                   <div className="space-y-4 w-full">
//                     <Skeleton className="h-[220px] w-[220px] mx-auto rounded-full" />
//                     <Skeleton className="h-8 w-64 mx-auto" />
//                     <Skeleton className="h-4 w-96 mx-auto" />
//                   </div>
//                 }
//               >
//                 <AnimatedCarousel />
//               </Suspense>
//             </div>
//           </div>

//           {/* Sign-in column (visible on all sizes) */}
//           <div className="lg:col-span-5 flex items-center justify-center py-12 lg:py-8 order-1 lg:order-2">
//             <div className="w-full max-w-md mx-auto">
//               {/* Logo and Branding */}
//               {/* <div className="flex items-center gap-3 mb-6">
//                 <img
//                   src="/images/logo.svg"
//                   alt="FitMyJob"
//                   className="w-10 h-10 md:w-12 md:h-12"
//                 />
//                 <div>
//                   <h1 className="font-mono text-lg md:text-2xl font-bold text-foreground">
//                     FitMyJob Resume
//                   </h1>
//                   <p className="text-xs md:text-sm text-muted-foreground">
//                     Sign in to continue
//                   </p>
//                 </div>
//               </div> */}

//               {/* Sign In Card */}
//               <div
//                 id="clerk-sign-in"
//                 className="bg-card border rounded-lg shadow-lg p-4 sm:p-6"
//               >
//                 <SignIn
//                   appearance={{
//                     elements: {
//                       rootBox: "w-full",
//                       card: "shadow-none",
//                       formButtonPrimary:
//                         "bg-primary hover:bg-primary/90 text-primary-foreground",
//                       footer: "clerk-hidden-footer",
//                     },
//                   }}
//                 />
//               </div>

//               {/* Optional helper link */}
//               <p className="mt-4 text-xs text-muted-foreground text-center">
//                 Don’t have an account?{" "}
//                 <a href="/sign-up" className="text-primary underline">
//                   Create one
//                 </a>
//               </p>

//               {/* Accessibility skip link */}
//               <a
//                 href="#clerk-sign-in"
//                 className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
//               >
//                 Skip to sign in
//               </a>
//             </div>
//           </div>
//         </div>

//         {/* Footer Links */}
//         <footer className="py-6 text-center">
//           <p className="text-xs text-muted-foreground">
//             <a href="/terms-and-conditions" className="hover:underline">Terms of Service</a>
//             {" • "}
//             <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
//           </p>
//         </footer>
//       </div>

//       <style>{`.clerk-hidden-footer { display: none !important; }`}</style>
//     </div>
//   );
// };

// export default SignInLanding;
