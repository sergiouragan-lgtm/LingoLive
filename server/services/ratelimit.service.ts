import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface RateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  tier?: 'free' | 'pro' | 'premium';
  burstSize?: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
  reason?: string;
}

export interface RateLimitEntry {
  userId: string;
  endpoint: string;
  count: number;
  windowStart: Date;
  tier: string;
}

const DEFAULT_LIMITS = {
  free: { minute: 10, hour: 100, day: 1000 },
  pro: { minute: 50, hour: 500, day: 10000 },
  premium: { minute: 200, hour: 2000, day: 50000 },
};

class RateLimitService {
  private db: FirebaseFirestore.Firestore;
  private inMemoryCache: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    this.db = getFirestore();
  }

  public async checkLimit(
    userId: string,
    endpoint: string,
    tier: 'free' | 'pro' | 'premium' = 'free'
  ): Promise<RateLimitStatus> {
    const cacheKey = `${userId}:${endpoint}`;
    const now = Date.now();

    const limits = DEFAULT_LIMITS[tier];
    const minuteWindow = 60 * 1000;
    const hourWindow = 60 * 60 * 1000;
    const dayWindow = 24 * 60 * 60 * 1000;

    try {
      // Check in-memory cache first
      const cached = this.inMemoryCache.get(cacheKey);
      if (cached && cached.resetAt > now) {
        const remaining = Math.max(0, limits.minute - cached.count);

        if (cached.count >= limits.minute) {
          logSecurityEvent(
            'RATE_LIMIT_EXCEEDED_MINUTE' as any,
            'warning' as any,
            `Rate limit exceeded for user on endpoint`,
            { userId, endpoint },
            { tier, limit: limits.minute, current: cached.count }
          );

          return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(cached.resetAt),
            retryAfter: Math.ceil((cached.resetAt - now) / 1000),
            reason: `Minute limit exceeded (${limits.minute} req/min)`,
          };
        }

        // Increment and allow
        cached.count++;
        this.inMemoryCache.set(cacheKey, cached);

        return {
          allowed: true,
          remaining,
          resetAt: new Date(cached.resetAt),
        };
      }

      // Fetch from Firestore if cache miss or expired
      const docRef = this.db.collection('rate_limits').doc(cacheKey);
      const docSnapshot = await docRef.get();
      let data = docSnapshot.data() as any;

      const minuteStart = now - minuteWindow;
      const hourStart = now - hourWindow;
      const dayStart = now - dayWindow;

      // Reset windows if expired
      if (!data || !data.minuteWindow || data.minuteWindow.resetAt < minuteStart) {
        data = {
          minuteWindow: { count: 0, resetAt: now + minuteWindow },
          hourWindow: { count: 0, resetAt: now + hourWindow },
          dayWindow: { count: 0, resetAt: now + dayWindow },
          userId,
          endpoint,
          tier,
          createdAt: new Date(),
        };
      } else {
        // Increment windows
        data.minuteWindow.count++;
        data.hourWindow.count++;
        data.dayWindow.count++;
      }

      // Save to Firestore
      await docRef.set(data, { merge: true });

      // Update in-memory cache
      this.inMemoryCache.set(cacheKey, {
        count: data.minuteWindow.count,
        resetAt: data.minuteWindow.resetAt,
      });

      // Check limits in order: minute → hour → day
      if (data.minuteWindow.count > limits.minute) {
        logSecurityEvent(
          'RATE_LIMIT_EXCEEDED_MINUTE' as any,
          'warning' as any,
          `Rate limit exceeded for user (minute window)`,
          { userId, endpoint },
          { tier, limit: limits.minute, current: data.minuteWindow.count }
        );

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(data.minuteWindow.resetAt),
          retryAfter: Math.ceil((data.minuteWindow.resetAt - now) / 1000),
          reason: `Minute limit exceeded (${limits.minute} req/min)`,
        };
      }

      if (data.hourWindow.count > limits.hour) {
        logSecurityEvent(
          'RATE_LIMIT_EXCEEDED_HOUR' as any,
          'warning' as any,
          `Rate limit exceeded for user (hour window)`,
          { userId, endpoint },
          { tier, limit: limits.hour, current: data.hourWindow.count }
        );

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(data.hourWindow.resetAt),
          retryAfter: Math.ceil((data.hourWindow.resetAt - now) / 1000),
          reason: `Hour limit exceeded (${limits.hour} req/hour)`,
        };
      }

      if (data.dayWindow.count > limits.day) {
        logSecurityEvent(
          'RATE_LIMIT_EXCEEDED_DAY' as any,
          'warning' as any,
          `Rate limit exceeded for user (day window)`,
          { userId, endpoint },
          { tier, limit: limits.day, current: data.dayWindow.count }
        );

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(data.dayWindow.resetAt),
          retryAfter: Math.ceil((data.dayWindow.resetAt - now) / 1000),
          reason: `Day limit exceeded (${limits.day} req/day)`,
        };
      }

      const minuteRemaining = Math.max(0, limits.minute - data.minuteWindow.count);

      return {
        allowed: true,
        remaining: minuteRemaining,
        resetAt: new Date(data.minuteWindow.resetAt),
      };
    } catch (error: any) {
      logSecurityEvent(
        'RATE_LIMIT_CHECK_FAILED' as any,
        'error' as any,
        `Rate limit check failed: ${error.message}`,
        { userId, endpoint },
        { error: error.message }
      );

      // Fail open (allow on error, but log it)
      return {
        allowed: true,
        remaining: DEFAULT_LIMITS[tier].minute,
        resetAt: new Date(Date.now() + 60000),
        reason: 'Error checking limit, allowed to proceed',
      };
    }
  }

  public async resetLimit(userId: string, endpoint: string): Promise<void> {
    const cacheKey = `${userId}:${endpoint}`;
    this.inMemoryCache.delete(cacheKey);

    try {
      await this.db.collection('rate_limits').doc(cacheKey).delete();
    } catch (error) {
      console.error('Error resetting rate limit:', error);
    }
  }

  public async getUserLimitStatus(userId: string, tier: 'free' | 'pro' | 'premium'): Promise<Record<string, RateLimitStatus>> {
    try {
      const snapshot = await this.db
        .collection('rate_limits')
        .where('userId', '==', userId)
        .get();

      const statuses: Record<string, RateLimitStatus> = {};

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const endpoint = data.endpoint || 'unknown';
        const limits = DEFAULT_LIMITS[tier];
        const now = Date.now();

        statuses[endpoint] = {
          allowed: data.minuteWindow.count <= limits.minute,
          remaining: Math.max(0, limits.minute - data.minuteWindow.count),
          resetAt: new Date(data.minuteWindow.resetAt),
        };
      }

      return statuses;
    } catch (error: any) {
      console.error('Error fetching user limit status:', error);
      return {};
    }
  }

  public async getGlobalStats(): Promise<{
    totalChecks: number;
    totalExceeded: number;
    topExceededEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    try {
      const snapshot = await this.db.collection('rate_limits').get();

      let totalChecks = 0;
      let totalExceeded = 0;
      const endpointCounts: Record<string, number> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalChecks++;

        const limits = DEFAULT_LIMITS[data.tier || 'free'];
        if (data.minuteWindow.count > limits.minute) {
          totalExceeded++;
          endpointCounts[data.endpoint] = (endpointCounts[data.endpoint] || 0) + 1;
        }
      });

      const topExceededEndpoints = Object.entries(endpointCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));

      return {
        totalChecks,
        totalExceeded,
        topExceededEndpoints,
      };
    } catch (error: any) {
      console.error('Error fetching global stats:', error);
      return {
        totalChecks: 0,
        totalExceeded: 0,
        topExceededEndpoints: [],
      };
    }
  }

  public clearInMemoryCache(): void {
    this.inMemoryCache.clear();
  }
}

export const rateLimitService = new RateLimitService();
