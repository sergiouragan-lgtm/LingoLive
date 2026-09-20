import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface CacheEntry {
  key: string;
  value: any;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  tags: string[];
}

export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  hits: number;
  misses: number;
  memorySize: number;
}

class CacheService {
  private db: Firestore;
  private memoryCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private stats = { hits: 0, misses: 0 };
  private tagMap: Map<string, Set<string>> = new Map(); // tag -> keys

  constructor() {
    this.db = getFirestore();
    this.startCleanupJob();
  }

  public async get<T = any>(key: string): Promise<T | null> {
    try {
      // Check memory cache first
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        this.stats.hits++;
        logSecurityEvent(
          'CACHE_HIT' as any,
          'info' as any,
          `Cache hit for key: ${key}`,
          {},
          { key, source: 'memory' }
        );
        return cached.value as T;
      }

      // Check Firestore cache
      const docSnapshot = await this.db.collection('cache').doc(key).get();
      if (docSnapshot.exists) {
        const data = docSnapshot.data() as any;
        if (data.expiresAt.toDate().getTime() > Date.now()) {
          this.stats.hits++;

          // Promote to memory cache
          this.memoryCache.set(key, {
            value: data.value,
            expiresAt: data.expiresAt.toDate().getTime(),
          });

          return data.value as T;
        } else {
          // Expired, delete it
          await docSnapshot.ref.delete();
        }
      }

      this.stats.misses++;
      logSecurityEvent(
        'CACHE_MISS' as any,
        'info' as any,
        `Cache miss for key: ${key}`,
        {},
        { key }
      );

      return null;
    } catch (error: any) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  public async set<T = any>(
    key: string,
    value: T,
    ttlSeconds: number = 300,
    tags: string[] = []
  ): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

      // Store in memory cache
      this.memoryCache.set(key, {
        value,
        expiresAt: expiresAt.getTime(),
      });

      // Store in Firestore
      await this.db.collection('cache').doc(key).set({
        key,
        value,
        ttl: ttlSeconds,
        createdAt: now,
        expiresAt,
        tags,
      });

      // Update tag map
      for (const tag of tags) {
        if (!this.tagMap.has(tag)) {
          this.tagMap.set(tag, new Set());
        }
        this.tagMap.get(tag)!.add(key);
      }

      logSecurityEvent(
        'CACHE_SET' as any,
        'info' as any,
        `Cache set for key: ${key}`,
        {},
        { key, ttl: ttlSeconds, tags: tags.length }
      );
    } catch (error: any) {
      console.error('Cache set error:', error);
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await this.db.collection('cache').doc(key).delete();

      // Remove from tag map
      for (const [tag, keys] of this.tagMap.entries()) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagMap.delete(tag);
        }
      }

      logSecurityEvent(
        'CACHE_DELETE' as any,
        'info' as any,
        `Cache deleted: ${key}`,
        {},
        { key }
      );
    } catch (error: any) {
      console.error('Cache delete error:', error);
    }
  }

  public async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = this.tagMap.get(tag) || new Set();
      let count = 0;

      for (const key of keys) {
        await this.delete(key);
        count++;
      }

      this.tagMap.delete(tag);

      logSecurityEvent(
        'CACHE_INVALIDATE_TAG' as any,
        'info' as any,
        `Cache invalidated by tag: ${tag}`,
        {},
        { tag, count }
      );

      return count;
    } catch (error: any) {
      console.error('Cache invalidate by tag error:', error);
      return 0;
    }
  }

  public async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      this.tagMap.clear();

      const snapshot = await this.db.collection('cache').get();
      const batch = this.db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logSecurityEvent(
        'CACHE_CLEAR_ALL' as any,
        'info' as any,
        'All cache cleared',
        {},
        {}
      );
    } catch (error: any) {
      console.error('Cache clear error:', error);
    }
  }

  public getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    let memorySize = 0;
    for (const [, item] of this.memoryCache.entries()) {
      memorySize += JSON.stringify(item.value).length;
    }

    return {
      totalKeys: this.memoryCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      hits: this.stats.hits,
      misses: this.stats.misses,
      memorySize,
    };
  }

  public resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  private startCleanupJob(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(async () => {
      try {
        const now = new Date();

        // Cleanup memory cache
        for (const [key, item] of this.memoryCache.entries()) {
          if (item.expiresAt < Date.now()) {
            this.memoryCache.delete(key);
          }
        }

        // Cleanup Firestore cache
        const snapshot = await this.db
          .collection('cache')
          .where('expiresAt', '<', now)
          .get();

        if (snapshot.size > 0) {
          const batch = this.db.batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          console.log(`Cache cleanup: Removed ${snapshot.size} expired entries`);
        }
      } catch (error) {
        console.error('Cache cleanup job error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}

export const cacheService = new CacheService();
