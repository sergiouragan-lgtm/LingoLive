/**
 * Security Event Logger
 * Logs security-relevant events for monitoring and auditing
 * Integrates with application observability and incident response systems
 */

export enum SecurityEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum SecurityEventType {
  // Authentication events
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_INVALID_TOKEN = 'auth_invalid_token',
  AUTH_EXPIRED_TOKEN = 'auth_expired_token',

  // Authorization events
  AUTHZ_DENIED = 'authz_denied',
  AUTHZ_INSUFFICIENT_PERMISSIONS = 'authz_insufficient_permissions',

  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  RATE_LIMIT_RECOVERED = 'rate_limit_recovered',

  // Validation events
  VALIDATION_FAILED = 'validation_failed',
  INVALID_INPUT = 'invalid_input',

  // Access control events
  SUSPICIOUS_ACCESS_PATTERN = 'suspicious_access_pattern',
  UNAUTHORIZED_RESOURCE_ACCESS = 'unauthorized_resource_access',
  DATA_ACCESS_DENIED = 'data_access_denied',

  // Configuration events
  SECURITY_CONFIG_CHANGE = 'security_config_change',
  SECRETS_ACCESS = 'secrets_access',

  // Anomaly detection
  ANOMALY_DETECTED = 'anomaly_detected',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',

  // Data events
  DATA_EXPORT = 'data_export',
  DATA_DELETION = 'data_deletion',
  DATA_MODIFICATION = 'data_modification',
}

export interface SecurityEventContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

export interface SecurityEvent {
  timestamp: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  message: string;
  context: SecurityEventContext;
  metadata?: Record<string, any>;
}

/**
 * Log a security event
 * @param type - Type of security event
 * @param severity - Severity level (info, warning, error, critical)
 * @param message - Human-readable event description
 * @param context - Contextual information (userId, IP, endpoint, etc.)
 * @param metadata - Additional structured data for analysis
 */
export function logSecurityEvent(
  type: SecurityEventType,
  severity: SecurityEventSeverity,
  message: string,
  context: SecurityEventContext,
  metadata?: Record<string, any>
) {
  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    type,
    severity,
    message,
    context,
    metadata,
  };

  // Log to console with structured format for production logging infrastructure
  console.log(JSON.stringify({
    level: 'security',
    severity,
    ...event,
  }));

  // In production, send to centralized logging service (e.g., Datadog, Splunk, CloudWatch)
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoringService(event);
  }

  // Alert on critical security events
  if (severity === SecurityEventSeverity.CRITICAL) {
    alertSecurityTeam(event);
  }
}

/**
 * Log authentication failure
 */
export function logAuthFailure(
  reason: string,
  userId: string | undefined,
  ipAddress: string | undefined,
  context?: Record<string, any>
) {
  logSecurityEvent(
    SecurityEventType.AUTH_FAILURE,
    SecurityEventSeverity.WARNING,
    `Authentication failed: ${reason}`,
    { userId, ipAddress },
    context
  );
}

/**
 * Log authorization denial
 */
export function logAuthzDenied(
  reason: string,
  userId: string,
  resource: string,
  action: string,
  ipAddress?: string
) {
  logSecurityEvent(
    SecurityEventType.AUTHZ_DENIED,
    SecurityEventSeverity.WARNING,
    `Authorization denied: ${reason}`,
    { userId, ipAddress },
    { resource, action }
  );
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
  ipAddress: string,
  endpoint: string,
  method: string,
  attemptCount: number
) {
  const severity = attemptCount > 50 ? SecurityEventSeverity.ERROR : SecurityEventSeverity.WARNING;

  logSecurityEvent(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    severity,
    `Rate limit exceeded on ${endpoint}`,
    { ipAddress, endpoint, method },
    { attemptCount }
  );
}

/**
 * Log validation failure
 */
export function logValidationFailure(
  userId: string | undefined,
  endpoint: string,
  errors: Array<{ path: string; message: string }>
) {
  logSecurityEvent(
    SecurityEventType.VALIDATION_FAILED,
    SecurityEventSeverity.INFO,
    `Request validation failed on ${endpoint}`,
    { userId, endpoint },
    { errorCount: errors.length, errors: errors.slice(0, 5) } // Limit error details
  );
}

/**
 * Log suspicious access pattern
 */
export function logSuspiciousAccess(
  userId: string,
  ipAddress: string,
  reason: string,
  context?: Record<string, any>
) {
  logSecurityEvent(
    SecurityEventType.SUSPICIOUS_ACCESS_PATTERN,
    SecurityEventSeverity.ERROR,
    `Suspicious access detected: ${reason}`,
    { userId, ipAddress },
    context
  );
}

/**
 * Log data access event
 */
export function logDataAccess(
  userId: string,
  resourceType: string,
  action: 'read' | 'modify' | 'delete' | 'export',
  recordCount: number
) {
  const eventType = {
    read: SecurityEventType.DATA_MODIFICATION,
    modify: SecurityEventType.DATA_MODIFICATION,
    delete: SecurityEventType.DATA_DELETION,
    export: SecurityEventType.DATA_EXPORT,
  }[action];

  logSecurityEvent(
    eventType,
    SecurityEventSeverity.INFO,
    `Data ${action} event on ${resourceType}`,
    { userId },
    { resourceType, action, recordCount }
  );
}

/**
 * Internal: Send to monitoring service
 */
function sendToMonitoringService(event: SecurityEvent) {
  // Implementation depends on monitoring service
  // Examples: Datadog, Splunk, CloudWatch, ELK stack
  // For now, just logged to console (actual implementation would send HTTP request)

  if (process.env.MONITORING_SERVICE_URL) {
    fetch(process.env.MONITORING_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(err => {
      console.error('[SecurityEventLogger] Failed to send event to monitoring service:', err.message);
    });
  }
}

/**
 * Internal: Alert security team on critical events
 */
function alertSecurityTeam(event: SecurityEvent) {
  // Implementation depends on alerting system
  // Examples: PagerDuty, Slack, email, SMS

  if (process.env.SECURITY_ALERT_WEBHOOK) {
    fetch(process.env.SECURITY_ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Critical Security Event: ${event.message}`,
        event,
      }),
    }).catch(err => {
      console.error('[SecurityEventLogger] Failed to alert security team:', err.message);
    });
  }
}
