import dotenv from "dotenv";
import path from "path";

// Load environment file BEFORE any other modules are imported
// First check if NODE_ENV was set externally (e.g., by test runner)
let envFile = ".env";
if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
  envFile = ".env.test";
} else if (!process.env.NODE_ENV) {
  // If NODE_ENV is not set externally, load .env to set it
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
  // Now check again in case .env set it to "test"
  if (process.env.NODE_ENV === "test") {
    envFile = ".env.test";
  } else {
    envFile = ".env";
  }
}

// Load the appropriate environment file with override
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

console.log(`[Preload] Loaded environment from: ${envFile}, NODE_ENV=${process.env.NODE_ENV}, ENABLE_SANDBOX_FALLBACK=${process.env.ENABLE_SANDBOX_FALLBACK}`);
