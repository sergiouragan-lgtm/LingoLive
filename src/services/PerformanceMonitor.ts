/**
 * Performance Monitoring Service
 * Tracks Web Vitals, page load times, and performance metrics
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number; // Largest Contentful Paint (ms)
  FID?: number; // First Input Delay (ms)
  CLS?: number; // Cumulative Layout Shift (score 0-1)

  // Additional vitals
  FCP?: number; // First Contentful Paint (ms)
  TTFB?: number; // Time to First Byte (ms)
  pageLoadTime?: number;
  domContentLoadedTime?: number;

  // Custom metrics
  timeToInteractive?: number;
  memoryUsage?: number;

  // Resource timings
  scriptLoadTime?: number;
  styleLoadTime?: number;
  imageLoadTime?: number;
}

export interface PageLoadMetrics extends PerformanceMetrics {
  pageName: string;
  timestamp: number;
  navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender';
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  /**
   * Start monitoring performance metrics
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor Web Vitals
    this.monitorWebVitals();

    // Monitor resource timings
    this.monitorResourceTimings();

    // Monitor page load
    this.monitorPageLoad();

    // Monitor memory usage (if available)
    this.monitorMemory();
  }

  /**
   * Stop monitoring performance metrics
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Monitor Core Web Vitals using PerformanceObserver
   */
  private monitorWebVitals(): void {
    try {
      // Monitor Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('FID', entry.processingDuration);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Monitor Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.recordMetric('CLS', clsValue);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Monitor First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('FCP', lastEntry.startTime);
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      }
    } catch (error) {
      console.warn('PerformanceObserver not available:', error);
    }
  }

  /**
   * Monitor resource loading times
   */
  private monitorResourceTimings(): void {
    try {
      if ('PerformanceObserver' in window) {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name.includes('.js')) {
              this.recordMetric('scriptLoadTime', entry.duration);
            } else if (entry.name.includes('.css')) {
              this.recordMetric('styleLoadTime', entry.duration);
            } else if (/\.(png|jpg|jpeg|gif|svg|webp)/.test(entry.name)) {
              this.recordMetric('imageLoadTime', entry.duration);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      }
    } catch (error) {
      console.warn('Resource timing observation failed:', error);
    }
  }

  /**
   * Monitor page load timing
   */
  private monitorPageLoad(): void {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        this.recordMetric('pageLoadTime', perfData.loadEventEnd - perfData.fetchStart);
        this.recordMetric('domContentLoadedTime', perfData.domContentLoadedEventEnd - perfData.fetchStart);
        this.recordMetric('TTFB', perfData.responseStart - perfData.fetchStart);
        this.recordMetric('timeToInteractive', perfData.domInteractive - perfData.fetchStart);
      }
    });
  }

  /**
   * Monitor memory usage (if available)
   */
  private monitorMemory(): void {
    if ((performance as any).memory) {
      const checkMemory = () => {
        const memMetrics = (performance as any).memory;
        this.recordMetric('memoryUsage', memMetrics.usedJSHeapSize / memMetrics.jsHeapSizeLimit);
      };

      // Check every 5 seconds
      setInterval(checkMemory, 5000);
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metricName: string, value: number): void {
    const metrics = this.metrics.get('current') || {};
    (metrics as any)[metricName] = value;
    this.metrics.set('current', metrics);
  }

  /**
   * Get current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return this.metrics.get('current') || {};
  }

  /**
   * Get page load metrics
   */
  public getPageLoadMetrics(): PageLoadMetrics {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    return {
      pageName: document.title,
      timestamp: Date.now(),
      navigationType: perfData.type as any,
      ...this.getMetrics(),
      pageLoadTime: perfData.loadEventEnd - perfData.fetchStart,
      domContentLoadedTime: perfData.domContentLoadedEventEnd - perfData.fetchStart,
    };
  }

  /**
   * Send metrics to server for analysis
   */
  public async reportMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();

      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.warn('Failed to report metrics:', error);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
