/**
 * Error Tracking and Reporting Service
 * Captures, logs, and reports application errors
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorReport {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    customData?: Record<string, any>;
  };
  breadcrumbs: BreadcrumbEntry[];
}

export interface BreadcrumbEntry {
  timestamp: number;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

class ErrorTracker {
  private breadcrumbs: BreadcrumbEntry[] = [];
  private maxBreadcrumbs = 50;
  private sessionId = this.generateSessionId();
  private errorQueue: ErrorReport[] = [];
  private isReportingErrors = false;

  constructor() {
    this.setupErrorHandlers();
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        severity: ErrorSeverity.HIGH,
        component: 'Global Error Handler',
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        severity: ErrorSeverity.HIGH,
        component: 'Promise Rejection Handler',
      });
    });
  }

  /**
   * Capture an error with context
   */
  public captureError(options: {
    message: string;
    stack?: string;
    severity?: ErrorSeverity;
    component?: string;
    action?: string;
    customData?: Record<string, any>;
  }): ErrorReport {
    const errorId = this.generateErrorId();
    const report: ErrorReport = {
      id: errorId,
      timestamp: Date.now(),
      severity: options.severity || ErrorSeverity.MEDIUM,
      message: options.message,
      stack: options.stack,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        component: options.component,
        action: options.action,
        customData: options.customData,
      },
      breadcrumbs: [...this.breadcrumbs],
    };

    // Add to queue
    this.errorQueue.push(report);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${report.severity.toUpperCase()}] - ${report.id}`);
      console.error('Message:', report.message);
      console.error('Stack:', report.stack);
      console.error('Context:', report.context);
      console.table(report.breadcrumbs);
      console.groupEnd();
    }

    // Report critical errors immediately
    if (report.severity === ErrorSeverity.CRITICAL) {
      this.reportError(report);
    } else {
      // Report other errors in batch
      this.scheduleBatchReport();
    }

    return report;
  }

  /**
   * Add a breadcrumb entry
   */
  public addBreadcrumb(options: {
    category: string;
    message: string;
    level?: 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }): void {
    const breadcrumb: BreadcrumbEntry = {
      timestamp: Date.now(),
      category: options.category,
      message: options.message,
      level: options.level || 'info',
      data: options.data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Set user context for error tracking
   */
  public setUserContext(userId: string, additionalData?: Record<string, any>): void {
    this.addBreadcrumb({
      category: 'auth',
      message: `User context set: ${userId}`,
      data: additionalData,
    });
  }

  /**
   * Report a single error to the server
   */
  private async reportError(report: ErrorReport): Promise<void> {
    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();

      await fetch('/api/analytics/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.warn('Failed to report error:', error);
    }
  }

  /**
   * Report errors in batch (debounced)
   */
  private reportTimeout: number | null = null;
  private scheduleBatchReport(): void {
    if (this.reportTimeout) clearTimeout(this.reportTimeout);

    this.reportTimeout = window.setTimeout(async () => {
      if (this.errorQueue.length === 0) return;

      const errors = [...this.errorQueue];
      this.errorQueue = [];

      try {
        const token = await (window as any).auth?.currentUser?.getIdToken?.();

        await fetch('/api/analytics/errors/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify({ errors }),
        });
      } catch (error) {
        console.warn('Failed to report error batch:', error);
        // Re-queue errors for retry
        this.errorQueue.unshift(...errors);
      }
    }, 5000); // Report every 5 seconds
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Get session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Clear all breadcrumbs
   */
  public clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const errorTracker = new ErrorTracker();
