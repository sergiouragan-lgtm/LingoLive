/**
 * Real-Time Analytics Service
 * Tracks user interactions, custom events, and behavioral analytics
 */

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  eventType: string;
  eventName: string;
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
  metadata?: {
    url: string;
    referrer: string;
    userAgent: string;
    screenResolution: string;
  };
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivityTime: number;
  eventCount: number;
  pageViews: number;
  deviceInfo: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
}

export interface ConversionEvent {
  id: string;
  timestamp: number;
  userId: string;
  conversionType: string;
  value?: number;
  currency?: string;
  properties?: Record<string, any>;
}

class RealTimeAnalytics {
  private sessionId = this.generateSessionId();
  private eventQueue: AnalyticsEvent[] = [];
  private currentSession: UserSession;
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: number | null = null;
  private isTrackingEnabled = true;

  constructor() {
    this.currentSession = this.initializeSession();
    this.startAutoFlush();
    this.trackPageView();
    this.setupBeaconAPI();
  }

  /**
   * Initialize session
   */
  private initializeSession(): UserSession {
    return {
      sessionId: this.sessionId,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      eventCount: 0,
      pageViews: 0,
      deviceInfo: this.detectDeviceInfo(),
    };
  }

  /**
   * Detect device information
   */
  private detectDeviceInfo(): UserSession['deviceInfo'] {
    const ua = navigator.userAgent;

    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/mobile|android/i.test(ua)) deviceType = 'mobile';
    if (/ipad|tablet/i.test(ua)) deviceType = 'tablet';

    return {
      type: deviceType,
      os: this.detectOS(),
      browser: this.detectBrowser(),
    };
  }

  /**
   * Detect operating system
   */
  private detectOS(): string {
    const ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    return 'Unknown';
  }

  /**
   * Detect browser
   */
  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (/Chrome/.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Edge/.test(ua)) return 'Edge';
    return 'Unknown';
  }

  /**
   * Track a custom event
   */
  public trackEvent(options: {
    eventType: string;
    eventName: string;
    properties?: Record<string, any>;
  }): void {
    if (!this.isTrackingEnabled) return;

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType: options.eventType,
      eventName: options.eventName,
      sessionId: this.sessionId,
      properties: options.properties,
      metadata: {
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      },
    };

    this.eventQueue.push(event);
    this.currentSession.eventCount++;
    this.currentSession.lastActivityTime = Date.now();

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  public trackPageView(pageName?: string): void {
    this.trackEvent({
      eventType: 'page_view',
      eventName: pageName || document.title,
      properties: {
        url: window.location.href,
        referrer: document.referrer,
      },
    });
    this.currentSession.pageViews++;
  }

  /**
   * Track conversion event
   */
  public trackConversion(options: {
    conversionType: string;
    userId: string;
    value?: number;
    currency?: string;
    properties?: Record<string, any>;
  }): ConversionEvent {
    const conversionEvent: ConversionEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      userId: options.userId,
      conversionType: options.conversionType,
      value: options.value,
      currency: options.currency,
      properties: options.properties,
    };

    // Track as regular event
    this.trackEvent({
      eventType: 'conversion',
      eventName: options.conversionType,
      properties: {
        value: options.value,
        currency: options.currency,
        ...options.properties,
      },
    });

    return conversionEvent;
  }

  /**
   * Set user ID for session
   */
  public setUserId(userId: string): void {
    this.currentSession.userId = userId;
    this.trackEvent({
      eventType: 'user_context',
      eventName: 'user_id_set',
      properties: { userId },
    });
  }

  /**
   * Track user engagement (time on page, scroll depth, etc.)
   */
  public startEngagementTracking(): void {
    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercentage);

      if (maxScrollDepth > 25 && maxScrollDepth <= 50) {
        this.trackEvent({
          eventType: 'engagement',
          eventName: 'scroll_depth_25',
        });
      } else if (maxScrollDepth > 50 && maxScrollDepth <= 75) {
        this.trackEvent({
          eventType: 'engagement',
          eventName: 'scroll_depth_50',
        });
      } else if (maxScrollDepth > 75) {
        this.trackEvent({
          eventType: 'engagement',
          eventName: 'scroll_depth_75',
        });
      }
    });

    // Track active time
    let activityTimeout: number;
    const resetTimeout = () => {
      clearTimeout(activityTimeout);
      activityTimeout = window.setTimeout(() => {
        this.trackEvent({
          eventType: 'engagement',
          eventName: 'inactive_session',
        });
      }, 5 * 60 * 1000); // 5 minutes
    };

    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout();
  }

  /**
   * Setup Beacon API for reliable delivery before page unload
   */
  private setupBeaconAPI(): void {
    window.addEventListener('beforeunload', () => {
      if (navigator.sendBeacon && this.eventQueue.length > 0) {
        navigator.sendBeacon('/api/analytics/events/batch', JSON.stringify({
          events: this.eventQueue,
          session: this.currentSession,
        }));
      }
    });
  }

  /**
   * Flush events to server
   */
  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const token = await (window as any).auth?.currentUser?.getIdToken?.();

      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          events,
          session: this.currentSession,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.warn('Failed to flush analytics events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop automatic flush
   */
  public stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get current session info
   */
  public getSession(): UserSession {
    return { ...this.currentSession };
  }

  /**
   * Get session duration
   */
  public getSessionDuration(): number {
    return Date.now() - this.currentSession.startTime;
  }

  /**
   * Enable/disable tracking
   */
  public setTrackingEnabled(enabled: boolean): void {
    this.isTrackingEnabled = enabled;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Reset session (for logout)
   */
  public resetSession(): void {
    this.flush();
    this.sessionId = this.generateSessionId();
    this.currentSession = this.initializeSession();
  }
}

export const realTimeAnalytics = new RealTimeAnalytics();
