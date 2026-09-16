// src/routes/index.tsx
import { Route, Routes } from "react-router-dom";
import { Suspense, ComponentType, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { RecruiterGuard, AdminGuard } from "@/components/auth/RoleGuard";
import { getRecruiterMe } from "@/api/recruiter";
import { getAdminMe } from "@/api/admin";
import { publicRoutes } from "./public.routes";
import {
  recruiterStandaloneRoutes,
  recruiterLayoutRoutes,
} from "./recruiter.routes";
import { adminLayoutRoutes } from "./admin.routes";
import { RouteConfig } from "./types";

// Loading fallback component (memoized)
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
 * Main AppRoutes component that renders all application routes
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      {publicRoutes.map((route) => renderRoute(route))}

      {/* Standalone recruiter routes (outside layout) */}
      {recruiterStandaloneRoutes.map((route) =>
        route.protected
          ? renderRoute(route, ({ children }) => (
              <RecruiterGuard backendVerify={getRecruiterMe}>
                {children}
              </RecruiterGuard>
            ))
          : renderRoute(route)
      )}

      {/* Recruiter layout routes */}
      {renderRoute(recruiterLayoutRoutes, ({ children }) => (
        <RecruiterGuard backendVerify={getRecruiterMe}>
          {children}
        </RecruiterGuard>
      ))}

      {/* Admin layout routes */}
      {renderRoute(adminLayoutRoutes, ({ children }) => (
        <AdminGuard backendVerify={getAdminMe}>{children}</AdminGuard>
      ))}
    </Routes>
  );
};
