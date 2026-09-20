import dotenv from "dotenv";
import path from "path";

// Load environment file BEFORE any other modules are imported
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

console.log(`[Preload] Loaded environment from: ${envFile}, NODE_ENV=${process.env.NODE_ENV}, ENABLE_SANDBOX_FALLBACK=${process.env.ENABLE_SANDBOX_FALLBACK}`);
