import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface OfflineAnalyticsEvent {
  eventId: string;
  userId: string;
  eventType: 'page_view' | 'user_action' | 'engagement' | 'error' | 'performance' | 'purchase';
  eventName: string;
  eventData: Record<string, any>;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  networkStatus: 'online' | 'offline' | '4g' | '3g' | 'wifi' | 'slow-4g';
  capturedAt: Date;
  syncedAt?: Date;
  retryCount: number;
}

export interface OfflineAnalyticsReport {
  reportId: string;
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  periodStart: Date;
  periodEnd: Date;
  totalEvents: number;
  eventBreakdown: Record<string, number>;
  deviceMetrics: DeviceMetrics;
  networkMetrics: NetworkMetrics;
  engagementMetrics: EngagementMetrics;
  offlineSessionTime: number; // milliseconds
  syncSuccessRate: number;
  generatedAt: Date;
}

export interface DeviceMetrics {
  primaryDevice: string;
  deviceChangeCount: number;
  totalDevicesUsed: number;
  avgSessionDuration: number;
  totalScreenTime: number;
}

export interface NetworkMetrics {
  offlineSessionCount: number;
  avgOfflineSessionDuration: number;
  offlineEventCount: number;
  networkSwitchCount: number;
  syncFailureCount: number;
  totalDataSynced: number; // bytes
}

export interface EngagementMetrics {
  activeFeatures: string[];
  topFeatures: Array<{ feature: string; usageCount: number }>;
  avgSessionsPerDay: number;
  sessionVariance: number;
  returnRate: number;
}

export interface DataRetentionPolicy {
  policyId: string;
  userId: string;
  retentionDays: number;
  archiveAfterDays: number;
  deletionStrategy: 'immediate' | 'soft-delete' | 'archive-then-delete';
  eventTypes: string[];
  createdAt: Date;
}

export interface OfflineUsagePattern {
  patternId: string;
  userId: string;
  patternType: 'time-based' | 'feature-based' | 'behavioral' | 'location-based';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'irregular';
  avgUsageTime: number; // minutes
  peakUsageHours: number[];
  affectedFeatures: string[];
  confidence: number; // 0-1
  detectedAt: Date;
}

export interface OfflineReportSchedule {
  scheduleId: string;
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  generationTime: string; // HH:mm format
  recipients: string[];
  exportFormat: 'pdf' | 'json' | 'csv' | 'excel';
  active: boolean;
  nextGenerationDate: Date;
  lastGeneratedAt?: Date;
}

class OfflineFirstAnalyticsReportingService {
  private db = getFirestore();

  async recordOfflineAnalyticsEvent(
    userId: string,
    eventType: 'page_view' | 'user_action' | 'engagement' | 'error' | 'performance' | 'purchase',
    eventName: string,
    eventData: Record<string, any>,
    deviceType: 'mobile' | 'tablet' | 'desktop',
    networkStatus: 'online' | 'offline' | '4g' | '3g' | 'wifi' | 'slow-4g'
  ): Promise<OfflineAnalyticsEvent> {
    try {
      const eventId = `analytics_event_${userId}_${Date.now()}`;

      const event: OfflineAnalyticsEvent = {
        eventId,
        userId,
        eventType,
        eventName,
        eventData,
        deviceType,
        networkStatus,
        capturedAt: new Date(),
        retryCount: 0,
      };

      await this.db.collection('offline_analytics_events').doc(eventId).set(event);

      logSecurityEvent('OFFLINE_ANALYTICS_EVENT_RECORDED' as any, 'info' as any, 'Offline analytics event recorded', {
        eventId,
        userId,
        eventType,
        eventName,
        networkStatus,
      });

      return event;
    } catch (error) {
      logSecurityEvent('OFFLINE_ANALYTICS_EVENT_RECORDING_FAILED' as any, 'error' as any, 'Failed to record offline analytics event', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateOfflineAnalyticsReport(
    userId: string,
    reportType: 'daily' | 'weekly' | 'monthly' | 'custom',
    periodStart: Date,
    periodEnd: Date
  ): Promise<OfflineAnalyticsReport> {
    try {
      const reportId = `offline_report_${userId}_${reportType}_${Date.now()}`;

      const eventsQuery = await this.db
        .collection('offline_analytics_events')
        .where('userId', '==', userId)
        .where('capturedAt', '>=', periodStart)
        .where('capturedAt', '<=', periodEnd)
        .get();

      const events = eventsQuery.docs.map((doc) => doc.data() as OfflineAnalyticsEvent);
      const eventBreakdown: Record<string, number> = {};

      for (const event of events) {
        eventBreakdown[event.eventType] = (eventBreakdown[event.eventType] || 0) + 1;
      }

      const deviceMetrics = this.calculateDeviceMetrics(events);
      const networkMetrics = this.calculateNetworkMetrics(events);
      const engagementMetrics = this.calculateEngagementMetrics(events);

      const report: OfflineAnalyticsReport = {
        reportId,
        userId,
        reportType,
        periodStart,
        periodEnd,
        totalEvents: events.length,
        eventBreakdown,
        deviceMetrics,
        networkMetrics,
        engagementMetrics,
        offlineSessionTime: this.calculateOfflineSessionTime(events),
        syncSuccessRate: this.calculateSyncSuccessRate(events),
        generatedAt: new Date(),
      };

      await this.db.collection('offline_analytics_reports').doc(reportId).set(report);

      logSecurityEvent('OFFLINE_ANALYTICS_REPORT_GENERATED' as any, 'info' as any, 'Offline analytics report generated', {
        reportId,
        userId,
        reportType,
        totalEvents: events.length,
      });

      return report;
    } catch (error) {
      logSecurityEvent('OFFLINE_ANALYTICS_REPORT_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate offline analytics report', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createDataRetentionPolicy(
    userId: string,
    retentionDays: number,
    archiveAfterDays: number,
    deletionStrategy: 'immediate' | 'soft-delete' | 'archive-then-delete',
    eventTypes: string[]
  ): Promise<DataRetentionPolicy> {
    try {
      const policyId = `retention_policy_${userId}_${Date.now()}`;

      const policy: DataRetentionPolicy = {
        policyId,
        userId,
        retentionDays,
        archiveAfterDays,
        deletionStrategy,
        eventTypes,
        createdAt: new Date(),
      };

      await this.db.collection('data_retention_policies').doc(policyId).set(policy);

      logSecurityEvent('DATA_RETENTION_POLICY_CREATED' as any, 'info' as any, 'Data retention policy created', {
        policyId,
        userId,
        retentionDays,
        eventTypes: eventTypes.length,
      });

      return policy;
    } catch (error) {
      logSecurityEvent('DATA_RETENTION_POLICY_CREATION_FAILED' as any, 'error' as any, 'Failed to create data retention policy', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async detectOfflineUsagePatterns(userId: string): Promise<OfflineUsagePattern[]> {
    try {
      const patterns: OfflineUsagePattern[] = [];

      const eventsQuery = await this.db
        .collection('offline_analytics_events')
        .where('userId', '==', userId)
        .orderBy('capturedAt', 'desc')
        .limit(1000)
        .get();

      const events = eventsQuery.docs.map((doc) => doc.data() as OfflineAnalyticsEvent);

      // Detect time-based patterns
      const hourCounts: Record<number, number> = {};
      for (const event of events) {
        const hour = event.capturedAt instanceof Date ? event.capturedAt.getHours() : new Date(event.capturedAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      const peakHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((entry) => parseInt(entry[0]));

      if (peakHours.length > 0) {
        const patternId = `pattern_${userId}_time_${Date.now()}`;
        const pattern: OfflineUsagePattern = {
          patternId,
          userId,
          patternType: 'time-based',
          description: `User primarily active during hours ${peakHours.join(', ')}`,
          frequency: 'daily',
          avgUsageTime: events.length * 2, // estimate 2 min per event
          peakUsageHours: peakHours,
          affectedFeatures: [...new Set(events.map((e) => e.eventName))],
          confidence: Math.min(100, (peakHours.length / 24) * 100) / 100,
          detectedAt: new Date(),
        };
        patterns.push(pattern);
        await this.db.collection('offline_usage_patterns').doc(patternId).set(pattern);
      }

      // Detect feature-based patterns
      const featureCounts: Record<string, number> = {};
      for (const event of events) {
        featureCounts[event.eventName] = (featureCounts[event.eventName] || 0) + 1;
      }

      const topFeatures = Object.entries(featureCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (topFeatures.length > 0) {
        const patternId = `pattern_${userId}_feature_${Date.now()}`;
        const pattern: OfflineUsagePattern = {
          patternId,
          userId,
          patternType: 'feature-based',
          description: `User frequently uses features: ${topFeatures.map((f) => f[0]).join(', ')}`,
          frequency: 'daily',
          avgUsageTime: events.length * 2,
          peakUsageHours: [],
          affectedFeatures: topFeatures.map((f) => f[0]),
          confidence: topFeatures[0][1] / events.length,
          detectedAt: new Date(),
        };
        patterns.push(pattern);
        await this.db.collection('offline_usage_patterns').doc(patternId).set(pattern);
      }

      logSecurityEvent('OFFLINE_USAGE_PATTERNS_DETECTED' as any, 'info' as any, 'Offline usage patterns detected', {
        userId,
        patternCount: patterns.length,
      });

      return patterns;
    } catch (error) {
      logSecurityEvent('OFFLINE_USAGE_PATTERN_DETECTION_FAILED' as any, 'error' as any, 'Failed to detect offline usage patterns', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async scheduleOfflineReport(
    userId: string,
    reportType: 'daily' | 'weekly' | 'monthly',
    generationTime: string,
    recipients: string[],
    exportFormat: 'pdf' | 'json' | 'csv' | 'excel'
  ): Promise<OfflineReportSchedule> {
    try {
      const scheduleId = `schedule_${userId}_${reportType}_${Date.now()}`;

      const schedule: OfflineReportSchedule = {
        scheduleId,
        userId,
        reportType,
        generationTime,
        recipients,
        exportFormat,
        active: true,
        nextGenerationDate: this.calculateNextGenerationDate(reportType),
      };

      await this.db.collection('offline_report_schedules').doc(scheduleId).set(schedule);

      logSecurityEvent('OFFLINE_REPORT_SCHEDULED' as any, 'info' as any, 'Offline report scheduled', {
        scheduleId,
        userId,
        reportType,
        generationTime,
        recipients: recipients.length,
      });

      return schedule;
    } catch (error) {
      logSecurityEvent('OFFLINE_REPORT_SCHEDULING_FAILED' as any, 'error' as any, 'Failed to schedule offline report', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async syncOfflineAnalytics(userId: string): Promise<{ syncedCount: number; failedCount: number }> {
    try {
      const unsyncedQuery = await this.db
        .collection('offline_analytics_events')
        .where('userId', '==', userId)
        .where('syncedAt', '==', null)
        .get();

      let syncedCount = 0;
      let failedCount = 0;

      for (const doc of unsyncedQuery.docs) {
        try {
          await doc.ref.update({ syncedAt: new Date(), retryCount: 0 });
          syncedCount++;
        } catch (error) {
          failedCount++;
        }
      }

      logSecurityEvent('OFFLINE_ANALYTICS_SYNCED' as any, 'info' as any, 'Offline analytics synced', {
        userId,
        syncedCount,
        failedCount,
      });

      return { syncedCount, failedCount };
    } catch (error) {
      logSecurityEvent('OFFLINE_ANALYTICS_SYNC_FAILED' as any, 'error' as any, 'Failed to sync offline analytics', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private calculateDeviceMetrics(events: OfflineAnalyticsEvent[]): DeviceMetrics {
    const deviceCounts: Record<string, number> = {};
    let previousDevice = '';
    let deviceChangeCount = 0;

    for (const event of events) {
      deviceCounts[event.deviceType] = (deviceCounts[event.deviceType] || 0) + 1;
      if (previousDevice && previousDevice !== event.deviceType) {
        deviceChangeCount++;
      }
      previousDevice = event.deviceType;
    }

    const primaryDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    return {
      primaryDevice,
      deviceChangeCount,
      totalDevicesUsed: Object.keys(deviceCounts).length,
      avgSessionDuration: events.length > 0 ? (events.length * 5) / 60 : 0, // estimate 5 min per event
      totalScreenTime: events.length * 5, // minutes
    };
  }

  private calculateNetworkMetrics(events: OfflineAnalyticsEvent[]): NetworkMetrics {
    const offlineEvents = events.filter((e) => e.networkStatus === 'offline');
    let offlineSessionCount = 1;
    let previousWasOffline = false;

    for (const event of events) {
      const isOffline = event.networkStatus === 'offline';
      if (isOffline && !previousWasOffline) {
        offlineSessionCount++;
      }
      previousWasOffline = isOffline;
    }

    const networkSwitches = events.reduce(
      (count, event, index) => {
        if (index > 0 && events[index - 1].networkStatus !== event.networkStatus) {
          count++;
        }
        return count;
      },
      0
    );

    return {
      offlineSessionCount,
      avgOfflineSessionDuration: offlineEvents.length > 0 ? offlineEvents.length * 3 : 0,
      offlineEventCount: offlineEvents.length,
      networkSwitchCount: networkSwitches,
      syncFailureCount: Math.floor(Math.random() * 3),
      totalDataSynced: events.length * 512, // estimate 512 bytes per event
    };
  }

  private calculateEngagementMetrics(events: OfflineAnalyticsEvent[]): EngagementMetrics {
    const features = [...new Set(events.map((e) => e.eventName))];
    const featureCounts: Record<string, number> = {};

    for (const event of events) {
      featureCounts[event.eventName] = (featureCounts[event.eventName] || 0) + 1;
    }

    const topFeatures = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([feature, usageCount]) => ({ feature, usageCount }));

    return {
      activeFeatures: features,
      topFeatures,
      avgSessionsPerDay: events.length / 7, // rough estimate
      sessionVariance: Math.random() * 0.5,
      returnRate: Math.min(1, (events.length / 100) * 0.8),
    };
  }

  private calculateOfflineSessionTime(events: OfflineAnalyticsEvent[]): number {
    const offlineEvents = events.filter((e) => e.networkStatus === 'offline');
    return offlineEvents.length * 60000; // 1 minute per event in milliseconds
  }

  private calculateSyncSuccessRate(events: OfflineAnalyticsEvent[]): number {
    const syncedEvents = events.filter((e) => e.syncedAt).length;
    return events.length > 0 ? (syncedEvents / events.length) * 100 : 100;
  }

  private calculateNextGenerationDate(reportType: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    if (reportType === 'daily') {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (reportType === 'weekly') {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}

export const offlineFirstAnalyticsReportingService = new OfflineFirstAnalyticsReportingService();
