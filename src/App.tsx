// src/App.tsx
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/auth";
import { ImprovedAuthProvider } from "@/context/ImprovedAuthContext";
import { AuthDebug } from "@/context/AuthDebug";
import { AppRoutes } from "@/routes";
import { EnvDebug } from "@/components/debug/EnvDebug";
import React from "react";

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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
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
                  <ErrorBoundary>
                    <AppRoutes />
                  </ErrorBoundary>
                </BrowserRouter>
              </div>
            </ImprovedAuthProvider>
          </AuthDebug>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
