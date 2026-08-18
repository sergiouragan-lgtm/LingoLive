import { analyticsService } from '../AnalyticsService';
import { EVENT_NAMES, EventName } from '../events/catalog';
import { BaseEvent } from '../events/types';

// In a real application, this would come from a Context provider
interface AuditContext {
  userId: string;
  tenantId: string;
  sessionId: string;
  country?: string;
  language?: string;
  device?: string;
}

export const auditEvent = async (
  eventName: EventName,
  payload: Record<string, any>,
  context: AuditContext,
  module: string,
  source: string
) => {
  const event: BaseEvent = {
    eventId: crypto.randomUUID(),
    eventName,
    category: 'AUDIT', // Simplified category
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    tenantId: context.tenantId,
    userId: context.userId,
    sessionId: context.sessionId,
    correlationId: crypto.randomUUID(),
    traceId: crypto.randomUUID(),
    country: context.country,
    language: context.language,
    device: context.device,
    appVersion: '1.0.0',
    module,
    source,
    payload,
    metadata: {
      action: 'AUDIT_INTERCEPTED',
    },
  };

  await analyticsService.publish(event);
};

export const withAudit = <T extends any[]>(
  handler: (...args: T) => void | Promise<void>,
  eventName: EventName,
  context: AuditContext,
  module: string,
  source: string
) => {
  return async (...args: T) => {
    // Run the handler
    const result = await handler(...args);
    
    // Audit the action
    await auditEvent(eventName, { args }, context, module, source);
    
    return result;
  };
};
