import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface ReportTemplate {
  templateId: string;
  templateName: string;
  description: string;
  category: 'performance' | 'engagement' | 'progress' | 'cohort' | 'custom';
  sections: ReportSection[];
  defaultMetrics: string[];
  createdAt: Date;
}

export interface ReportSection {
  sectionId: string;
  sectionName: string;
  sectionType: 'summary' | 'metrics' | 'chart' | 'insights' | 'recommendations';
  isRequired: boolean;
  configuration: Record<string, any>;
}

export interface CustomReport {
  reportId: string;
  userId: string;
  reportName: string;
  templateId: string;
  dateRange: { startDate: Date; endDate: Date };
  metrics: string[];
  filters: Record<string, any>;
  generatedAt: Date;
  lastUpdated: Date;
  status: 'draft' | 'completed' | 'scheduled' | 'archived';
  visibility: 'private' | 'shared' | 'public';
}

export interface ScheduledReport {
  scheduledReportId: string;
  userId: string;
  reportName: string;
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  lastExecuted: Date;
  nextExecution: Date;
  enabled: boolean;
  createdAt: Date;
}

export interface ReportExport {
  exportId: string;
  reportId: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ReportShare {
  shareId: string;
  reportId: string;
  sharedBy: string;
  sharedWith: string[];
  shareType: 'view' | 'edit' | 'comment';
  expiresAt?: Date;
  createdAt: Date;
}

export interface ReportAnalytics {
  analyticsId: string;
  reportId: string;
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  lastViewed: Date;
  mostViewedSection: string;
  averageViewDuration: number;
}

class CustomReportBuilderService {
  private db = getFirestore();

  async getReportTemplates(): Promise<ReportTemplate[]> {
    try {
      const query = await this.db.collection('report_templates').get();
      const templates = query.docs.map((doc) => doc.data() as ReportTemplate);

      logSecurityEvent('TEMPLATES_RETRIEVED' as any, 'info' as any, 'Report templates retrieved', {
        templateCount: templates.length,
      });

      return templates;
    } catch (error) {
      logSecurityEvent('TEMPLATES_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve templates', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createCustomReport(
    userId: string,
    reportName: string,
    templateId: string,
    metrics: string[],
    filters: Record<string, any>,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<CustomReport> {
    try {
      const reportId = `report_${userId}_${Date.now()}`;

      const report: CustomReport = {
        reportId,
        userId,
        reportName,
        templateId,
        dateRange,
        metrics,
        filters,
        generatedAt: new Date(),
        lastUpdated: new Date(),
        status: 'completed',
        visibility: 'private',
      };

      await this.db.collection('custom_reports').doc(reportId).set(report);

      logSecurityEvent('CUSTOM_REPORT_CREATED' as any, 'info' as any, 'Custom report created', {
        reportId,
        userId,
        reportName,
        metricCount: metrics.length,
      });

      return report;
    } catch (error) {
      logSecurityEvent('CUSTOM_REPORT_CREATION_FAILED' as any, 'error' as any, 'Failed to create custom report', {
        userId,
        reportName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async scheduleReport(
    userId: string,
    reportName: string,
    templateId: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    recipients: string[]
  ): Promise<ScheduledReport> {
    try {
      const scheduledReportId = `scheduled_${userId}_${Date.now()}`;

      const nextExecution = this.calculateNextExecution(frequency);

      const scheduledReport: ScheduledReport = {
        scheduledReportId,
        userId,
        reportName,
        templateId,
        frequency,
        recipients,
        lastExecuted: new Date(),
        nextExecution,
        enabled: true,
        createdAt: new Date(),
      };

      await this.db.collection('scheduled_reports').doc(scheduledReportId).set(scheduledReport);

      logSecurityEvent('REPORT_SCHEDULED' as any, 'info' as any, 'Report scheduled', {
        scheduledReportId,
        userId,
        frequency,
        recipientCount: recipients.length,
      });

      return scheduledReport;
    } catch (error) {
      logSecurityEvent('REPORT_SCHEDULING_FAILED' as any, 'error' as any, 'Failed to schedule report', {
        userId,
        reportName,
        frequency,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv' | 'json'): Promise<ReportExport> {
    try {
      const exportId = `export_${reportId}_${Date.now()}`;
      const fileName = `report_${reportId}_${new Date().toISOString().split('T')[0]}.${this.getFileExtension(format)}`;

      const export_record: ReportExport = {
        exportId,
        reportId,
        format,
        fileName,
        fileSize: 0,
        downloadUrl: `/api/analytics/reports/${reportId}/download/${exportId}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      await this.db.collection('report_exports').doc(exportId).set(export_record);

      logSecurityEvent('REPORT_EXPORTED' as any, 'info' as any, 'Report exported', {
        exportId,
        reportId,
        format,
        fileName,
      });

      return export_record;
    } catch (error) {
      logSecurityEvent('REPORT_EXPORT_FAILED' as any, 'error' as any, 'Failed to export report', {
        reportId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async shareReport(reportId: string, sharedBy: string, sharedWith: string[], shareType: 'view' | 'edit' | 'comment'): Promise<ReportShare> {
    try {
      const shareId = `share_${reportId}_${Date.now()}`;

      const share: ReportShare = {
        shareId,
        reportId,
        sharedBy,
        sharedWith,
        shareType,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      await this.db.collection('report_shares').doc(shareId).set(share);

      logSecurityEvent('REPORT_SHARED' as any, 'info' as any, 'Report shared', {
        shareId,
        reportId,
        sharedWith: sharedWith.length,
        shareType,
      });

      return share;
    } catch (error) {
      logSecurityEvent('REPORT_SHARING_FAILED' as any, 'error' as any, 'Failed to share report', {
        reportId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordReportView(reportId: string, userId: string, sectionId?: string): Promise<ReportAnalytics> {
    try {
      const analyticsQuery = await this.db.collection('report_analytics').where('reportId', '==', reportId).limit(1).get();

      let analytics: ReportAnalytics;

      if (analyticsQuery.empty) {
        const analyticsId = `analytics_${reportId}_${Date.now()}`;
        analytics = {
          analyticsId,
          reportId,
          viewCount: 1,
          downloadCount: 0,
          shareCount: 0,
          lastViewed: new Date(),
          mostViewedSection: sectionId || '',
          averageViewDuration: 0,
        };
        await this.db.collection('report_analytics').doc(analyticsId).set(analytics);
      } else {
        const doc = analyticsQuery.docs[0];
        const existingAnalytics = doc.data() as ReportAnalytics;
        analytics = {
          ...existingAnalytics,
          viewCount: existingAnalytics.viewCount + 1,
          lastViewed: new Date(),
          mostViewedSection: sectionId || existingAnalytics.mostViewedSection,
        };
        await doc.ref.update(analytics);
      }

      logSecurityEvent('REPORT_VIEW_RECORDED' as any, 'info' as any, 'Report view recorded', {
        reportId,
        userId,
        viewCount: analytics.viewCount,
      });

      return analytics;
    } catch (error) {
      logSecurityEvent('REPORT_VIEW_RECORDING_FAILED' as any, 'error' as any, 'Failed to record report view', {
        reportId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getUserReports(userId: string): Promise<CustomReport[]> {
    try {
      const query = await this.db.collection('custom_reports').where('userId', '==', userId).get();

      const reports = query.docs.map((doc) => doc.data() as CustomReport);

      logSecurityEvent('USER_REPORTS_RETRIEVED' as any, 'info' as any, 'User reports retrieved', {
        userId,
        reportCount: reports.length,
      });

      return reports;
    } catch (error) {
      logSecurityEvent('USER_REPORTS_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve user reports', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updateReportVisibility(reportId: string, visibility: 'private' | 'shared' | 'public'): Promise<CustomReport> {
    try {
      const reportDoc = await this.db.collection('custom_reports').doc(reportId).get();
      const report = reportDoc.data() as CustomReport;

      if (!report) throw new Error('Report not found');

      const updatedReport = { ...report, visibility, lastUpdated: new Date() };
      await reportDoc.ref.update(updatedReport);

      logSecurityEvent('REPORT_VISIBILITY_UPDATED' as any, 'info' as any, 'Report visibility updated', {
        reportId,
        visibility,
      });

      return updatedReport;
    } catch (error) {
      logSecurityEvent('REPORT_VISIBILITY_UPDATE_FAILED' as any, 'error' as any, 'Failed to update report visibility', {
        reportId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private calculateNextExecution(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  private getFileExtension(format: string): string {
    switch (format) {
      case 'pdf':
        return 'pdf';
      case 'excel':
        return 'xlsx';
      case 'csv':
        return 'csv';
      case 'json':
        return 'json';
      default:
        return 'pdf';
    }
  }
}

export const customReportBuilderService = new CustomReportBuilderService();
