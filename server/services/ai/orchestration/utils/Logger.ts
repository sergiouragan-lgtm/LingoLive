export class AIOrchestrationLogger {
  private static prefix = "[LingoLIVE AI Orchestrator]";

  static info(message: string, meta?: any) {
    console.log(`\x1b[36m${this.prefix} INFO:\x1b[0m ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
  }

  static warn(message: string, error?: any) {
    console.warn(`\x1b[33m${this.prefix} WARN:\x1b[0m ${message}`, error ? error : "");
  }

  static error(message: string, error?: any, context?: string) {
    console.error(
      `\x1b[31m${this.prefix} ERROR [${context || "GENERAL"}]:\x1b[0m ${message}`,
      error instanceof Error ? error.stack || error.message : error
    );
  }

  static perf(operationName: string, durationMs: number, success: boolean) {
    const color = success ? "\x1b[32m" : "\x1b[31m";
    console.log(
      `${color}${this.prefix} PERF:\x1b[0m Operation '${operationName}' completed in ${durationMs.toFixed(2)}ms (Success: ${success})`
    );
  }
}
