// src/components/debug/EnvDebug.tsx
import { config } from "@/config/env";
import { useEffect } from "react";

/**
 * Debug component to display environment configuration
 * Only shows in development or when explicitly enabled
 */
export const EnvDebug = ({ show = false }: { show?: boolean }) => {
  useEffect(() => {
    console.log("🔍 Environment Configuration:", {
      environment: config.env,
      apiBaseUrl: config.apiBaseUrl,
      clerkPublishableKey: config.clerkPublishableKey
        ? `${config.clerkPublishableKey.substring(0, 20)}...`
        : "NOT SET",
      cashfreeMode: config.cashfreeMode,
      allEnvVars: {
        VITE_ENV: import.meta.env.VITE_ENV,
        VITE_DEV_API_BASE_URL: import.meta.env.VITE_DEV_API_BASE_URL,
        VITE_STAGING_API_BASE_URL: import.meta.env.VITE_STAGING_API_BASE_URL,
        VITE_PROD_API_BASE_URL: import.meta.env.VITE_PROD_API_BASE_URL,
        VITE_DEV_CLERK_PUBLISHABLE_KEY: import.meta.env
          .VITE_DEV_CLERK_PUBLISHABLE_KEY
          ? "SET"
          : "NOT SET",
        VITE_STAGING_CLERK_PUBLISHABLE_KEY: import.meta.env
          .VITE_STAGING_CLERK_PUBLISHABLE_KEY
          ? "SET"
          : "NOT SET",
        VITE_PROD_CLERK_PUBLISHABLE_KEY: import.meta.env
          .VITE_PROD_CLERK_PUBLISHABLE_KEY
          ? "SET"
          : "NOT SET",
      },
    });
  }, []);

  if (!show && config.env !== "development") {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-md text-xs font-mono z-50"
      style={{ maxHeight: "400px", overflow: "auto" }}
    >
      <div className="font-bold mb-2 text-yellow-400">⚠️ Debug Mode</div>
      {/* <div className="space-y-1">
        <div>
          <span className="text-gray-400">Environment:</span>{" "}
          <span className="text-green-400">{config.env}</span>
        </div>
        <div>
          <span className="text-gray-400">API Base URL:</span>{" "}
          <span className="text-blue-400">
            {config.apiBaseUrl || "❌ NOT SET"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Clerk Key:</span>{" "}
          <span className="text-purple-400">
            {config.clerkPublishableKey
              ? `${config.clerkPublishableKey.substring(0, 20)}...`
              : "❌ NOT SET"}
          </span>
        </div>
      </div> */}
    </div>
  );
};

/**
 * Test API connectivity
 */
export const testApiConnection = async (baseUrl: string) => {
  console.log(`🔍 Testing API connection to: ${baseUrl}`);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API is reachable:", data);
      return { success: true, data };
    } else {
      console.error("❌ API returned error status:", response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error("❌ Cannot reach API:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Auto-run connectivity test on load
if (typeof window !== "undefined") {
  const apiUrl = config.apiBaseUrl;
  if (apiUrl) {
    testApiConnection(apiUrl);
  } else {
    console.error(
      "❌ API_BASE_URL is not set! Check your environment variables."
    );
  }
}
