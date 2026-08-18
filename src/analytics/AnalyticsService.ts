import { eventBus } from './bus/EventBus';
import { BaseEvent } from './events/types';
import { eventPersistenceService } from './bus/EventPersistence';
import { Logger } from '../observability/Logger';

const logger = new Logger('AnalyticsService');

export class AnalyticsService {
  constructor() {
    this.init();
  }

  private init() {
    // Subscribe to ALL events or a specific set
    // For now, let's subscribe to all for persistence
    // In a real system, we'd have a wildcard subscription
    
    // As per enterprise requirements, we persist everything
    // This is a simplified implementation of a wildcard subscription
    // We would need to modify the EventBus to support wildcard subscriptions
  }

  async publish(event: BaseEvent) {
    logger.info('Publishing event', event.eventName, { eventId: event.eventId });
    await eventPersistenceService.persistEvent(event);
    eventBus.publish(event);
  }
}

export const analyticsService = new AnalyticsService();
