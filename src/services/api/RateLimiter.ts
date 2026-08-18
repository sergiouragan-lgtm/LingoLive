import { Request, Response, NextFunction } from "express";

/**
 * Configuration options for the sliding window rate limiter.
 */
export interface RateLimiterOptions {
  windowMs: number;  // The size of the sliding window in milliseconds
  max: number;       // The maximum number of requests allowed within the window
  message: string;   // The error message returned when limit is exceeded
}

/**
 * A highly resilient sliding window log rate limiting service.
 * Enforces strict control of transaction frequency mapped to ISO 27001 DDoS protection standards.
 */
export class SlidingWindowRateLimiter {
  // Global memory storage mapping unique client-endpoint keys to their request timestamp log arrays
  private static storage = new Map<string, number[]>();

  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  /**
   * Checks whether a request should be allowed for a given unique key under the current sliding window.
   * Prunes stale timestamps older than (now - windowMs).
   * 
   * @returns an object indicating if allowed, remaining budget, reset millisecond delta, and current count
   */
  public check(key: string): { allowed: boolean; remaining: number; resetMs: number; currentCount: number } {
    const now = Date.now();
    const timestamps = SlidingWindowRateLimiter.storage.get(key) || [];
    
    // Prune expired timestamps that lie outside the sliding window
    const cutoff = now - this.options.windowMs;
    const validTimestamps = timestamps.filter(t => t > cutoff);
    
    const currentCount = validTimestamps.length;
    
    if (currentCount >= this.options.max) {
      // Calculate reset time: the oldest timestamp within the current window must slide out
      const oldestTimestamp = validTimestamps[0] || now;
      const resetMs = (oldestTimestamp + this.options.windowMs) - now;
      
      // Keep storage clean with the pruned list
      if (validTimestamps.length !== timestamps.length) {
        SlidingWindowRateLimiter.storage.set(key, validTimestamps);
      }
      
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
        currentCount
      };
    }
    
    // Add the current request timestamp
    validTimestamps.push(now);
    SlidingWindowRateLimiter.storage.set(key, validTimestamps);
    
    return {
      allowed: true,
      remaining: this.options.max - validTimestamps.length,
      resetMs: this.options.windowMs,
      currentCount: validTimestamps.length
    };
  }

  /**
   * Express middleware factory for easy integration with API endpoints.
   */
  public getMiddleware() {
    return (req: any, res: Response, next: NextFunction) => {
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown-ip";
      const uid = req.user?.uid || "anonymous";
      // Dynamic key combines request path, client IP, and Authenticated User UID for precise multi-layered protection
      const key = `${req.path}_${ip}_${uid}`;

      const result = this.check(key);

      // standard HTTP headers for rate limiting
      res.setHeader("X-RateLimit-Limit", this.options.max);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset-Ms", result.resetMs);

      if (!result.allowed) {
        res.setHeader("Retry-After", Math.ceil(result.resetMs / 1000));
        return res.status(429).json({
          error: this.options.message,
          retryAfterSeconds: Math.ceil(result.resetMs / 1000),
          limit: this.options.max,
          windowMs: this.options.windowMs
        });
      }

      next();
    };
  }

  /**
   * Explicitly resets a rate limiting record (useful for testing or manual admin intervention)
   */
  public static reset(key: string): void {
    SlidingWindowRateLimiter.storage.delete(key);
  }

  /**
   * Periodically cleans up inactive rate limiter records to prevent in-memory memory leaks
   * of long-running servers.
   */
  public static startPruningInterval(intervalMs = 300000): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of SlidingWindowRateLimiter.storage.entries()) {
        // Remove timestamps older than 1 hour to keep memory footprint minimal
        const cutoff = now - 3600000;
        const valid = timestamps.filter(t => t > cutoff);
        if (valid.length === 0) {
          SlidingWindowRateLimiter.storage.delete(key);
        } else if (valid.length !== timestamps.length) {
          SlidingWindowRateLimiter.storage.set(key, valid);
        }
      }
    }, intervalMs);
  }
}

// Automatically start background pruning to protect service memory
SlidingWindowRateLimiter.startPruningInterval();

/**
 * Inline helper to construct a pre-configured Sliding Window rate limiting middleware
 */
export function createSlidingWindowLimiter(options: RateLimiterOptions) {
  const limiter = new SlidingWindowRateLimiter(options);
  return limiter.getMiddleware();
}
