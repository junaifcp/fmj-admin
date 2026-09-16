// src/App.tsx
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ImprovedAuthProvider } from "@/context/ImprovedAuthContext";
import { AuthDebug } from "@/context/AuthDebug";
import { useAnalytics } from "@/hooks/useAnalytics";
import { AppRoutes } from "@/routes";
import { clerkPublishableKey } from "@/config/env";
import { EnvDebug } from "@/components/debug/EnvDebug";
import React, { useEffect } from "react";

// Simple ErrorBoundary for lazy chunk failures
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // you might want to log errors to an external service here
    // console.error("Boundary caught", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't load this part of the app. Try reloading the page.
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
                aria-label="Reload page"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component to track page views (memoized)
const PageViewTracker: React.FC = React.memo(() => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // include pathname + search to capture query params too
    trackPageView("Page View", {
      page_path: location.pathname + location.search,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [location.pathname, location.search, trackPageView]);

  return null;
});
PageViewTracker.displayName = "PageViewTracker";

// Create QueryClient once at module level to prevent re-initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <ClerkProvider
      publishableKey={
        clerkPublishableKey || "pk_test_dummy_key_for_development"
      }
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthDebug>
            <ImprovedAuthProvider>
              <div className="overflow-x-hidden w-full min-h-screen">
                {/* Single toast system (Sonner) */}
                <Sonner />
                {/* Environment debug info (shows in dev or when ?debug=true) */}
                <EnvDebug
                  show={
                    new URLSearchParams(window.location.search).get("debug") ===
                    "true"
                  }
                />
                <BrowserRouter>
                  <PageViewTracker />
                  <ErrorBoundary>
                    <AppRoutes />
                  </ErrorBoundary>
                </BrowserRouter>
              </div>
            </ImprovedAuthProvider>
          </AuthDebug>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
