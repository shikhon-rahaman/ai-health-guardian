/**
 * Centralized frontend configuration.
 * All API base URLs must come from environment variables — never hardcode.
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiUrl && process.env.NODE_ENV === "development") {
  throw new Error("Missing NEXT_PUBLIC_API_URL");
}

if (!rawApiUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_URL");
}

export const API_URL = rawApiUrl.replace(/\/$/, "");
