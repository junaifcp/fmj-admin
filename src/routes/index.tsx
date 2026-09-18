// src/routes/index.tsx
import { Route, Routes } from "react-router-dom";
import { Suspense, ComponentType, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { AdminGuard } from "@/components/auth/RoleGuard";
import { getAdminMe } from "@/api/admin";
import { publicRoutes } from "./public.routes";
import { adminLayoutRoutes } from "./admin.routes";
import { RouteConfig } from "./types";

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="space-y-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

/**
 * Renders a single route configuration
 */
const renderRoute = (
  route: RouteConfig,
  ProtectionWrapper?: ComponentType<{ children: ReactNode }>
) => {
  const Element = route.element;
  const element = (
    <Suspense fallback={<PageLoader />}>
      <Element />
    </Suspense>
  );

  const wrappedElement = ProtectionWrapper ? (
    <ProtectionWrapper>{element}</ProtectionWrapper>
  ) : (
    element
  );

  if (route.index) {
    return <Route key={route.path || "index"} index element={wrappedElement} />;
  }

  if (route.children) {
    return (
      <Route key={route.path} path={route.path} element={wrappedElement}>
        {route.children.map((child) => renderRoute(child))}
      </Route>
    );
  }

  return <Route key={route.path} path={route.path} element={wrappedElement} />;
};

/**
 * Main AppRoutes: public sign-in + admin panel.
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {publicRoutes.map((route) => renderRoute(route))}

      {renderRoute(adminLayoutRoutes, ({ children }) => (
        <AdminGuard backendVerify={getAdminMe}>{children}</AdminGuard>
      ))}
    </Routes>
  );
};
