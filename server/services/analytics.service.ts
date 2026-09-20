import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export type EventType =
  | 'page_view'
  | 'lesson_start'
  | 'lesson_complete'
  | 'quiz_attempt'
  | 'quiz_complete'
  | 'pronunciation_practice'
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'content_shared'
  | 'feature_flag_evaluated'
  | 'error_occurred';

export interface UserEvent {
  id: string;
  userId: string;
  eventType: EventType;
  timestamp: Date;
  metadata: Record<string, any>;
  sessionId: string;
  deviceInfo?: {
    platform: string;
    appVersion?: string;
    osVersion?: string;
  };
}

export interface EventStats {
  totalEvents: number;
  uniqueUsers: number;
  eventsByType: Record<EventType, number>;
  eventsInLast24h: number;
  topEvents: Array<{ event: EventType; count: number }>;
}

class AnalyticsService {
  private db: FirebaseFirestore.Firestore;
  private eventBuffer: UserEvent[] = [];
  private bufferSize = 100;

  constructor() {
    this.db = getFirestore();
    this.startBufferFlush();
  }

  public async trackEvent(
    userId: string,
    eventType: EventType,
    metadata: Record<string, any> = {},
    sessionId: string = 'unknown'
  ): Promise<void> {
    const event: UserEvent = {
      id: `${userId}-${eventType}-${Date.now()}`,
      userId,
      eventType,
      timestamp: new Date(),
      metadata,
      sessionId,
    };

    this.eventBuffer.push(event);

    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushEventBuffer();
    }
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const batch = this.db.batch();
      const toWrite = this.eventBuffer.splice(0, this.bufferSize);

      for (const event of toWrite) {
        const ref = this.db.collection('user_events').doc(event.id);
        batch.set(ref, event);
      }

      await batch.commit();

      logSecurityEvent(
        'EVENTS_FLUSHED' as any,
        'info' as any,
        `Flushed ${toWrite.length} events to Firestore`,
        {},
        { count: toWrite.length }
      );
    } catch (error: any) {
      console.error('Error flushing event buffer:', error);
      logSecurityEvent(
        'EVENT_BUFFER_FLUSH_FAILED' as any,
        'warning' as any,
        `Failed to flush event buffer: ${error.message}`,
        {},
        { error: error.message }
      );
    }
  }

  public async getEventHistory(
    userId: string,
    limit: number = 100,
    eventType?: EventType
  ): Promise<UserEvent[]> {
    try {
      let query = this.db
        .collection('user_events')
        .where('userId', '==', userId);

      if (eventType) {
        query = query.where('eventType', '==', eventType);
      }

      const snapshot = await query
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as UserEvent);
    } catch (error: any) {
      console.error('Error fetching event history:', error);
      return [];
    }
  }

  public async getEventStats(
    timeWindowDays: number = 7
  ): Promise<EventStats> {
    try {
      const cutoffDate = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000);

      const snapshot = await this.db
        .collection('user_events')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const events = snapshot.docs.map((doc) => doc.data() as UserEvent);
      const uniqueUsers = new Set(events.map((e) => e.userId)).size;
      const eventsByType: Record<string, number> = {};
      const eventCounts: Array<{ event: EventType; count: number }> = [];

      events.forEach((event) => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      });

      Object.entries(eventsByType).forEach(([event, count]) => {
        eventCounts.push({ event: event as EventType, count });
      });

      eventCounts.sort((a, b) => b.count - a.count);

      return {
        totalEvents: events.length,
        uniqueUsers,
        eventsByType: eventsByType as Record<EventType, number>,
        eventsInLast24h: events.filter(
          (e) => e.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
        ).length,
        topEvents: eventCounts.slice(0, 10),
      };
    } catch (error: any) {
      console.error('Error fetching event stats:', error);
      return {
        totalEvents: 0,
        uniqueUsers: 0,
        eventsByType: {} as Record<EventType, number>,
        eventsInLast24h: 0,
        topEvents: [],
      };
    }
  }

  public async getUserEventTimeline(
    userId: string,
    days: number = 30
  ): Promise<Array<{ date: string; count: number }>> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const snapshot = await this.db
        .collection('user_events')
        .where('userId', '==', userId)
        .where('timestamp', '>=', cutoffDate)
        .orderBy('timestamp', 'desc')
        .get();

      const events = snapshot.docs.map((doc) => doc.data() as UserEvent);
      const timeline: Record<string, number> = {};

      events.forEach((event) => {
        const date = event.timestamp.toISOString().split('T')[0];
        timeline[date] = (timeline[date] || 0) + 1;
      });

      return Object.entries(timeline)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error: any) {
      console.error('Error fetching user timeline:', error);
      return [];
    }
  }

  private startBufferFlush(): void {
    setInterval(() => {
      this.flushEventBuffer().catch((err) =>
        console.error('Buffer flush error:', err)
      );
    }, 30 * 1000);
  }

  public async ensureFlushed(): Promise<void> {
    await this.flushEventBuffer();
  }
}

export const analyticsService = new AnalyticsService();
