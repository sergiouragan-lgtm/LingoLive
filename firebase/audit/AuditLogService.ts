import { AuditLogRepository } from '../firestore/repositories';
import { EnterpriseAuditLog } from '../firestore/types';

/**
 * Enterprise AuditLogService
 * Core security coordination service responsible for capturing critical security,
 * compliance, identity, and access events.
 * 
 * In accordance with Zero-Trust Multi-Tenancy and secure ledger design:
 * - All log records are immutable (enforced by Firestore Security Rules)
 * - Captures origin metadata (IP, User Agent, Tenant Isolation ID)
 * - Tracks previous and proposed values for key configuration shifts
 */
export class AuditLogService {
  private auditLogRepo: AuditLogRepository;

  constructor() {
    this.auditLogRepo = new AuditLogRepository();
  }

  /**
   * Logs a failed authentication attempt with contextual security metadata
   * to assist in brute-force detection and security analytics.
   */
  public async logFailedLogin(params: {
    email: string;
    reason: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const { email, reason, tenantId, ipAddress = 'UNKNOWN_IP', userAgent = 'UNKNOWN_USER_AGENT' } = params;

    const logPayload: Omit<EnterpriseAuditLog, 'id' | 'timestamp'> = {
      actorUid: 'UNAUTHENTICATED',
      actorEmail: email,
      action: 'IDENTITY_FAILED_LOGIN',
      resourcePath: '/auth/login',
      tenantId: tenantId || 'SYSTEM_GLOBAL',
      ipAddress,
      userAgent,
      oldValue: null,
      newValue: {
        attemptedEmail: email,
        failureReason: reason,
        severity: 'WARNING'
      }
    };

    await this.auditLogRepo.logSensitiveAction(logPayload);
  }

  /**
   * Logs administrative role overrides or privilege escalation events.
   * Extremely critical for system safety audits and change-management protocols.
   */
  public async logRoleChange(params: {
    actorUid: string;
    actorEmail: string;
    targetUid: string;
    targetEmail: string;
    oldRole: string;
    newRole: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const {
      actorUid,
      actorEmail,
      targetUid,
      targetEmail,
      oldRole,
      newRole,
      tenantId,
      ipAddress = 'UNKNOWN_IP',
      userAgent = 'UNKNOWN_USER_AGENT'
    } = params;

    const logPayload: Omit<EnterpriseAuditLog, 'id' | 'timestamp'> = {
      actorUid,
      actorEmail,
      action: 'SECURITY_ROLE_CHANGE',
      resourcePath: `/users/${targetUid}/role`,
      tenantId,
      ipAddress,
      userAgent,
      oldValue: {
        role: oldRole,
        targetEmail
      },
      newValue: {
        role: newRole,
        targetEmail,
        authorizedBy: actorEmail
      }
    };

    await this.auditLogRepo.logSensitiveAction(logPayload);
  }

  /**
   * Logs touchpoints on sensitive information (e.g., student PII, export requests,
   * invoice billing detail visibility). Ensures strict compliance alignment.
   */
  public async logSensitiveDataAccess(params: {
    actorUid: string;
    actorEmail: string;
    action: 'PII_VIEW' | 'SENSITIVE_EXPORT' | 'PAYMENT_LEDGER_ACCESS' | 'ACADEMIC_RECORD_EXPORT' | string;
    resourcePath: string;
    tenantId: string;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const {
      actorUid,
      actorEmail,
      action,
      resourcePath,
      tenantId,
      reason,
      ipAddress = 'UNKNOWN_IP',
      userAgent = 'UNKNOWN_USER_AGENT'
    } = params;

    const logPayload: Omit<EnterpriseAuditLog, 'id' | 'timestamp'> = {
      actorUid,
      actorEmail,
      action,
      resourcePath,
      tenantId,
      ipAddress,
      userAgent,
      oldValue: null,
      newValue: {
        accessJustification: reason,
        severity: 'INFO'
      }
    };

    await this.auditLogRepo.logSensitiveAction(logPayload);
  }

  /**
   * Logs a generic critical security event (e.g., MFA state toggle, API Key rotations, 
   * tenant-wide maintenance triggers, security exception events).
   */
  public async logSecurityEvent(params: {
    actorUid: string;
    actorEmail: string;
    action: 'MFA_ENABLED' | 'MFA_DISABLED' | 'API_KEY_ROTATED' | 'PASSWORD_RESET_TRIGGER' | 'MAINTENANCE_TOGGLE' | string;
    resourcePath: string;
    tenantId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const {
      actorUid,
      actorEmail,
      action,
      resourcePath,
      tenantId,
      oldValue = null,
      newValue = null,
      ipAddress = 'UNKNOWN_IP',
      userAgent = 'UNKNOWN_USER_AGENT'
    } = params;

    const logPayload: Omit<EnterpriseAuditLog, 'id' | 'timestamp'> = {
      actorUid,
      actorEmail,
      action,
      resourcePath,
      tenantId,
      ipAddress,
      userAgent,
      oldValue,
      newValue
    };

    await this.auditLogRepo.logSensitiveAction(logPayload);
  }
}
