import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface SecurityEvent {
  eventId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  source: string;
  description: string;
  userId?: string;
  ipAddress?: string;
  metadata: Record<string, any>;
  status: 'new' | 'acknowledged' | 'in-review' | 'resolved';
}

export interface IncidentResponse {
  responseId: string;
  eventId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'on-hold' | 'resolved' | 'closed';
  createdAt: Date;
  resolvedAt?: Date;
  assignedTo: string;
  actions: ResponseAction[];
  timeline: Timeline[];
}

export interface ResponseAction {
  actionId: string;
  action: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
  dueDate: Date;
  completedDate?: Date;
}

export interface Timeline {
  timestamp: Date;
  event: string;
  actor: string;
  details?: string;
}

export interface IncidentEscalation {
  escalationId: string;
  incidentId: string;
  escalationLevel: number;
  escalatedTo: string;
  reason: string;
  escalatedAt: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
}

export interface SecurityAlert {
  alertId: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: Date;
  recipients: string[];
  channels: string[];
  status: 'triggered' | 'sent' | 'acknowledged';
}

export interface IncidentMetrics {
  metricsId: string;
  timestamp: Date;
  totalIncidents: number;
  openIncidents: number;
  averageResolutionTime: number;
  criticalIncidents: number;
  highIncidents: number;
  mediumIncidents: number;
  lowIncidents: number;
  mttr: number;
  mtbf: number;
}

class SecurityEventManagementService {
  private db = getFirestore();

  async createSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    source: string,
    description: string,
    metadata: Record<string, any>,
    userId?: string,
    ipAddress?: string
  ): Promise<SecurityEvent> {
    try {
      const eventId = `event_${Date.now()}`;

      const event: SecurityEvent = {
        eventId,
        eventType,
        severity,
        timestamp: new Date(),
        source,
        description,
        userId,
        ipAddress,
        metadata,
        status: 'new',
      };

      await this.db.collection('security_events').doc(eventId).set(event);

      logSecurityEvent('SECURITY_EVENT_CREATED' as any, 'warn' as any, 'Security event created', {
        eventId,
        eventType,
        severity,
        source,
      });

      return event;
    } catch (error) {
      logSecurityEvent('SECURITY_EVENT_CREATION_FAILED' as any, 'error' as any, 'Failed to create security event', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async initiateIncidentResponse(
    eventId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    assignedTo: string
  ): Promise<IncidentResponse> {
    try {
      const responseId = `response_${Date.now()}`;

      const response: IncidentResponse = {
        responseId,
        eventId,
        severity,
        status: 'open',
        createdAt: new Date(),
        assignedTo,
        actions: [],
        timeline: [{
          timestamp: new Date(),
          event: 'Incident response initiated',
          actor: assignedTo,
        }],
      };

      await this.db.collection('incident_responses').doc(responseId).set(response);

      logSecurityEvent('INCIDENT_RESPONSE_INITIATED' as any, 'warn' as any, 'Incident response initiated', {
        responseId,
        eventId,
        severity,
        assignedTo,
      });

      return response;
    } catch (error) {
      logSecurityEvent('INCIDENT_RESPONSE_INITIATION_FAILED' as any, 'error' as any, 'Failed to initiate incident response', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async addResponseAction(
    responseId: string,
    action: string,
    assignedTo: string,
    dueDate: Date
  ): Promise<ResponseAction> {
    try {
      const actionId = `action_${Date.now()}`;

      const responseAction: ResponseAction = {
        actionId,
        action,
        status: 'pending',
        assignedTo,
        dueDate,
      };

      const responseDoc = await this.db.collection('incident_responses').doc(responseId).get();
      const response = responseDoc.data() as IncidentResponse;

      if (!response) throw new Error('Incident response not found');

      const updatedResponse = {
        ...response,
        actions: [...response.actions, responseAction],
        timeline: [...response.timeline, {
          timestamp: new Date(),
          event: `Action added: ${action}`,
          actor: assignedTo,
        }],
      };

      await responseDoc.ref.update(updatedResponse);

      logSecurityEvent('INCIDENT_ACTION_ADDED' as any, 'info' as any, 'Incident action added', {
        responseId,
        actionId,
        action,
      });

      return responseAction;
    } catch (error) {
      logSecurityEvent('INCIDENT_ACTION_ADDITION_FAILED' as any, 'error' as any, 'Failed to add incident action', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async escalateIncident(
    responseId: string,
    escalationLevel: number,
    escalatedTo: string,
    reason: string
  ): Promise<IncidentEscalation> {
    try {
      const escalationId = `escalation_${Date.now()}`;

      const escalation: IncidentEscalation = {
        escalationId,
        incidentId: responseId,
        escalationLevel,
        escalatedTo,
        reason,
        escalatedAt: new Date(),
        status: 'pending',
      };

      await this.db.collection('incident_escalations').doc(escalationId).set(escalation);

      logSecurityEvent('INCIDENT_ESCALATED' as any, 'warn' as any, 'Incident escalated', {
        escalationId,
        responseId,
        escalationLevel,
        escalatedTo,
        reason,
      });

      return escalation;
    } catch (error) {
      logSecurityEvent('INCIDENT_ESCALATION_FAILED' as any, 'error' as any, 'Failed to escalate incident', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async resolveIncident(
    responseId: string
  ): Promise<IncidentResponse> {
    try {
      const responseDoc = await this.db.collection('incident_responses').doc(responseId).get();
      const response = responseDoc.data() as IncidentResponse;

      if (!response) throw new Error('Incident response not found');

      const resolvedResponse: IncidentResponse = {
        ...response,
        status: 'resolved',
        resolvedAt: new Date(),
        timeline: [...response.timeline, {
          timestamp: new Date(),
          event: 'Incident resolved',
          actor: 'system',
        }],
      };

      await responseDoc.ref.update(resolvedResponse);

      logSecurityEvent('INCIDENT_RESOLVED' as any, 'info' as any, 'Incident resolved', {
        responseId,
      });

      return resolvedResponse;
    } catch (error) {
      logSecurityEvent('INCIDENT_RESOLUTION_FAILED' as any, 'error' as any, 'Failed to resolve incident', {
        responseId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async triggerSecurityAlert(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    recipients: string[],
    channels: string[]
  ): Promise<SecurityAlert> {
    try {
      const alertId = `alert_${Date.now()}`;

      const alert: SecurityAlert = {
        alertId,
        eventType,
        severity,
        message,
        createdAt: new Date(),
        recipients,
        channels,
        status: 'triggered',
      };

      await this.db.collection('security_alerts').doc(alertId).set(alert);

      logSecurityEvent('SECURITY_ALERT_TRIGGERED' as any, 'warn' as any, 'Security alert triggered', {
        alertId,
        eventType,
        severity,
        recipients: recipients.join(','),
      });

      return alert;
    } catch (error) {
      logSecurityEvent('SECURITY_ALERT_TRIGGERING_FAILED' as any, 'error' as any, 'Failed to trigger security alert', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getIncidentMetrics(
    timeRange: { start: Date; end: Date }
  ): Promise<IncidentMetrics> {
    try {
      const metricsId = `metrics_${Date.now()}`;

      const responsesSnapshot = await this.db.collection('incident_responses')
        .where('createdAt', '>=', timeRange.start)
        .where('createdAt', '<=', timeRange.end)
        .get();

      const responses = responsesSnapshot.docs.map((doc) => doc.data() as IncidentResponse);

      const openIncidents = responses.filter((r) => r.status === 'open' || r.status === 'in-progress').length;
      const criticalIncidents = responses.filter((r) => r.severity === 'critical').length;
      const highIncidents = responses.filter((r) => r.severity === 'high').length;
      const mediumIncidents = responses.filter((r) => r.severity === 'medium').length;
      const lowIncidents = responses.filter((r) => r.severity === 'low').length;

      const resolvedResponses = responses.filter((r) => r.resolvedAt);
      const avgResolutionTime = resolvedResponses.length > 0
        ? resolvedResponses.reduce((sum, r) => sum + ((r.resolvedAt?.getTime() || 0) - r.createdAt.getTime()), 0) / resolvedResponses.length
        : 0;

      const metrics: IncidentMetrics = {
        metricsId,
        timestamp: new Date(),
        totalIncidents: responses.length,
        openIncidents,
        averageResolutionTime: avgResolutionTime,
        criticalIncidents,
        highIncidents,
        mediumIncidents,
        lowIncidents,
        mttr: avgResolutionTime,
        mtbf: 0,
      };

      await this.db.collection('incident_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('INCIDENT_METRICS_CALCULATED' as any, 'info' as any, 'Incident metrics calculated', {
        metricsId,
        totalIncidents: responses.length,
        openIncidents,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('INCIDENT_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate incident metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const securityEventManagementService = new SecurityEventManagementService();
