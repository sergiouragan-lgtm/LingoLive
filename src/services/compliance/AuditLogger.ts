import { collection, addDoc, query, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { hipaaCompliance, StudentPHIMetadata } from './HIPAACompliance';

/**
 * ISO 27001 Audit Log Severity levels.
 */
export enum AuditSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Types of activities that require auditing per ISO 27001:2022 Control A.8.12 & A.9.4.
 */
export enum AuditActionType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  SENSITIVE_READ = 'SENSITIVE_READ',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  PRIVILEGE_CHANGE = 'PRIVILEGE_CHANGE',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
  FAILOVER_TRIGGER = 'FAILOVER_TRIGGER',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  EXPORT_DATA = 'EXPORT_DATA',
  API_DEPRECATION_WARNING = 'API_DEPRECATION_WARNING',
}

/**
 * Interface representing a structured ISO 27001 compliant audit log entry.
 */
export interface AuditLogEntry {
  id?: string;
  timestamp: string;               // ISO-8601 string
  actor: {
    uid: string | null;            // User ID
    email: string | null;          // User Email
    role: string | null;           // User Role (Admin, Educator, Student, etc.)
  };
  action: AuditActionType;         // The audit action category
  description: string;             // Human readable summary
  resource: {
    type: string;                  // e.g. "users", "classes", "payment", "backup"
    id?: string;                   // Specific identifier
    path?: string;                 // Collection/document path
  };
  severity: AuditSeverity;         // Severity classification
  status: 'SUCCESS' | 'FAILURE';   // Outcome of operation
  metadata: {
    userAgent: string;             // Browser context
    ipAddress?: string;            // Client IP or location summary
    failureReason?: string;        // Details of failure if status === FAILURE
    payloadSnippet?: any;          // Non-sensitive data context (no plain secrets)
    isoControls?: string[];        // Array of corresponding ISO 27001 controls (e.g. ['A.9.4.1'])
  };
}

class AuditLoggerService {
  private collectionName = 'admin_logs';

  /**
   * Logs an event to the persistent Firestore audit database.
   * Ensures write-once compliance (updates/deletions on these collections are rejected by firestore.rules).
   */
  public async log(params: {
    action: AuditActionType;
    description: string;
    resource: { type: string; id?: string; path?: string };
    severity?: AuditSeverity;
    status?: 'SUCCESS' | 'FAILURE';
    failureReason?: string;
    payloadSnippet?: any;
    isoControls?: string[];
  }): Promise<string | null> {
    const currentUser = auth.currentUser;
    const timestamp = new Date().toISOString();

    // Default ISO control mappings for audit assistance
    const defaultControls: Record<AuditActionType, string[]> = {
      [AuditActionType.USER_LOGIN]: ['A.9.2.4', 'A.9.4.2'],
      [AuditActionType.USER_LOGOUT]: ['A.9.2.4'],
      [AuditActionType.SENSITIVE_READ]: ['A.9.4.1'],
      [AuditActionType.DATA_CREATE]: ['A.9.4.1', 'A.18.1.3'],
      [AuditActionType.DATA_UPDATE]: ['A.9.4.1', 'A.18.1.3'],
      [AuditActionType.DATA_DELETE]: ['A.9.4.1', 'A.18.1.3'],
      [AuditActionType.PRIVILEGE_CHANGE]: ['A.9.1.1', 'A.9.2.3'],
      [AuditActionType.BACKUP_RESTORE]: ['A.12.3.1', 'A.18.1.3'],
      [AuditActionType.FAILOVER_TRIGGER]: ['A.17.1.2', 'A.17.2.1'],
      [AuditActionType.SECURITY_VIOLATION]: ['A.12.4.1', 'A.16.1.1'],
      [AuditActionType.EXPORT_DATA]: ['A.9.4.1', 'A.18.1.3'],
      [AuditActionType.API_DEPRECATION_WARNING]: ['A.12.5.1', 'A.18.1.3'],
    };

    const combinedControls = Array.from(
      new Set([
        ...(params.isoControls || []),
        ...(defaultControls[params.action] || [])
      ])
    );

    const logEntry: AuditLogEntry = {
      timestamp,
      actor: {
        uid: currentUser?.uid || 'anonymous',
        email: currentUser?.email || 'anonymous@lingolive.ai',
        role: (currentUser as any)?.role || 'guest',
      },
      action: params.action,
      description: params.description,
      resource: params.resource,
      severity: params.severity || AuditSeverity.INFO,
      status: params.status || 'SUCCESS',
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js/Server Environment',
        ipAddress: 'Preview Sandbox Gateway',
        failureReason: params.failureReason,
        payloadSnippet: params.payloadSnippet,
        isoControls: combinedControls,
      },
    };

    try {
      // Direct console mirror for developer diagnostics
      const consoleMethod = 
        logEntry.severity === AuditSeverity.CRITICAL || logEntry.severity === AuditSeverity.HIGH
          ? 'error' 
          : logEntry.severity === AuditSeverity.MEDIUM 
          ? 'warn' 
          : 'log';
      
      console[consoleMethod](
        `[AUDIT] [${logEntry.severity}] [${logEntry.action}] ${logEntry.description}`, 
        JSON.stringify(logEntry)
      );

      // Persist directly into standard 'admin_logs' collection for real-time visualization and ISO compliance
      const docRef = await addDoc(collection(db, this.collectionName), {
        // Flat compatibility with the current AdminDashboard schema
        adminEmail: logEntry.actor.email || 'system-governance@lingolive.ai',
        action: `${logEntry.action}: ${logEntry.description} [Status: ${logEntry.status}] [Controls: ${combinedControls.join(', ')}]`,
        timestamp,
        // Detailed compliance structure in the metadata object
        compliance: logEntry
      });

      return docRef.id;
    } catch (error) {
      console.error('[AUDIT_FATAL] Failed to write audit log entry to Firestore:', error);
      return null;
    }
  }

  /**
   * Specifically logs sensitive reader access to compliant databases (A.9.4.1).
   */
  public async logSensitiveRead(resourceType: string, resourceId: string, description: string): Promise<void> {
    await this.log({
      action: AuditActionType.SENSITIVE_READ,
      description,
      resource: { type: resourceType, id: resourceId },
      severity: AuditSeverity.LOW,
      status: 'SUCCESS'
    });
  }

  /**
   * Specifically logs authentication events.
   */
  public async logAuth(email: string, action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_RESET', status: 'SUCCESS' | 'FAILURE', reason?: string): Promise<void> {
    await this.log({
      action: action === 'LOGIN' ? AuditActionType.USER_LOGIN : AuditActionType.USER_LOGOUT,
      description: `Autenticação do utilizador (${email}): ${action}`,
      resource: { type: 'authentication', id: email },
      severity: status === 'FAILURE' ? AuditSeverity.MEDIUM : AuditSeverity.INFO,
      status,
      failureReason: reason
    });
  }

  /**
   * Logs an action involving Protected Health Information (PHI) with HIPAA safeguards.
   * Automatically verifies access attributes and anonymizes sensitive data before storage.
   */
  public async logPHIOperation(
    action: AuditActionType,
    description: string,
    studentPHI: StudentPHIMetadata,
    status: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
    failureReason?: string
  ): Promise<string | null> {
    const currentUser = auth.currentUser;
    const actor = {
      email: currentUser?.email || 'anonymous@lingolive.ai',
      role: (currentUser as any)?.role || 'guest',
    };

    // 1. Enforce attribute-based HIPAA authorization check
    const authResult = hipaaCompliance.verifyPHIAccess(actor);
    let finalStatus = status;
    let finalReason = failureReason;

    if (!authResult.authorized) {
      finalStatus = 'FAILURE';
      finalReason = finalReason || authResult.reason;
    }

    // 2. Perform HIPAA de-identification on the PHI payload before archiving in logs
    const sanitizedPHI = hipaaCompliance.deIdentifyPHI(studentPHI);

    // 3. Log securely to the database
    return this.log({
      action,
      description: `${description} [HIPAA Enforced: de_identified=${sanitizedPHI.deIdentified}]`,
      resource: {
        type: 'student_phi',
        id: sanitizedPHI.hashId,
      },
      severity: finalStatus === 'FAILURE' ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      status: finalStatus,
      failureReason: finalReason,
      payloadSnippet: sanitizedPHI,
      isoControls: ['A.9.4.1', 'A.18.1.3', 'HIPAA_164.312', 'HIPAA_164.514'],
    });
  }

  /**
   * Retrieve compliance audit logs from the firestore cluster.
   */
  public async fetchAuditLogs(options?: {
    pageSize?: number;
    startAfterDoc?: QueryDocumentSnapshot;
  }): Promise<{ logs: AuditLogEntry[]; lastDoc: QueryDocumentSnapshot | null }> {
    const size = options?.pageSize || 20;
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(size)
      );

      if (options?.startAfterDoc) {
        q = query(
          collection(db, this.collectionName),
          orderBy('timestamp', 'desc'),
          startAfter(options.startAfterDoc),
          limit(size)
        );
      }

      const snap = await getDocs(q);
      const logs: AuditLogEntry[] = [];
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data.compliance) {
          logs.push({
            id: doc.id,
            ...data.compliance
          });
        } else {
          // Fallback parsing for existing non-compliance schema logs
          logs.push({
            id: doc.id,
            timestamp: data.timestamp || new Date().toISOString(),
            actor: {
              uid: 'legacy',
              email: data.adminEmail || 'admin@lingolive.ai',
              role: 'Admin'
            },
            action: AuditActionType.DATA_UPDATE,
            description: data.action || 'Ação legada não categorizada',
            resource: { type: 'system' },
            severity: AuditSeverity.INFO,
            status: 'SUCCESS',
            metadata: {
              userAgent: 'Legacy Logs Importer',
              isoControls: ['A.12.4.1']
            }
          });
        }
      });

      const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return { logs, lastDoc };
    } catch (error) {
      console.error('[AUDIT_SERVICE] Error fetching audit logs:', error);
      return { logs: [], lastDoc: null };
    }
  }
}

export const auditLogger = new AuditLoggerService();
