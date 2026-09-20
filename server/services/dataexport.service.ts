import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logSecurityEvent } from './security.event.logger';
import crypto from 'crypto';

export type ExportFormat = 'json' | 'csv';

export interface DataExportRequest {
  id: string;
  userId: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dataTypes: DataType[];
  downloadUrl?: string;
  downloadExpiry?: Date;
  fileSize?: number;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  error?: string;
}

export type DataType =
  | 'profile'
  | 'learning-progress'
  | 'achievements'
  | 'vocabulary'
  | 'payment-history'
  | 'preferences'
  | 'activity-log'
  | 'all';

export interface ExportedData {
  profile: any;
  learningProgress: any;
  achievements: any;
  vocabulary: any;
  paymentHistory: any;
  preferences: any;
  activityLog: any;
  exportMetadata: {
    exportedAt: string;
    userId: string;
    dataTypes: DataType[];
  };
}

class DataExportService {
  private db: FirebaseFirestore.Firestore;
  private bucket: any;

  constructor() {
    this.db = getFirestore();
    this.bucket = getStorage().bucket();
  }

  public async requestExport(
    userId: string,
    format: ExportFormat = 'json',
    dataTypes: DataType[] = ['all']
  ): Promise<DataExportRequest> {
    const id = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const request: DataExportRequest = {
      id,
      userId,
      format,
      status: 'pending',
      dataTypes: dataTypes.length === 0 ? ['all'] : dataTypes,
      createdAt: now,
      expiresAt,
    };

    try {
      await this.db.collection('data_exports').doc(id).set(request);

      logSecurityEvent(
        'DATA_EXPORT_REQUESTED' as any,
        'info' as any,
        `User requested data export`,
        { userId },
        { exportId: id, format, dataTypes: dataTypes.length }
      );

      // Trigger async processing
      this.processExport(id).catch((err) => console.error('Export processing error:', err));

      return request;
    } catch (error: any) {
      logSecurityEvent(
        'DATA_EXPORT_REQUEST_FAILED' as any,
        'warning' as any,
        `Data export request failed: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  private async processExport(exportId: string): Promise<void> {
    try {
      const docRef = this.db.collection('data_exports').doc(exportId);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        console.error('Export request not found:', exportId);
        return;
      }

      const request = docSnapshot.data() as DataExportRequest;

      // Mark as processing
      await docRef.update({ status: 'processing' });

      // Collect data
      const exportData = await this.collectUserData(
        request.userId,
        request.dataTypes
      );

      // Generate file
      const fileName = `user-data-export-${request.userId}-${Date.now()}.${request.format === 'json' ? 'json' : 'csv'}`;
      const fileContent = request.format === 'json'
        ? JSON.stringify(exportData, null, 2)
        : this.convertToCSV(exportData);

      // Upload to storage
      const filePath = `exports/${request.userId}/${fileName}`;
      const file = this.bucket.file(filePath);

      await file.save(fileContent, {
        contentType: request.format === 'json' ? 'application/json' : 'text/csv',
        public: false,
      });

      // Generate signed URL (7 day expiry)
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      // Update request with download info
      await docRef.update({
        status: 'completed',
        downloadUrl: url,
        downloadExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        fileSize: Buffer.byteLength(fileContent),
        completedAt: new Date(),
      });

      logSecurityEvent(
        'DATA_EXPORT_COMPLETED' as any,
        'info' as any,
        `Data export completed`,
        { userId: request.userId },
        { exportId, fileSize: Buffer.byteLength(fileContent) }
      );
    } catch (error: any) {
      console.error('Export processing failed:', error);

      try {
        await this.db.collection('data_exports').doc(exportId).update({
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        });
      } catch (updateErr) {
        console.error('Failed to update export status:', updateErr);
      }

      logSecurityEvent(
        'DATA_EXPORT_FAILED' as any,
        'error' as any,
        `Data export failed: ${error.message}`,
        {},
        { exportId, error: error.message }
      );
    }
  }

  private async collectUserData(userId: string, dataTypes: DataType[]): Promise<ExportedData> {
    const includeAll = dataTypes.includes('all');

    const data: ExportedData = {
      profile: null as any,
      learningProgress: null as any,
      achievements: null as any,
      vocabulary: null as any,
      paymentHistory: null as any,
      preferences: null as any,
      activityLog: null as any,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        userId,
        dataTypes,
      },
    };

    try {
      // Profile
      if (includeAll || dataTypes.includes('profile')) {
        const userDoc = await this.db.collection('users').doc(userId).get();
        data.profile = userDoc.exists ? userDoc.data() : null;
      }

      // Learning Progress
      if (includeAll || dataTypes.includes('learning-progress')) {
        const lessonsSnapshot = await this.db
          .collection('users')
          .doc(userId)
          .collection('lessons')
          .get();
        data.learningProgress = lessonsSnapshot.docs.map((doc) => doc.data());
      }

      // Achievements
      if (includeAll || dataTypes.includes('achievements')) {
        const achievementsDoc = await this.db.collection('user_achievements').doc(userId).get();
        data.achievements = achievementsDoc.exists ? achievementsDoc.data() : null;
      }

      // Vocabulary
      if (includeAll || dataTypes.includes('vocabulary')) {
        const vocabSnapshot = await this.db
          .collection('users')
          .doc(userId)
          .collection('vocabulary')
          .get();
        data.vocabulary = vocabSnapshot.docs.map((doc) => doc.data());
      }

      // Payment History
      if (includeAll || dataTypes.includes('payment-history')) {
        const paymentsSnapshot = await this.db
          .collection('payment_history')
          .where('userId', '==', userId)
          .get();
        data.paymentHistory = paymentsSnapshot.docs.map((doc) => doc.data());
      }

      // Preferences
      if (includeAll || dataTypes.includes('preferences')) {
        const prefsDoc = await this.db.collection('user_preferences').doc(userId).get();
        data.preferences = prefsDoc.exists ? prefsDoc.data() : null;
      }

      // Activity Log
      if (includeAll || dataTypes.includes('activity-log')) {
        const logsSnapshot = await this.db
          .collection('security_events')
          .where('userId', '==', userId)
          .limit(1000)
          .get();
        data.activityLog = logsSnapshot.docs.map((doc) => doc.data());
      }
    } catch (error: any) {
      console.error('Error collecting user data:', error);
      throw error;
    }

    return data;
  }

  private convertToCSV(data: ExportedData): string {
    const rows: string[] = [];

    // Profile section
    if (data.profile) {
      rows.push('PROFILE');
      Object.entries(data.profile).forEach(([key, value]) => {
        rows.push(`${key},${JSON.stringify(value)}`);
      });
      rows.push('');
    }

    // Learning progress section
    if (data.learningProgress && Array.isArray(data.learningProgress)) {
      rows.push('LEARNING_PROGRESS');
      rows.push('lessonId,completedAt,durationMinutes,score');
      data.learningProgress.forEach((lesson: any) => {
        rows.push(`${lesson.id},${lesson.completedAt},${lesson.durationMinutes},${lesson.score}`);
      });
      rows.push('');
    }

    // Payment history section
    if (data.paymentHistory && Array.isArray(data.paymentHistory)) {
      rows.push('PAYMENT_HISTORY');
      rows.push('date,amount,currency,status,type');
      data.paymentHistory.forEach((payment: any) => {
        rows.push(`${payment.timestamp},${payment.amount},${payment.currency},${payment.status},${payment.type}`);
      });
      rows.push('');
    }

    // Metadata
    rows.push('EXPORT_METADATA');
    rows.push(`Exported At,${data.exportMetadata.exportedAt}`);
    rows.push(`Data Types,${data.exportMetadata.dataTypes.join(',')}`);

    return rows.join('\n');
  }

  public async getExportRequest(exportId: string): Promise<DataExportRequest | null> {
    try {
      const docSnapshot = await this.db.collection('data_exports').doc(exportId).get();
      return docSnapshot.exists ? (docSnapshot.data() as DataExportRequest) : null;
    } catch (error: any) {
      console.error('Error fetching export request:', error);
      return null;
    }
  }

  public async getUserExports(userId: string, limit: number = 50): Promise<DataExportRequest[]> {
    try {
      const snapshot = await this.db
        .collection('data_exports')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as DataExportRequest);
    } catch (error: any) {
      console.error('Error fetching user exports:', error);
      return [];
    }
  }

  public async deleteUserData(userId: string): Promise<void> {
    try {
      // Delete user profile
      await this.db.collection('users').doc(userId).delete();

      // Delete subcollections
      const subcollections = ['lessons', 'vocabulary', 'messages', 'notebook'];
      for (const subcol of subcollections) {
        const snapshot = await this.db.collection('users').doc(userId).collection(subcol).get();
        const batch = this.db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      // Delete related documents
      await this.db.collection('user_achievements').doc(userId).delete();
      await this.db.collection('user_preferences').doc(userId).delete();

      // Delete payment history
      const paymentsSnapshot = await this.db
        .collection('payment_history')
        .where('userId', '==', userId)
        .get();
      const batch = this.db.batch();
      paymentsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      logSecurityEvent(
        'USER_DATA_DELETED' as any,
        'warning' as any,
        `User data deleted per GDPR request`,
        { userId },
        {}
      );
    } catch (error: any) {
      logSecurityEvent(
        'USER_DATA_DELETION_FAILED' as any,
        'error' as any,
        `User data deletion failed: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async getStats(): Promise<{
    totalExports: number;
    completedExports: number;
    failedExports: number;
    totalDataExported: number;
  }> {
    try {
      const snapshot = await this.db.collection('data_exports').get();

      let completed = 0;
      let failed = 0;
      let totalSize = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as DataExportRequest;
        if (data.status === 'completed') {
          completed++;
          totalSize += data.fileSize || 0;
        } else if (data.status === 'failed') {
          failed++;
        }
      });

      return {
        totalExports: snapshot.size,
        completedExports: completed,
        failedExports: failed,
        totalDataExported: totalSize,
      };
    } catch (error: any) {
      console.error('Error fetching export stats:', error);
      return {
        totalExports: 0,
        completedExports: 0,
        failedExports: 0,
        totalDataExported: 0,
      };
    }
  }

  public async cleanupExpiredExports(): Promise<number> {
    try {
      const now = new Date();
      const snapshot = await this.db
        .collection('data_exports')
        .where('expiresAt', '<', now)
        .get();

      let deletedCount = 0;
      const batch = this.db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`Cleaned up ${deletedCount} expired exports`);
      }

      return deletedCount;
    } catch (error: any) {
      console.error('Error cleaning up exports:', error);
      return 0;
    }
  }
}

export const dataExportService = new DataExportService();
