import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logSecurityEvent } from './security.event.logger';

export interface DataExport {
  userId: string;
  exportedAt: Date;
  format: 'json' | 'csv';
  status: 'pending' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  targetUserId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  status: 'success' | 'failure';
}

export interface ComplianceReport {
  reportDate: Date;
  totalDataExports: number;
  gdprRequests: number;
  deletionRequests: number;
  suspensions: number;
  securityIncidents: number;
}

class ComplianceService {
  private db: FirebaseFirestore.Firestore;
  private auth: ReturnType<typeof getAuth>;

  constructor() {
    this.db = getFirestore();
    this.auth = getAuth();
  }

  public async requestDataExport(userId: string): Promise<DataExport> {
    try {
      const export_id = `export-${userId}-${Date.now()}`;

      const dataExport: DataExport = {
        userId,
        exportedAt: new Date(),
        format: 'json',
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      await this.db
        .collection('data_exports')
        .doc(export_id)
        .set(dataExport);

      logSecurityEvent(
        'DATA_EXPORT_REQUESTED' as any,
        'info' as any,
        `User requested data export (GDPR)`,
        { userId },
        { exportId: export_id }
      );

      return dataExport;
    } catch (error: any) {
      console.error('Error requesting data export:', error);
      throw error;
    }
  }

  public async completeDataExport(
    userId: string,
    exportId: string,
    data: Record<string, any>
  ): Promise<string> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `user-data-${userId}-${Date.now()}.json`;
      const downloadUrl = `/api/compliance/exports/${exportId}`;

      await this.db
        .collection('data_exports')
        .doc(exportId)
        .update({
          status: 'completed',
          downloadUrl,
          dataHash: this.hashData(jsonString),
        });

      logSecurityEvent(
        'DATA_EXPORT_COMPLETED' as any,
        'info' as any,
        `Data export completed for user`,
        { userId, exportId },
        { fileName }
      );

      return downloadUrl;
    } catch (error: any) {
      console.error('Error completing data export:', error);
      throw error;
    }
  }

  public async requestAccountDeletion(userId: string, reason: string): Promise<void> {
    try {
      const deletion_id = `deletion-${userId}-${Date.now()}`;

      await this.db
        .collection('deletion_requests')
        .doc(deletion_id)
        .set({
          userId,
          reason,
          requestedAt: new Date(),
          status: 'pending',
          executesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 day grace period
        });

      logSecurityEvent(
        'ACCOUNT_DELETION_REQUESTED' as any,
        'warning' as any,
        `User requested account deletion`,
        { userId, reason },
        { deletionId: deletion_id }
      );
    } catch (error: any) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  }

  public async executeAccountDeletion(userId: string): Promise<void> {
    try {
      await this.auth.deleteUser(userId);

      const collections = [
        'users',
        'user_events',
        'user_insights',
        'skill_mastery',
        'engagement_metrics',
        'subscription',
      ];

      for (const collection of collections) {
        const snapshot = await this.db
          .collection(collection)
          .where('userId', '==', userId)
          .get();

        const batch = this.db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      logSecurityEvent(
        'ACCOUNT_DELETED' as any,
        'warning' as any,
        `Account completely deleted (right to be forgotten)`,
        { userId },
        {}
      );
    } catch (error: any) {
      console.error('Error executing account deletion:', error);
      throw error;
    }
  }

  public async logAuditEvent(
    action: string,
    userId: string,
    targetUserId: string | null,
    details: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    try {
      const auditLog: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        timestamp: new Date(),
        action,
        userId,
        targetUserId: targetUserId || undefined,
        details,
        ipAddress,
        status: 'success',
      };

      await this.db
        .collection('audit_logs')
        .doc(auditLog.id)
        .set(auditLog);
    } catch (error: any) {
      console.error('Error logging audit event:', error);
    }
  }

  public async getAuditLog(
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await this.db
        .collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      } as AuditLogEntry));
    } catch (error: any) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }

  public async getComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    try {
      const exports = await this.db
        .collection('data_exports')
        .where('exportedAt', '>=', startDate)
        .where('exportedAt', '<=', endDate)
        .get();

      const deletions = await this.db
        .collection('deletion_requests')
        .where('requestedAt', '>=', startDate)
        .where('requestedAt', '<=', endDate)
        .get();

      const auditLogs = await this.db
        .collection('audit_logs')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const suspensions = auditLogs.docs
        .filter((d) => d.data().action === 'user_suspended').length;
      const securityIncidents = auditLogs.docs
        .filter((d) => d.data().action === 'security_incident').length;

      const report: ComplianceReport = {
        reportDate: new Date(),
        totalDataExports: exports.size,
        gdprRequests: exports.size + deletions.size,
        deletionRequests: deletions.size,
        suspensions,
        securityIncidents,
      };

      return report;
    } catch (error: any) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  public async getUserDataSummary(userId: string): Promise<Record<string, any>> {
    try {
      const user = await this.db.collection('users').doc(userId).get();
      const events = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .get();
      const insights = await this.db
        .collection('user_insights')
        .where('userId', '==', userId)
        .get();
      const subscriptions = await this.db
        .collection('subscriptions')
        .doc(userId)
        .get();

      return {
        profile: user.data(),
        eventCount: events.size,
        insightCount: insights.size,
        subscription: subscriptions.data(),
        totalDataSize: JSON.stringify({
          profile: user.data(),
          events: events.docs.map((d) => d.data()),
          insights: insights.docs.map((d) => d.data()),
          subscription: subscriptions.data(),
        }).length,
      };
    } catch (error: any) {
      console.error('Error summarizing user data:', error);
      return {};
    }
  }

  public async verifyDataIntegrity(userId: string): Promise<{
    integrityScore: number;
    issues: string[];
    lastVerified: Date;
  }> {
    try {
      const issues: string[] = [];
      const user = await this.db.collection('users').doc(userId).get();

      if (!user.exists) {
        issues.push('User profile not found');
      }

      const subscriptions = await this.db
        .collection('subscriptions')
        .doc(userId)
        .get();

      if (!subscriptions.exists) {
        issues.push('Subscription record missing');
      }

      let integrityScore = 100;
      integrityScore -= issues.length * 20;

      return {
        integrityScore: Math.max(0, integrityScore),
        issues,
        lastVerified: new Date(),
      };
    } catch (error: any) {
      console.error('Error verifying data integrity:', error);
      return { integrityScore: 0, issues: ['Verification failed'], lastVerified: new Date() };
    }
  }

  private hashData(data: string): string {
    return require('crypto')
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
}

export const complianceService = new ComplianceService();
