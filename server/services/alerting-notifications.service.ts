import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface AlertRule {
  ruleId: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

export interface AlertNotification {
  notificationId: string;
  ruleId: string;
  channel: 'email' | 'slack' | 'sms' | 'webhook' | 'in-app';
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

export interface AlertEscalation {
  escalationId: string;
  ruleId: string;
  level: number;
  delayMinutes: number;
  recipients: string[];
  notificationChannels: Array<'email' | 'slack' | 'sms' | 'webhook'>;
  maxLevel: number;
}

export interface AlertSuppression {
  suppressionId: string;
  ruleId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  suppressedBy: string;
  active: boolean;
}

export interface AlertIncident {
  incidentId: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved' | 'suppressed';
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  message: string;
  metadata: Record<string, any>;
}

export interface NotificationChannel {
  channelId: string;
  type: 'email' | 'slack' | 'sms' | 'webhook' | 'in-app';
  config: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
}

export interface AlertStatistics {
  statisticsId: string;
  timeRange: { start: Date; end: Date };
  totalAlerts: number;
  alertsBySeverity: Record<string, number>;
  alertsByChannel: Record<string, number>;
  failedNotifications: number;
  averageResponseTime: number;
}

class AlertingNotificationsService {
  private db = getFirestore();

  async createAlertRule(
    name: string,
    condition: string,
    threshold: number,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<AlertRule> {
    try {
      const ruleId = `rule_${Date.now()}`;

      const rule: AlertRule = {
        ruleId,
        name,
        condition,
        threshold,
        severity,
        enabled: true,
        createdAt: new Date(),
      };

      await this.db.collection('alert_rules').doc(ruleId).set(rule);

      logSecurityEvent('ALERT_RULE_CREATED' as any, 'info' as any, 'Alert rule created', {
        ruleId,
        name,
        severity,
      });

      return rule;
    } catch (error) {
      logSecurityEvent('ALERT_RULE_CREATION_FAILED' as any, 'error' as any, 'Failed to create alert rule', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async sendNotification(
    ruleId: string,
    channel: 'email' | 'slack' | 'sms' | 'webhook' | 'in-app',
    recipient: string,
    message: string
  ): Promise<AlertNotification> {
    try {
      const notificationId = `notif_${Date.now()}`;

      const notification: AlertNotification = {
        notificationId,
        ruleId,
        channel,
        recipient,
        message,
        status: 'pending',
        timestamp: new Date(),
        retryCount: 0,
      };

      await this.db.collection('alert_notifications').doc(notificationId).set(notification);

      logSecurityEvent('ALERT_NOTIFICATION_SENT' as any, 'info' as any, 'Alert notification sent', {
        notificationId,
        channel,
        recipient,
      });

      return notification;
    } catch (error) {
      logSecurityEvent('ALERT_NOTIFICATION_FAILED' as any, 'error' as any, 'Failed to send notification', {
        ruleId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async configureEscalation(
    ruleId: string,
    level: number,
    delayMinutes: number,
    recipients: string[],
    notificationChannels: Array<'email' | 'slack' | 'sms' | 'webhook'>,
    maxLevel: number
  ): Promise<AlertEscalation> {
    try {
      const escalationId = `escalation_${Date.now()}`;

      const escalation: AlertEscalation = {
        escalationId,
        ruleId,
        level,
        delayMinutes,
        recipients,
        notificationChannels,
        maxLevel,
      };

      await this.db.collection('alert_escalations').doc(escalationId).set(escalation);

      logSecurityEvent('ESCALATION_CONFIGURED' as any, 'info' as any, 'Alert escalation configured', {
        escalationId,
        ruleId,
        level,
      });

      return escalation;
    } catch (error) {
      logSecurityEvent('ESCALATION_CONFIGURATION_FAILED' as any, 'error' as any, 'Failed to configure escalation', {
        ruleId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async suppressAlert(
    ruleId: string,
    startTime: Date,
    endTime: Date,
    reason: string,
    suppressedBy: string
  ): Promise<AlertSuppression> {
    try {
      const suppressionId = `suppression_${Date.now()}`;

      const suppression: AlertSuppression = {
        suppressionId,
        ruleId,
        startTime,
        endTime,
        reason,
        suppressedBy,
        active: true,
      };

      await this.db.collection('alert_suppressions').doc(suppressionId).set(suppression);

      logSecurityEvent('ALERT_SUPPRESSED' as any, 'info' as any, 'Alert suppressed', {
        suppressionId,
        ruleId,
        reason,
      });

      return suppression;
    } catch (error) {
      logSecurityEvent('ALERT_SUPPRESSION_FAILED' as any, 'error' as any, 'Failed to suppress alert', {
        ruleId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createIncident(
    ruleId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    metadata: Record<string, any>
  ): Promise<AlertIncident> {
    try {
      const incidentId = `incident_${Date.now()}`;

      const incident: AlertIncident = {
        incidentId,
        ruleId,
        severity,
        status: 'open',
        triggeredAt: new Date(),
        message,
        metadata,
      };

      await this.db.collection('alert_incidents').doc(incidentId).set(incident);

      logSecurityEvent('ALERT_INCIDENT_CREATED' as any, 'warn' as any, 'Alert incident created', {
        incidentId,
        ruleId,
        severity,
      });

      return incident;
    } catch (error) {
      logSecurityEvent('ALERT_INCIDENT_CREATION_FAILED' as any, 'error' as any, 'Failed to create incident', {
        ruleId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async configureNotificationChannel(
    type: 'email' | 'slack' | 'sms' | 'webhook' | 'in-app',
    config: Record<string, any>
  ): Promise<NotificationChannel> {
    try {
      const channelId = `channel_${Date.now()}`;

      const channel: NotificationChannel = {
        channelId,
        type,
        config,
        enabled: true,
        createdAt: new Date(),
      };

      await this.db.collection('notification_channels').doc(channelId).set(channel);

      logSecurityEvent('NOTIFICATION_CHANNEL_CONFIGURED' as any, 'info' as any, 'Notification channel configured', {
        channelId,
        type,
      });

      return channel;
    } catch (error) {
      logSecurityEvent('NOTIFICATION_CHANNEL_CONFIGURATION_FAILED' as any, 'error' as any, 'Failed to configure notification channel', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async acknowledgeIncident(
    incidentId: string
  ): Promise<AlertIncident> {
    try {
      const incidentDoc = await this.db.collection('alert_incidents').doc(incidentId).get();
      const incident = incidentDoc.data() as AlertIncident;

      if (!incident) throw new Error('Incident not found');

      const updatedIncident: AlertIncident = {
        ...incident,
        status: 'acknowledged',
        acknowledgedAt: new Date(),
      };

      await incidentDoc.ref.update(updatedIncident);

      logSecurityEvent('ALERT_INCIDENT_ACKNOWLEDGED' as any, 'info' as any, 'Alert incident acknowledged', {
        incidentId,
      });

      return updatedIncident;
    } catch (error) {
      logSecurityEvent('ALERT_INCIDENT_ACKNOWLEDGEMENT_FAILED' as any, 'error' as any, 'Failed to acknowledge incident', {
        incidentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async resolveIncident(
    incidentId: string
  ): Promise<AlertIncident> {
    try {
      const incidentDoc = await this.db.collection('alert_incidents').doc(incidentId).get();
      const incident = incidentDoc.data() as AlertIncident;

      if (!incident) throw new Error('Incident not found');

      const updatedIncident: AlertIncident = {
        ...incident,
        status: 'resolved',
        resolvedAt: new Date(),
      };

      await incidentDoc.ref.update(updatedIncident);

      logSecurityEvent('ALERT_INCIDENT_RESOLVED' as any, 'info' as any, 'Alert incident resolved', {
        incidentId,
      });

      return updatedIncident;
    } catch (error) {
      logSecurityEvent('ALERT_INCIDENT_RESOLUTION_FAILED' as any, 'error' as any, 'Failed to resolve incident', {
        incidentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getAlertStatistics(
    startTime: Date,
    endTime: Date
  ): Promise<AlertStatistics> {
    try {
      const statisticsId = `stats_${Date.now()}`;

      const incidentsSnapshot = await this.db.collection('alert_incidents')
        .where('triggeredAt', '>=', startTime)
        .where('triggeredAt', '<=', endTime)
        .get();

      const incidents = incidentsSnapshot.docs.map((doc) => doc.data() as AlertIncident);

      const alertsBySeverity: Record<string, number> = {};
      const alertsByChannel: Record<string, number> = {};
      let failedNotifications = 0;
      let totalResponseTime = 0;
      let countedIncidents = 0;

      for (const incident of incidents) {
        alertsBySeverity[incident.severity] = (alertsBySeverity[incident.severity] || 0) + 1;
        if (incident.acknowledgedAt) {
          totalResponseTime += incident.acknowledgedAt.getTime() - incident.triggeredAt.getTime();
          countedIncidents++;
        }
      }

      const notificationsSnapshot = await this.db.collection('alert_notifications')
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime)
        .get();

      const notifications = notificationsSnapshot.docs.map((doc) => doc.data() as AlertNotification);

      for (const notification of notifications) {
        alertsByChannel[notification.channel] = (alertsByChannel[notification.channel] || 0) + 1;
        if (notification.status === 'failed') failedNotifications++;
      }

      const statistics: AlertStatistics = {
        statisticsId,
        timeRange: { start: startTime, end: endTime },
        totalAlerts: incidents.length,
        alertsBySeverity,
        alertsByChannel,
        failedNotifications,
        averageResponseTime: countedIncidents > 0 ? totalResponseTime / countedIncidents : 0,
      };

      await this.db.collection('alert_statistics').doc(statisticsId).set(statistics);

      logSecurityEvent('ALERT_STATISTICS_GENERATED' as any, 'info' as any, 'Alert statistics generated', {
        statisticsId,
        totalAlerts: incidents.length,
      });

      return statistics;
    } catch (error) {
      logSecurityEvent('ALERT_STATISTICS_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate alert statistics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const alertingNotificationsService = new AlertingNotificationsService();
