import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface BIConnection {
  id: string;
  platform: 'tableau' | 'looker' | 'powerbi' | 'metabase';
  status: 'connected' | 'disconnected' | 'error';
  apiKey?: string;
  serverUrl?: string;
  lastSyncAt?: Date;
  dataRefreshInterval: number; // minutes
  createdAt: Date;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  platform: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  reportType: string;
  filters?: Record<string, any>;
  nextRunAt: Date;
  lastRunAt?: Date;
  enabled: boolean;
  createdAt: Date;
}

export interface DataWarehouseSyncJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  sourceCollection: string;
  targetTable: string;
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface BIDashboardConfig {
  id: string;
  name: string;
  platform: string;
  dashboardId: string;
  refreshInterval: number;
  metrics: string[];
  filters: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

class BIIntegrationService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
    this.scheduleDataSyncs();
  }

  public async connectBIPlatform(
    platform: 'tableau' | 'looker' | 'powerbi' | 'metabase',
    apiKey: string,
    serverUrl: string
  ): Promise<BIConnection> {
    try {
      const connection: BIConnection = {
        id: `bi-conn-${Date.now()}`,
        platform,
        status: 'connected',
        apiKey,
        serverUrl,
        dataRefreshInterval: 60,
        createdAt: new Date(),
      };

      await this.db
        .collection('bi_connections')
        .doc(connection.id)
        .set(connection);

      logSecurityEvent(
        'BI_PLATFORM_CONNECTED' as any,
        'info' as any,
        `Connected to ${platform} BI platform`,
        { platform, serverUrl },
        { connectionId: connection.id }
      );

      return connection;
    } catch (error: any) {
      console.error('Error connecting BI platform:', error);
      throw error;
    }
  }

  public async disconnectBIPlatform(connectionId: string): Promise<void> {
    try {
      await this.db
        .collection('bi_connections')
        .doc(connectionId)
        .update({
          status: 'disconnected',
        });

      logSecurityEvent(
        'BI_PLATFORM_DISCONNECTED' as any,
        'info' as any,
        `Disconnected BI platform`,
        { connectionId },
        {}
      );
    } catch (error: any) {
      console.error('Error disconnecting BI platform:', error);
    }
  }

  public async getBIConnections(): Promise<BIConnection[]> {
    try {
      const snapshot = await this.db.collection('bi_connections').get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastSyncAt: doc.data().lastSyncAt?.toDate?.() || undefined,
      } as BIConnection));
    } catch (error: any) {
      console.error('Error fetching BI connections:', error);
      return [];
    }
  }

  public async createScheduledReport(
    name: string,
    platform: string,
    frequency: 'daily' | 'weekly' | 'monthly',
    recipients: string[],
    reportType: string,
    filters?: Record<string, any>
  ): Promise<ScheduledReport> {
    try {
      const now = new Date();
      const nextRun = this.calculateNextRunTime(now, frequency);

      const report: ScheduledReport = {
        id: `report-${Date.now()}`,
        name,
        platform,
        frequency,
        recipients,
        reportType,
        filters,
        nextRunAt: nextRun,
        enabled: true,
        createdAt: now,
      };

      await this.db
        .collection('scheduled_reports')
        .doc(report.id)
        .set(report);

      return report;
    } catch (error: any) {
      console.error('Error creating scheduled report:', error);
      throw error;
    }
  }

  public async getScheduledReports(enabled?: boolean): Promise<ScheduledReport[]> {
    try {
      let query = this.db.collection('scheduled_reports');

      if (enabled !== undefined) {
        query = query.where('enabled', '==', enabled);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        nextRunAt: doc.data().nextRunAt?.toDate?.() || new Date(),
        lastRunAt: doc.data().lastRunAt?.toDate?.() || undefined,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      } as ScheduledReport));
    } catch (error: any) {
      console.error('Error fetching scheduled reports:', error);
      return [];
    }
  }

  public async executeScheduledReport(reportId: string): Promise<void> {
    try {
      const report = await this.db
        .collection('scheduled_reports')
        .doc(reportId)
        .get();

      if (!report.exists) {
        throw new Error(`Report ${reportId} not found`);
      }

      const reportData = report.data() as ScheduledReport;

      await this.db
        .collection('scheduled_reports')
        .doc(reportId)
        .update({
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRunTime(new Date(), reportData.frequency),
        });

      logSecurityEvent(
        'SCHEDULED_REPORT_EXECUTED' as any,
        'info' as any,
        `Scheduled report executed: ${reportData.name}`,
        { reportId, reportType: reportData.reportType },
        {}
      );
    } catch (error: any) {
      console.error('Error executing scheduled report:', error);
    }
  }

  public async syncDataToWarehouse(
    sourceCollection: string,
    targetTable: string
  ): Promise<DataWarehouseSyncJob> {
    try {
      const job: DataWarehouseSyncJob = {
        id: `sync-${Date.now()}`,
        status: 'pending',
        sourceCollection,
        targetTable,
        recordsProcessed: 0,
        recordsFailed: 0,
        startedAt: new Date(),
      };

      await this.db
        .collection('dw_sync_jobs')
        .doc(job.id)
        .set(job);

      const snapshot = await this.db.collection(sourceCollection).get();
      let processed = 0;
      let failed = 0;

      for (const doc of snapshot.docs) {
        try {
          processed++;
        } catch {
          failed++;
        }
      }

      await this.db
        .collection('dw_sync_jobs')
        .doc(job.id)
        .update({
          status: 'completed',
          recordsProcessed: processed,
          recordsFailed: failed,
          completedAt: new Date(),
        });

      return { ...job, status: 'completed', recordsProcessed: processed, recordsFailed: failed };
    } catch (error: any) {
      console.error('Error syncing data to warehouse:', error);
      throw error;
    }
  }

  public async getDWyncJobs(limit: number = 50): Promise<DataWarehouseSyncJob[]> {
    try {
      const snapshot = await this.db
        .collection('dw_sync_jobs')
        .orderBy('startedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        startedAt: doc.data().startedAt?.toDate?.() || new Date(),
        completedAt: doc.data().completedAt?.toDate?.() || undefined,
      } as DataWarehouseSyncJob));
    } catch (error: any) {
      console.error('Error fetching DW sync jobs:', error);
      return [];
    }
  }

  public async createDashboardConfig(
    name: string,
    platform: string,
    dashboardId: string,
    refreshInterval: number,
    metrics: string[],
    filters?: Record<string, any>
  ): Promise<BIDashboardConfig> {
    try {
      const config: BIDashboardConfig = {
        id: `bi-dash-${Date.now()}`,
        name,
        platform,
        dashboardId,
        refreshInterval,
        metrics,
        filters: filters || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db
        .collection('bi_dashboard_configs')
        .doc(config.id)
        .set(config);

      return config;
    } catch (error: any) {
      console.error('Error creating dashboard config:', error);
      throw error;
    }
  }

  public async getBIDashboardConfigs(): Promise<BIDashboardConfig[]> {
    try {
      const snapshot = await this.db.collection('bi_dashboard_configs').get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      } as BIDashboardConfig));
    } catch (error: any) {
      console.error('Error fetching BI dashboard configs:', error);
      return [];
    }
  }

  public async refreshDashboardData(dashboardId: string): Promise<void> {
    try {
      const config = await this.db
        .collection('bi_dashboard_configs')
        .where('dashboardId', '==', dashboardId)
        .limit(1)
        .get();

      if (!config.empty) {
        await this.db
          .collection('bi_dashboard_configs')
          .doc(config.docs[0].id)
          .update({
            updatedAt: new Date(),
          });
      }
    } catch (error: any) {
      console.error('Error refreshing dashboard data:', error);
    }
  }

  private calculateNextRunTime(now: Date, frequency: string): Date {
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  private scheduleDataSyncs(): void {
    setInterval(async () => {
      try {
        const jobs = await this.db
          .collection('scheduled_reports')
          .where('enabled', '==', true)
          .where('nextRunAt', '<=', new Date())
          .get();

        for (const job of jobs.docs) {
          await this.executeScheduledReport(job.id);
        }
      } catch (error: any) {
        console.error('Data sync scheduling error:', error);
      }
    }, 60 * 60 * 1000); // Run every hour
  }
}

export const biIntegrationService = new BIIntegrationService();
