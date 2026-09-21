import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface AdvancedBIPlatform {
  id: string;
  platform: 'domo' | 'qlikview' | 'sisense' | 'thoughtspot';
  name: string;
  apiKey: string;
  instanceUrl: string;
  status: 'connected' | 'disconnected' | 'error';
  datasetCount: number;
  lastSyncAt?: Date;
  createdAt: Date;
}

export interface DatasetMapping {
  id: string;
  sourceCollection: string;
  targetDataset: string;
  platform: string;
  columnMappings: Array<{
    sourceColumn: string;
    targetColumn: string;
    transformation?: string;
  }>;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  enabled: boolean;
  createdAt: Date;
}

export interface DashboardPublishing {
  id: string;
  dashboardName: string;
  platform: string;
  dashboardId: string;
  shareLink: string;
  accessLevel: 'public' | 'restricted' | 'team';
  viewCount: number;
  lastViewedAt?: Date;
  publishedAt: Date;
}

export interface EmbeddedAnalytics {
  id: string;
  containerId: string;
  dashboardId: string;
  platform: string;
  embedToken: string;
  expiresAt: Date;
  permissionsLevel: 'view' | 'edit' | 'admin';
  createdAt: Date;
}

export interface BIDataLineage {
  datasetId: string;
  sourceCollections: string[];
  transformations: Array<{
    step: number;
    operation: string;
    inputColumns: string[];
    outputColumns: string[];
  }>;
  lastUpdated: Date;
}

class AdvancedBIIntegrationService {
  private db: Firestore;

  constructor() {
    this.db = getFirestore();
    this.scheduleDatasetSync();
  }

  public async connectAdvancedBIPlatform(
    platform: 'domo' | 'qlikview' | 'sisense' | 'thoughtspot',
    name: string,
    apiKey: string,
    instanceUrl: string
  ): Promise<AdvancedBIPlatform> {
    try {
      const connectionId = `bi-${platform}-${Date.now()}`;

      const connection: AdvancedBIPlatform = {
        id: connectionId,
        platform,
        name,
        apiKey,
        instanceUrl,
        status: 'connected',
        datasetCount: 0,
        createdAt: new Date(),
      };

      await this.db
        .collection('advanced_bi_platforms')
        .doc(connectionId)
        .set(connection);

      logSecurityEvent(
        'ADVANCED_BI_CONNECTED' as any,
        'info' as any,
        `Connected to ${platform} BI platform: ${name}`,
        { platform, instanceUrl },
        { connectionId }
      );

      return connection;
    } catch (error: any) {
      console.error('Error connecting advanced BI platform:', error);
      throw error;
    }
  }

  public async createDatasetMapping(
    sourceCollection: string,
    targetDataset: string,
    platform: string,
    columnMappings: Array<any>,
    syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' = 'daily'
  ): Promise<DatasetMapping> {
    try {
      const mappingId = `mapping-${sourceCollection}-${Date.now()}`;

      const mapping: DatasetMapping = {
        id: mappingId,
        sourceCollection,
        targetDataset,
        platform,
        columnMappings,
        syncFrequency,
        enabled: true,
        createdAt: new Date(),
      };

      await this.db
        .collection('dataset_mappings')
        .doc(mappingId)
        .set(mapping);

      logSecurityEvent(
        'DATASET_MAPPING_CREATED' as any,
        'info' as any,
        `Dataset mapping created: ${sourceCollection} -> ${targetDataset}`,
        { sourceCollection, targetDataset, platform },
        { mappingId }
      );

      return mapping;
    } catch (error: any) {
      console.error('Error creating dataset mapping:', error);
      throw error;
    }
  }

  public async publishDashboard(
    platform: string,
    dashboardName: string,
    dashboardId: string,
    accessLevel: 'public' | 'restricted' | 'team' = 'restricted'
  ): Promise<DashboardPublishing> {
    try {
      const publishId = `pub-${dashboardId}-${Date.now()}`;
      const shareLink = this.generateShareLink(platform, dashboardId, accessLevel);

      const publishing: DashboardPublishing = {
        id: publishId,
        dashboardName,
        platform,
        dashboardId,
        shareLink,
        accessLevel,
        viewCount: 0,
        publishedAt: new Date(),
      };

      await this.db
        .collection('published_dashboards')
        .doc(publishId)
        .set(publishing);

      logSecurityEvent(
        'DASHBOARD_PUBLISHED' as any,
        'info' as any,
        `Dashboard published on ${platform}: ${dashboardName}`,
        { dashboardName, accessLevel },
        { publishId }
      );

      return publishing;
    } catch (error: any) {
      console.error('Error publishing dashboard:', error);
      throw error;
    }
  }

  public async createEmbeddedAnalytics(
    containerId: string,
    dashboardId: string,
    platform: string,
    permissionsLevel: 'view' | 'edit' | 'admin' = 'view'
  ): Promise<EmbeddedAnalytics> {
    try {
      const embedId = `embed-${dashboardId}-${Date.now()}`;
      const embedToken = this.generateEmbedToken(dashboardId, platform);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const embedded: EmbeddedAnalytics = {
        id: embedId,
        containerId,
        dashboardId,
        platform,
        embedToken,
        expiresAt,
        permissionsLevel,
        createdAt: new Date(),
      };

      await this.db
        .collection('embedded_analytics')
        .doc(embedId)
        .set(embedded);

      logSecurityEvent(
        'EMBEDDED_ANALYTICS_CREATED' as any,
        'info' as any,
        `Embedded analytics created for ${platform}`,
        { containerId, dashboardId, permissionsLevel },
        { embedId }
      );

      return embedded;
    } catch (error: any) {
      console.error('Error creating embedded analytics:', error);
      throw error;
    }
  }

  public async trackDashboardView(publishId: string): Promise<void> {
    try {
      const publishing = await this.db
        .collection('published_dashboards')
        .doc(publishId)
        .get();

      if (publishing.exists) {
        const data = publishing.data() as any;
        await this.db
          .collection('published_dashboards')
          .doc(publishId)
          .update({
            viewCount: (data.viewCount || 0) + 1,
            lastViewedAt: new Date(),
          });
      }
    } catch (error: any) {
      console.error('Error tracking dashboard view:', error);
    }
  }

  public async getDataLineage(datasetId: string): Promise<BIDataLineage> {
    try {
      const mapping = await this.db
        .collection('dataset_mappings')
        .where('targetDataset', '==', datasetId)
        .limit(1)
        .get();

      if (mapping.empty) {
        throw new Error(`Dataset mapping not found for ${datasetId}`);
      }

      const mappingData = mapping.docs[0].data() as any;

      const lineage: BIDataLineage = {
        datasetId,
        sourceCollections: [mappingData.sourceCollection],
        transformations: [
          {
            step: 1,
            operation: 'map_columns',
            inputColumns: mappingData.columnMappings.map((m: any) => m.sourceColumn),
            outputColumns: mappingData.columnMappings.map((m: any) => m.targetColumn),
          },
        ],
        lastUpdated: new Date(),
      };

      return lineage;
    } catch (error: any) {
      console.error('Error getting data lineage:', error);
      throw error;
    }
  }

  public async getAdvancedBIPlatforms(status?: string): Promise<AdvancedBIPlatform[]> {
    try {
      let query: any = this.db.collection('advanced_bi_platforms');

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastSyncAt: doc.data().lastSyncAt?.toDate?.() || undefined,
      } as AdvancedBIPlatform));
    } catch (error: any) {
      console.error('Error fetching advanced BI platforms:', error);
      return [];
    }
  }

  public async getPublishedDashboards(platform?: string, limit: number = 50): Promise<DashboardPublishing[]> {
    try {
      let query: any = this.db.collection('published_dashboards');

      if (platform) {
        query = query.where('platform', '==', platform);
      }

      const snapshot = await query
        .orderBy('publishedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate?.() || new Date(),
        lastViewedAt: doc.data().lastViewedAt?.toDate?.() || undefined,
      } as DashboardPublishing));
    } catch (error: any) {
      console.error('Error fetching published dashboards:', error);
      return [];
    }
  }

  public async refreshEmbedToken(embedId: string): Promise<string> {
    try {
      const embedded = await this.db
        .collection('embedded_analytics')
        .doc(embedId)
        .get();

      if (!embedded.exists) {
        throw new Error(`Embed ${embedId} not found`);
      }

      const data = embedded.data() as any;
      const newToken = this.generateEmbedToken(data.dashboardId, data.platform);
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.db
        .collection('embedded_analytics')
        .doc(embedId)
        .update({
          embedToken: newToken,
          expiresAt: newExpiry,
        });

      return newToken;
    } catch (error: any) {
      console.error('Error refreshing embed token:', error);
      throw error;
    }
  }

  private generateShareLink(platform: string, dashboardId: string, accessLevel: string): string {
    const baseUrls: Record<string, string> = {
      domo: 'https://lingolive.domo.com/dashboard',
      qlikview: 'https://lingolive.qlik.com/qvf',
      sisense: 'https://lingolive.sisense.com/app',
      thoughtspot: 'https://lingolive.thoughtspot.com/embed',
    };

    return `${baseUrls[platform] || baseUrls.domo}/${dashboardId}?access=${accessLevel}`;
  }

  private generateEmbedToken(dashboardId: string, platform: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${platform}-${dashboardId}-${timestamp}-${random}`;
  }

  private scheduleDatasetSync(): void {
    setInterval(async () => {
      try {
        const mappings = await this.db
          .collection('dataset_mappings')
          .where('enabled', '==', true)
          .get();

        for (const mappingDoc of mappings.docs) {
          const mapping = mappingDoc.data() as any;
          const shouldSync = this.shouldSyncNow(mapping.syncFrequency);

          if (shouldSync) {
            try {
              const data = await this.db
                .collection(mapping.sourceCollection)
                .limit(1000)
                .get();

              console.log(
                `Synced ${data.size} records from ${mapping.sourceCollection} to ${mapping.targetDataset}`
              );

              await mappingDoc.ref.update({
                lastSyncAt: new Date(),
              });
            } catch (error) {
              console.error(`Sync error for mapping ${mappingDoc.id}:`, error);
            }
          }
        }
      } catch (error: any) {
        console.error('Dataset sync scheduling error:', error);
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  private shouldSyncNow(frequency: string): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    switch (frequency) {
      case 'realtime':
        return true;
      case 'hourly':
        return Math.random() < 1 / 60; // ~once per hour on average
      case 'daily':
        return hour === 2; // 2 AM
      case 'weekly':
        return day === 0 && hour === 2; // Sunday 2 AM
      default:
        return false;
    }
  }
}

export const advancedBIIntegrationService = new AdvancedBIIntegrationService();
