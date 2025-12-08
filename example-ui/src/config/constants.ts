declare global {
  interface Window {
    __CONFIG__?: {
      API_URL?: string;
      AUTH0_DOMAIN?: string;
      AUTH0_CLIENT_ID?: string;
      AUTH0_AUDIENCE?: string;
      GROUPS_CLAIM?: string;
    };
  }
}

const runtimeConfig = window.__CONFIG__ || {};

// Helper to get config value: runtime (Docker) > build-time (Vite) > default
const getConfig = (key: keyof NonNullable<Window["__CONFIG__"]>, defaultValue = ""): string => {
  const runtime = runtimeConfig[key];
  if (runtime && !runtime.startsWith("__")) return runtime;

  const buildTime = import.meta.env[key];
  if (buildTime) return buildTime;

  return defaultValue;
};

// Same variable names for local dev (.env.local) and Docker (-e)
export const API_URL = getConfig("API_URL");

export const AUTH0_CONFIG = {
  domain: getConfig("AUTH0_DOMAIN"),
  clientId: getConfig("AUTH0_CLIENT_ID"),
  audience: getConfig("AUTH0_AUDIENCE"),
};

export const GROUPS_CLAIM = getConfig("GROUPS_CLAIM");
