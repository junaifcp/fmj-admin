// src/routes/public.routes.ts
import { lazyWithReload } from "./lazyWithReload";
import { RouteConfig } from "./types";

const SignInLanding = lazyWithReload(() => import("@/pages/SignInLanding"));
const SignInForm = lazyWithReload(() => import("@/components/auth/SignInForm"));
const NotFound = lazyWithReload(() => import("@/pages/NotFound"));

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
