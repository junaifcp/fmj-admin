// src/context/AuthDebug.tsx
// Temporary debug wrapper to catch auth errors

import React, { ReactNode } from "react";

interface AuthDebugProps {
  children: ReactNode;
}

export const AuthDebug: React.FC<AuthDebugProps> = ({ children }) => {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Authentication Error
            </h2>
            <div className="bg-red-100 border border-red-400 rounded p-4 mb-4">
              <p className="font-mono text-sm text-red-800">{error.message}</p>
            </div>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {error.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={setError}
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading authentication...</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

class ErrorBoundary extends React.Component<
  {
    children: ReactNode;
    onError: (error: Error) => void;
    fallback: ReactNode;
  },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Auth ErrorBoundary caught error:", error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
