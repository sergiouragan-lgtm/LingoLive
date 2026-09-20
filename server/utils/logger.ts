/**
 * Server Logger Utility
 * Provides structured logging for server operations
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...(data && { data }),
    };
  }

  debug(message: string, data?: any) {
    const entry = this.formatLog('debug', message, data);
    if (this.isDev) {
      console.log('[DEBUG]', entry);
    }
  }

  info(message: string, data?: any) {
    const entry = this.formatLog('info', message, data);
    console.log('[INFO]', entry);
  }

  warn(message: string, data?: any) {
    const entry = this.formatLog('warn', message, data);
    console.warn('[WARN]', entry);
  }

  error(message: string, data?: any) {
    const entry = this.formatLog('error', message, data);
    console.error('[ERROR]', entry);
  }
}

export const logger = new Logger();
