/**
 * Environment & Reusable API Configuration Layer
 */
export const CONFIG = {
  API_URL: window.location.origin,
  APP_NAME: "Career-Console",
  VERSION: "1.0.0-PROD",
  ENVIRONMENT: import.meta.env.MODE ?? "production",
  SHEETS_SYNC_ENABLED: true,
};
