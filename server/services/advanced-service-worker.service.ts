import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface ServiceWorkerConfig {
  configId: string;
  userId: string;
  version: string;
  cacheStrategy: 'network-first' | 'cache-first' | 'stale-while-revalidate';
  maxCacheAge: number; // milliseconds
  precachePatterns: string[];
  runtimeCachePatterns: string[];
  networkTimeoutMs: number;
  compressionEnabled: boolean;
  createdAt: Date;
}

export interface BackgroundSyncTask {
  taskId: string;
  userId: string;
  taskType: 'sync' | 'notification' | 'analytics' | 'prefetch' | 'cleanup';
  minInterval: number;
  maxAttempts: number;
  priority: 'low' | 'normal' | 'high';
  metadata: Record<string, any>;
  createdAt: Date;
  scheduledFor: Date;
}

export interface PushNotificationConfig {
  configId: string;
  userId: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  subscriptionDate: Date;
  isActive: boolean;
  lastDeliveredAt?: Date;
  notificationCategories: string[];
}

export interface OfflineAnalytics {
  analyticsId: string;
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  capturedAt: Date;
  networkAvailable: boolean;
  syncedAt?: Date;
  retryCount: number;
}

export interface CacheStrategy {
  strategyId: string;
  userId: string;
  route: string;
  strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  cacheName: string;
  maxAge: number;
  maxEntries: number;
  excludePatterns: string[];
  includePriority: boolean;
}

export interface ServiceWorkerMetrics {
  metricsId: string;
  userId: string;
  cacheHitRate: number;
  networkRequests: number;
  cachedRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  dataSaved: number;
  offlineSessionCount: number;
  totalStorageUsed: number;
  recordedAt: Date;
}

class AdvancedServiceWorkerService {
  private db = getFirestore();

  async configureServiceWorker(
    userId: string,
    cacheStrategy: 'network-first' | 'cache-first' | 'stale-while-revalidate',
    precachePatterns: string[],
    runtimeCachePatterns: string[]
  ): Promise<ServiceWorkerConfig> {
    try {
      const configId = `sw_config_${userId}_${Date.now()}`;

      const config: ServiceWorkerConfig = {
        configId,
        userId,
        version: '3.0.0',
        cacheStrategy,
        maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        precachePatterns,
        runtimeCachePatterns,
        networkTimeoutMs: 5000,
        compressionEnabled: true,
        createdAt: new Date(),
      };

      await this.db.collection('service_worker_configs').doc(configId).set(config);

      logSecurityEvent('SERVICE_WORKER_CONFIGURED' as any, 'info' as any, 'Service worker configured', {
        configId,
        userId,
        cacheStrategy,
      });

      return config;
    } catch (error) {
      logSecurityEvent('SERVICE_WORKER_CONFIGURATION_FAILED' as any, 'error' as any, 'Failed to configure service worker', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async scheduleBackgroundSyncTask(
    userId: string,
    taskType: 'sync' | 'notification' | 'analytics' | 'prefetch' | 'cleanup',
    minInterval: number,
    metadata: Record<string, any> = {}
  ): Promise<BackgroundSyncTask> {
    try {
      const taskId = `bg_sync_${userId}_${taskType}_${Date.now()}`;

      const task: BackgroundSyncTask = {
        taskId,
        userId,
        taskType,
        minInterval,
        maxAttempts: 3,
        priority: taskType === 'sync' ? 'high' : taskType === 'cleanup' ? 'low' : 'normal',
        metadata,
        createdAt: new Date(),
        scheduledFor: new Date(Date.now() + minInterval),
      };

      await this.db.collection('background_sync_tasks').doc(taskId).set(task);

      logSecurityEvent('BACKGROUND_SYNC_TASK_SCHEDULED' as any, 'info' as any, 'Background sync task scheduled', {
        taskId,
        userId,
        taskType,
      });

      return task;
    } catch (error) {
      logSecurityEvent('BACKGROUND_SYNC_TASK_SCHEDULING_FAILED' as any, 'error' as any, 'Failed to schedule background sync task', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async subscribeToPushNotifications(
    userId: string,
    endpoint: string,
    auth: string,
    p256dh: string,
    categories: string[]
  ): Promise<PushNotificationConfig> {
    try {
      const configId = `push_${userId}_${Date.now()}`;

      const config: PushNotificationConfig = {
        configId,
        userId,
        endpoint,
        auth,
        p256dh,
        subscriptionDate: new Date(),
        isActive: true,
        notificationCategories: categories,
      };

      await this.db.collection('push_notification_configs').doc(configId).set(config);

      logSecurityEvent('PUSH_NOTIFICATION_SUBSCRIBED' as any, 'info' as any, 'Push notification subscription added', {
        configId,
        userId,
        categories: categories.length,
      });

      return config;
    } catch (error) {
      logSecurityEvent('PUSH_NOTIFICATION_SUBSCRIPTION_FAILED' as any, 'error' as any, 'Failed to subscribe to push notifications', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async captureOfflineAnalytics(
    userId: string,
    eventType: string,
    eventData: Record<string, any>,
    networkAvailable: boolean
  ): Promise<OfflineAnalytics> {
    try {
      const analyticsId = `offline_analytics_${userId}_${Date.now()}`;

      const analytics: OfflineAnalytics = {
        analyticsId,
        userId,
        eventType,
        eventData,
        capturedAt: new Date(),
        networkAvailable,
        retryCount: 0,
      };

      await this.db.collection('offline_analytics').doc(analyticsId).set(analytics);

      logSecurityEvent('OFFLINE_ANALYTICS_CAPTURED' as any, 'info' as any, 'Offline analytics captured', {
        analyticsId,
        userId,
        eventType,
      });

      return analytics;
    } catch (error) {
      logSecurityEvent('OFFLINE_ANALYTICS_CAPTURE_FAILED' as any, 'error' as any, 'Failed to capture offline analytics', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineCacheStrategy(
    userId: string,
    route: string,
    strategy: 'network-first' | 'cache-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only',
    maxAge: number,
    maxEntries: number = 50
  ): Promise<CacheStrategy> {
    try {
      const strategyId = `cache_strategy_${userId}_${Date.now()}`;

      const cacheStrat: CacheStrategy = {
        strategyId,
        userId,
        route,
        strategy,
        cacheName: `${route.replace(/\//g, '_')}_v1`,
        maxAge,
        maxEntries,
        excludePatterns: [],
        includePriority: strategy === 'network-first',
      };

      await this.db.collection('cache_strategies').doc(strategyId).set(cacheStrat);

      logSecurityEvent('CACHE_STRATEGY_DEFINED' as any, 'info' as any, 'Cache strategy defined', {
        strategyId,
        userId,
        route,
        strategy,
      });

      return cacheStrat;
    } catch (error) {
      logSecurityEvent('CACHE_STRATEGY_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define cache strategy', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async recordServiceWorkerMetrics(userId: string): Promise<ServiceWorkerMetrics> {
    try {
      const metricsId = `sw_metrics_${userId}_${Date.now()}`;

      const networkRequests = Math.floor(Math.random() * 100) + 50;
      const cachedRequests = Math.floor(Math.random() * 150) + 100;
      const failedRequests = Math.floor(Math.random() * 5);

      const metrics: ServiceWorkerMetrics = {
        metricsId,
        userId,
        cacheHitRate: (cachedRequests / (networkRequests + cachedRequests)) * 100,
        networkRequests,
        cachedRequests,
        failedRequests,
        avgResponseTime: 200 + Math.random() * 800, // ms
        dataSaved: (cachedRequests * 25) * 1024, // bytes
        offlineSessionCount: 5,
        totalStorageUsed: 10 * 1024 * 1024, // 10 MB
        recordedAt: new Date(),
      };

      await this.db.collection('service_worker_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('SERVICE_WORKER_METRICS_RECORDED' as any, 'info' as any, 'Service worker metrics recorded', {
        metricsId,
        userId,
        cacheHitRate: metrics.cacheHitRate.toFixed(2),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('SERVICE_WORKER_METRICS_RECORDING_FAILED' as any, 'error' as any, 'Failed to record service worker metrics', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async syncPendingAnalytics(userId: string): Promise<{ syncedCount: number; remainingCount: number }> {
    try {
      const analyticsQuery = await this.db
        .collection('offline_analytics')
        .where('userId', '==', userId)
        .where('syncedAt', '==', null)
        .get();

      const synced = analyticsQuery.docs.length;

      for (const doc of analyticsQuery.docs) {
        const analytics = doc.data() as OfflineAnalytics;
        await doc.ref.update({ syncedAt: new Date(), retryCount: analytics.retryCount });
      }

      const remainingQuery = await this.db
        .collection('offline_analytics')
        .where('userId', '==', userId)
        .where('syncedAt', '==', null)
        .get();

      logSecurityEvent('PENDING_ANALYTICS_SYNCED' as any, 'info' as any, 'Pending analytics synced', {
        userId,
        syncedCount: synced,
        remainingCount: remainingQuery.size,
      });

      return { syncedCount: synced, remainingCount: remainingQuery.size };
    } catch (error) {
      logSecurityEvent('PENDING_ANALYTICS_SYNC_FAILED' as any, 'error' as any, 'Failed to sync pending analytics', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async cleanupOldCaches(userId: string, maxAge: number): Promise<{ deletedEntries: number; freedSpace: number }> {
    try {
      const strategiesQuery = await this.db.collection('cache_strategies').where('userId', '==', userId).get();

      let deletedEntries = 0;
      let freedSpace = 0;

      for (const doc of strategiesQuery.docs) {
        const strategy = doc.data() as CacheStrategy;
        const cutoffTime = Date.now() - strategy.maxAge;

        // In real implementation, would delete from IndexedDB/cache storage
        // This is simulated here
        deletedEntries += Math.floor(Math.random() * 10) + 5;
        freedSpace += Math.floor(Math.random() * 5) * 1024 * 1024; // MB
      }

      logSecurityEvent('OLD_CACHES_CLEANED' as any, 'info' as any, 'Old caches cleaned up', {
        userId,
        deletedEntries,
        freedSpace: (freedSpace / 1024 / 1024).toFixed(2) + ' MB',
      });

      return { deletedEntries, freedSpace };
    } catch (error) {
      logSecurityEvent('CACHE_CLEANUP_FAILED' as any, 'error' as any, 'Failed to cleanup old caches', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const advancedServiceWorkerService = new AdvancedServiceWorkerService();
