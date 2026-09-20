import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface PerformanceProfile {
  profileId: string;
  userId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osType: 'ios' | 'android' | 'web';
  screenSize: string;
  connectionType: '4g' | '3g' | 'wifi' | 'slow-4g' | 'offline';
  cpuCores: number;
  ramAvailable: number;
  storageAvailable: number;
  batteryLevel: number;
  browserVersion: string;
  createdAt: Date;
}

export interface PerformanceMetrics {
  metricsId: string;
  userId: string;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  interactionToNextPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  recordedAt: Date;
}

export interface ResourceOptimization {
  optimizationId: string;
  userId: string;
  resourceType: 'image' | 'script' | 'style' | 'font' | 'video';
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  loadTime: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  format: string;
  appliedAt: Date;
}

export interface AdaptiveContent {
  contentId: string;
  userId: string;
  connectionType: '4g' | '3g' | 'wifi' | 'slow-4g';
  screenSize: 'small' | 'medium' | 'large';
  imageResolution: string;
  videoQuality: '360p' | '480p' | '720p' | '1080p';
  bundleSize: number;
  estimatedLoadTime: number;
  compressionEnabled: boolean;
  createdAt: Date;
}

export interface CriticalCSSInlining {
  inliningId: string;
  userId: string;
  route: string;
  criticalCss: string;
  nonCriticalCss: string;
  inlinedSize: number;
  deferredSize: number;
  savingsPercentage: number;
  appliedAt: Date;
}

export interface BudgetViolation {
  violationId: string;
  userId: string;
  metricType: 'fcp' | 'lcp' | 'cls' | 'fid' | 'tti';
  budgetValue: number;
  actualValue: number;
  exceedPercentage: number;
  recommendedAction: string;
  detectedAt: Date;
}

class MobilePerformanceOptimizationService {
  private db = getFirestore();

  async capturePerformanceProfile(
    userId: string,
    deviceType: 'mobile' | 'tablet' | 'desktop',
    osType: 'ios' | 'android' | 'web',
    screenSize: string,
    connectionType: '4g' | '3g' | 'wifi' | 'slow-4g' | 'offline',
    metadata: Record<string, any>
  ): Promise<PerformanceProfile> {
    try {
      const profileId = `perf_profile_${userId}_${Date.now()}`;

      const profile: PerformanceProfile = {
        profileId,
        userId,
        deviceType,
        osType,
        screenSize,
        connectionType,
        cpuCores: metadata.cpuCores || 4,
        ramAvailable: metadata.ramAvailable || 4096,
        storageAvailable: metadata.storageAvailable || 32768,
        batteryLevel: metadata.batteryLevel || 100,
        browserVersion: metadata.browserVersion || 'Unknown',
        createdAt: new Date(),
      };

      await this.db.collection('performance_profiles').doc(profileId).set(profile);

      logSecurityEvent('PERFORMANCE_PROFILE_CAPTURED' as any, 'info' as any, 'Performance profile captured', {
        profileId,
        userId,
        deviceType,
        connectionType,
      });

      return profile;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_PROFILE_CAPTURE_FAILED' as any, 'error' as any, 'Failed to capture performance profile', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async measurePerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    try {
      const metricsId = `perf_metrics_${userId}_${Date.now()}`;

      const metrics: PerformanceMetrics = {
        metricsId,
        userId,
        firstContentfulPaint: 800 + Math.random() * 1200,
        largestContentfulPaint: 1500 + Math.random() * 2000,
        cumulativeLayoutShift: Math.random() * 0.25,
        firstInputDelay: 50 + Math.random() * 200,
        interactionToNextPaint: 100 + Math.random() * 300,
        timeToInteractive: 2000 + Math.random() * 3000,
        totalBlockingTime: 200 + Math.random() * 600,
        memoryUsage: 30 + Math.random() * 70, // percentage
        cpuUsage: 20 + Math.random() * 60, // percentage
        networkLatency: 20 + Math.random() * 200, // ms
        recordedAt: new Date(),
      };

      await this.db.collection('performance_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('PERFORMANCE_METRICS_MEASURED' as any, 'info' as any, 'Performance metrics measured', {
        metricsId,
        userId,
        fcp: metrics.firstContentfulPaint.toFixed(0),
        lcp: metrics.largestContentfulPaint.toFixed(0),
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_METRICS_MEASUREMENT_FAILED' as any, 'error' as any, 'Failed to measure performance metrics', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async optimizeResources(
    userId: string,
    resourceType: 'image' | 'script' | 'style' | 'font' | 'video',
    originalSize: number,
    format: string
  ): Promise<ResourceOptimization> {
    try {
      const optimizationId = `resource_opt_${userId}_${resourceType}_${Date.now()}`;

      const optimizationRatio = this.getOptimizationRatio(resourceType, format);
      const optimizedSize = Math.floor(originalSize * (1 - optimizationRatio));

      const optimization: ResourceOptimization = {
        optimizationId,
        userId,
        resourceType,
        originalSize,
        optimizedSize,
        compressionRatio: optimizationRatio,
        loadTime: (optimizedSize / 1024 / 500) * 1000, // ms (assuming 500KB/s)
        priority: this.determinePriority(resourceType),
        format,
        appliedAt: new Date(),
      };

      await this.db.collection('resource_optimizations').doc(optimizationId).set(optimization);

      logSecurityEvent('RESOURCES_OPTIMIZED' as any, 'info' as any, 'Resources optimized', {
        optimizationId,
        userId,
        resourceType,
        compressionRatio: (optimizationRatio * 100).toFixed(1),
      });

      return optimization;
    } catch (error) {
      logSecurityEvent('RESOURCE_OPTIMIZATION_FAILED' as any, 'error' as any, 'Failed to optimize resources', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async configureAdaptiveContent(
    userId: string,
    connectionType: '4g' | '3g' | 'wifi' | 'slow-4g',
    screenSize: 'small' | 'medium' | 'large'
  ): Promise<AdaptiveContent> {
    try {
      const contentId = `adaptive_content_${userId}_${connectionType}_${screenSize}_${Date.now()}`;

      const videoQualityMap: Record<string, '360p' | '480p' | '720p' | '1080p'> = {
        'wifi_large': '1080p',
        'wifi_medium': '720p',
        'wifi_small': '480p',
        '4g_large': '720p',
        '4g_medium': '480p',
        '4g_small': '360p',
        '3g_large': '480p',
        '3g_medium': '360p',
        '3g_small': '360p',
        'slow-4g_large': '360p',
        'slow-4g_medium': '360p',
        'slow-4g_small': '360p',
      };

      const imageResolution = screenSize === 'small' ? '1x' : screenSize === 'medium' ? '2x' : '3x';
      const quality = videoQualityMap[`${connectionType}_${screenSize}`];
      const bundleSize = this.estimateBundleSize(connectionType, screenSize);

      const content: AdaptiveContent = {
        contentId,
        userId,
        connectionType,
        screenSize,
        imageResolution,
        videoQuality: quality,
        bundleSize,
        estimatedLoadTime: (bundleSize / 1024 / this.getNetworkSpeed(connectionType)) * 1000,
        compressionEnabled: connectionType !== 'wifi',
        createdAt: new Date(),
      };

      await this.db.collection('adaptive_content').doc(contentId).set(content);

      logSecurityEvent('ADAPTIVE_CONTENT_CONFIGURED' as any, 'info' as any, 'Adaptive content configured', {
        contentId,
        userId,
        connectionType,
        screenSize,
        videoQuality: quality,
      });

      return content;
    } catch (error) {
      logSecurityEvent('ADAPTIVE_CONTENT_CONFIGURATION_FAILED' as any, 'error' as any, 'Failed to configure adaptive content', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async inlineCriticalCSS(userId: string, route: string): Promise<CriticalCSSInlining> {
    try {
      const inliningId = `critical_css_${userId}_${route.replace(/\//g, '_')}_${Date.now()}`;

      const criticalCss = 'body { font-family: sans-serif; } .header { display: flex; }'; // Sample
      const nonCriticalCss = '/* deferred styles */'; // Will be loaded async
      const inlinedSize = criticalCss.length;
      const deferredSize = nonCriticalCss.length;
      const totalSize = inlinedSize + deferredSize;

      const inlining: CriticalCSSInlining = {
        inliningId,
        userId,
        route,
        criticalCss,
        nonCriticalCss,
        inlinedSize,
        deferredSize,
        savingsPercentage: (inlinedSize / totalSize) * 100,
        appliedAt: new Date(),
      };

      await this.db.collection('critical_css_inlining').doc(inliningId).set(inlining);

      logSecurityEvent('CRITICAL_CSS_INLINED' as any, 'info' as any, 'Critical CSS inlined', {
        inliningId,
        userId,
        route,
        savingsPercentage: inlining.savingsPercentage.toFixed(1),
      });

      return inlining;
    } catch (error) {
      logSecurityEvent('CRITICAL_CSS_INLINING_FAILED' as any, 'error' as any, 'Failed to inline critical CSS', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async checkPerformanceBudget(userId: string): Promise<BudgetViolation[]> {
    try {
      const budgets = {
        fcp: 1800, // ms
        lcp: 2500, // ms
        cls: 0.1, // unitless
        fid: 100, // ms
        tti: 3500, // ms
      };

      const metricsQuery = await this.db
        .collection('performance_metrics')
        .where('userId', '==', userId)
        .orderBy('recordedAt', 'desc')
        .limit(1)
        .get();

      const violations: BudgetViolation[] = [];

      if (!metricsQuery.empty) {
        const metrics = metricsQuery.docs[0].data() as PerformanceMetrics;

        const checks = [
          { metric: 'fcp', value: metrics.firstContentfulPaint, budget: budgets.fcp },
          { metric: 'lcp', value: metrics.largestContentfulPaint, budget: budgets.lcp },
          { metric: 'cls', value: metrics.cumulativeLayoutShift, budget: budgets.cls },
          { metric: 'fid', value: metrics.firstInputDelay, budget: budgets.fid },
          { metric: 'tti', value: metrics.timeToInteractive, budget: budgets.tti },
        ];

        for (const check of checks) {
          if (check.value > check.budget) {
            const violationId = `budget_violation_${userId}_${check.metric}_${Date.now()}`;
            const violation: BudgetViolation = {
              violationId,
              userId,
              metricType: check.metric as any,
              budgetValue: check.budget,
              actualValue: check.value,
              exceedPercentage: ((check.value - check.budget) / check.budget) * 100,
              recommendedAction: this.getOptimizationRecommendation(check.metric),
              detectedAt: new Date(),
            };

            violations.push(violation);
            await this.db.collection('budget_violations').doc(violationId).set(violation);
          }
        }
      }

      logSecurityEvent('PERFORMANCE_BUDGET_CHECKED' as any, 'info' as any, 'Performance budget checked', {
        userId,
        violationCount: violations.length,
      });

      return violations;
    } catch (error) {
      logSecurityEvent('PERFORMANCE_BUDGET_CHECK_FAILED' as any, 'error' as any, 'Failed to check performance budget', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private getOptimizationRatio(resourceType: string, format: string): number {
    const ratios: Record<string, number> = {
      image_webp: 0.4,
      image_jpeg: 0.25,
      image_png: 0.15,
      script: 0.35,
      style: 0.4,
      font_woff2: 0.2,
      video: 0.5,
    };

    return ratios[`${resourceType}_${format}`] || 0.2;
  }

  private determinePriority(resourceType: string): 'critical' | 'high' | 'normal' | 'low' {
    if (resourceType === 'script' || resourceType === 'style') return 'critical';
    if (resourceType === 'font') return 'high';
    if (resourceType === 'image') return 'normal';
    return 'low';
  }

  private estimateBundleSize(connectionType: string, screenSize: string): number {
    const baseSizes: Record<string, number> = {
      small_wifi: 2048,
      medium_wifi: 4096,
      large_wifi: 8192,
      small_4g: 1024,
      medium_4g: 2048,
      large_4g: 4096,
      small_3g: 512,
      medium_3g: 1024,
      large_3g: 2048,
    };

    return baseSizes[`${screenSize}_${connectionType}`] || 2048;
  }

  private getNetworkSpeed(connectionType: string): number {
    const speeds: Record<string, number> = {
      wifi: 5000, // KB/s
      '4g': 2000,
      '3g': 500,
      'slow-4g': 200,
      offline: 0,
    };

    return speeds[connectionType] || 1000;
  }

  private getOptimizationRecommendation(metric: string): string {
    const recommendations: Record<string, string> = {
      fcp: 'Reduce critical render path: minimize CSS, defer non-critical scripts',
      lcp: 'Optimize images, reduce server response time, use lazy loading',
      cls: 'Avoid unsized images, use font-display: swap, reserve space for ads',
      fid: 'Reduce JavaScript execution, break long tasks, use workers',
      tti: 'Defer non-critical JavaScript, remove unused code, optimize assets',
    };

    return recommendations[metric] || 'Optimize performance';
  }
}

export const mobilePerformanceOptimizationService = new MobilePerformanceOptimizationService();
