/**
 * Centralized Environment Configuration
 *
 * This module ensures all required environment variables are defined
 * and provides a typed configuration object.
 */

const requiredEnvVars = [
  "MONGODB_URI",
  "REDIS_URL",
  "ARIA2_PATH",
  "QBIT_URL",
  "QBIT_USER",
  "QBIT_PASS",
] as const;

function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[CONFIG ERROR] Missing required environment variables: ${missing.join(", ")}.`;

    // Detect if we are in Next.js build phase or CI/Test environment.
    // We want to avoid crashing during build if secrets aren't injected.
    const isBuild =
      process.env.NEXT_PHASE?.includes("build") ||
      process.env.CI === "true" ||
      process.env.NODE_ENV === "test";

    if (process.env.NODE_ENV === "production" && !isBuild) {
      console.error(errorMsg);
      throw new Error(errorMsg);
    } else {
      console.warn(
        errorMsg +
          " (Continuing in development/build mode - functionality may be limited)",
      );
    }
  }
}

// Perform validation on import
validateEnv();

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI!,
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
  downloader: {
    aria2Path: process.env.ARIA2_PATH!,
    qbitUrl: process.env.QBIT_URL!,
    qbitUser: process.env.QBIT_USER!,
    qbitPass: process.env.QBIT_PASS!,
  },
  subtitles: {
    openSubtitlesKey: process.env.OPENSUBTITLES_API_KEY,
  },
  aniskip: {
    clientId:
      process.env.ANISKIP_CLIENT_ID || "ZGfO0sMF3eCwLYf8yMSCJjlynwNGRXWE",
  },
  isProd: process.env.NODE_ENV === "production",
  isDev: process.env.NODE_ENV !== "production",
} as const;

export default config;
