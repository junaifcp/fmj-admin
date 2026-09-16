// src/config/env.ts

/**
 * Environment configuration module
 * Provides centralized access to environment-specific configuration values
 */

type Environment = "development" | "staging" | "production";

interface Config {
  env: Environment;
  apiBaseUrl: string;
  clerkPublishableKey: string;
  cashfreeMode: "production" | "sandbox";
}

/**
 * Get the current environment from VITE_ENV
 * Defaults to 'development' if not set or invalid
 */
function getCurrentEnvironment(): Environment {
  const env = import.meta.env.VITE_ENV as string;

  if (env === "staging" || env === "production") {
    return env;
  }

  return "development";
}

/**
 * Get configuration values based on the current environment
 * @returns Config object with environment-specific values
 */
export function getConfig(): Config {
  const env = getCurrentEnvironment();

  let apiBaseUrl: string;
  let clerkPublishableKey: string;
  let cashfreeMode: "production" | "sandbox";

  switch (env) {
    case "production":
      apiBaseUrl = import.meta.env.VITE_PROD_API_BASE_URL || "";
      clerkPublishableKey =
        import.meta.env.VITE_PROD_CLERK_PUBLISHABLE_KEY || "";
      cashfreeMode = import.meta.env.VITE_PROD_CASHFREE_MODE || "production";
      break;

    case "staging":
      apiBaseUrl = import.meta.env.VITE_STAGING_API_BASE_URL || "";
      clerkPublishableKey =
        import.meta.env.VITE_STAGING_CLERK_PUBLISHABLE_KEY || "";
      cashfreeMode = import.meta.env.VITE_STAGING_CASHFREE_MODE || "sandbox";
      break;

    case "development":
    default:
      apiBaseUrl = import.meta.env.VITE_DEV_API_BASE_URL || "";
      clerkPublishableKey =
        import.meta.env.VITE_DEV_CLERK_PUBLISHABLE_KEY || "";
      cashfreeMode = import.meta.env.VITE_DEV_CASHFREE_MODE || "sandbox";
      break;
  }

  return {
    env,
    apiBaseUrl,
    clerkPublishableKey,
    cashfreeMode,
  };
}

/**
 * Export individual config values for convenience
 */
export const config = getConfig();
export const { apiBaseUrl, clerkPublishableKey, cashfreeMode } = config;
