import { BaseEvent } from '../events/types';

type EventHandler = (event: BaseEvent) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private globalSubscribers: EventHandler[] = [];

  publish(event: BaseEvent) {
    const handlers = this.handlers.get(event.eventName) || [];
    handlers.forEach(handler => handler(event));
    this.globalSubscribers.forEach(handler => handler(event));
  }

  subscribe(eventName: string, handler: EventHandler) {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  subscribeGlobal(handler: EventHandler) {
    this.globalSubscribers.push(handler);
  }
}

export const eventBus = new EventBus();
