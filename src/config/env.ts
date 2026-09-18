// src/config/env.ts

/**
 * Environment configuration module
 * Provides centralized access to environment-specific configuration values
 */

type Environment = "development" | "staging" | "production";

interface Config {
  env: Environment;
  apiBaseUrl: string;
  googleClientId: string;
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
  let googleClientId: string;

  switch (env) {
    case "production":
      apiBaseUrl = import.meta.env.VITE_PROD_API_BASE_URL || "";
      googleClientId = import.meta.env.VITE_PROD_GOOGLE_CLIENT_ID || "";
      break;

    case "staging":
      apiBaseUrl = import.meta.env.VITE_STAGING_API_BASE_URL || "";
      googleClientId = import.meta.env.VITE_STAGING_GOOGLE_CLIENT_ID || "";
      break;

    case "development":
    default:
      apiBaseUrl = import.meta.env.VITE_DEV_API_BASE_URL || "";
      googleClientId = import.meta.env.VITE_DEV_GOOGLE_CLIENT_ID || "";
      break;
  }

  return {
    env,
    apiBaseUrl,
    googleClientId,
  };
}

/**
 * Export individual config values for convenience
 */
export const config = getConfig();
export const { apiBaseUrl, googleClientId } = config;
