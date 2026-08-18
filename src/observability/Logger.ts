import { LogLevel, LogEntry, LogMetadata } from './types';

// Simple masking for sensitive fields
const SENSITIVE_FIELDS = ['password', 'accessToken', 'refreshToken', 'paymentCredentials', 'cardNumber'];

function maskSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  const newObj = { ...obj };
  for (const key in newObj) {
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      newObj[key] = '***MASKED***';
    } else if (typeof newObj[key] === 'object') {
      newObj[key] = maskSensitiveData(newObj[key]);
    }
  }
  return newObj;
}

export class Logger {
  private module: string;
  private environment: string;
  private version: string;

  constructor(module: string) {
    this.module = module;
    this.environment = process.env.NODE_ENV || 'development';
    this.version = '1.0.0'; // Should be dynamic from package.json if possible
  }

  private createLogEntry(severity: LogLevel, message: string, operation: string, context?: Record<string, any>): LogEntry {
    const metadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(), // Assuming modern browser/node environment
      module: this.module,
      component: 'unknown', // Could be passed in constructor or method
      environment: this.environment,
      version: this.version,
      severity,
      operation,
    };

    return {
      message,
      metadata,
      context: context ? maskSensitiveData(context) : undefined,
    };
  }

  private log(severity: LogLevel, message: string, operation: string, context?: Record<string, any>) {
    const entry = this.createLogEntry(severity, message, operation, context);
    // In production, this would send to a centralized logging aggregator
    console.log(JSON.stringify(entry));
  }

  info(message: string, operation: string, context?: Record<string, any>) {
    this.log('INFO', message, operation, context);
  }

  warn(message: string, operation: string, context?: Record<string, any>) {
    this.log('WARNING', message, operation, context);
  }

  error(message: string, operation: string, context?: Record<string, any>, error?: Error) {
    this.log('ERROR', message, operation, { ...context, error: error?.message, stack: error?.stack });
  }
}
