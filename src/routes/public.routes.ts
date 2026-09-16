// src/routes/public.routes.ts
import { lazy } from "react";
import { RouteConfig } from "./types";

// Lazy load public pages
const SignInLanding = lazy(() => import("@/pages/SignInLanding"));
const SignInForm = lazy(() => import("@/components/auth/SignInForm"));
const SignUpForm = lazy(() => import("@/components/auth/SignUpForm"));
const ContactUs = lazy(() => import("@/pages/ContactUs"));
const TermsConditions = lazy(() => import("@/pages/TermsConditions"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const PricingPolicy = lazy(() => import("@/pages/PricingPolicy"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PublicApplyForm = lazy(() => import("@/pages/public/PublicApplyForm"));

export const publicRoutes: RouteConfig[] = [
  {
    path: "/",
    element: SignInLanding,
  },
  {
    path: "/sign-in",
    element: SignInForm,
  },
  {
    path: "/sign-up",
    element: SignUpForm,
  },
  {
    path: "/contact",
    element: ContactUs,
  },
  {
    path: "/terms-and-conditions",
    element: TermsConditions,
  },
  {
    path: "/refund-policy",
    element: RefundPolicy,
  },
  {
    path: "/privacy-policy",
    element: PrivacyPolicy,
  },
  {
    path: "/pricing-policy",
    element: PricingPolicy,
  },
  {
    path: "/unsubscribe/:token",
    element: Unsubscribe,
  },
  {
    path: "/apply/:uniqueId",
    element: PublicApplyForm,
    protected: false,
  },
  {
    path: "*",
    element: NotFound,
  },
];
