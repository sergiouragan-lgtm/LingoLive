export interface BaseEvent {
  eventId: string;
  eventName: string;
  category: string;
  version: string;
  timestamp: string;
  tenantId: string;
  userId: string;
  sessionId: string;
  correlationId: string;
  traceId: string;
  country?: string;
  language?: string;
  device?: string;
  platform?: string;
  appVersion: string;
  module: string;
  source: string;
  payload: Record<string, any>;
  metadata: Record<string, any>;
}
