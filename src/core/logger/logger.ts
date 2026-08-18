/**
 * Centralized Logging System
 * All services must use this logger to ensure audit trails and error reporting.
 */
export class LoggerService {
  log(message: string, context?: any) {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context || "");
  }

  error(message: string, error?: any, context?: any) {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, { error, context });
    // In production, integrate with Crashlytics or similar
  }
}
