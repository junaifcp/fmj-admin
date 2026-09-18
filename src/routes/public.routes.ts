// src/routes/public.routes.ts
import { lazy } from "react";
import { RouteConfig } from "./types";

const SignInLanding = lazy(() => import("@/pages/SignInLanding"));
const SignInForm = lazy(() => import("@/components/auth/SignInForm"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
    path: "*",
    element: NotFound,
  },
];
