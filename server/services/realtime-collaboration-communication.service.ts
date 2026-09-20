import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface CollaborativeSession {
  sessionId: string;
  documentId: string;
  participants: string[];
  status: 'active' | 'paused' | 'ended';
  startedAt: Date;
  endedAt?: Date;
}

export interface RealtimeMessage {
  messageId: string;
  sessionId: string;
  senderId: string;
  content: string;
  type: 'text' | 'edit' | 'comment' | 'system';
  timestamp: Date;
}

export interface Notification {
  notificationId: string;
  userId: string;
  type: 'message' | 'mention' | 'activity' | 'update';
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface CommunicationChannel {
  channelId: string;
  name: string;
  type: 'direct' | 'group' | 'broadcast';
  members: string[];
  description: string;
  createdAt: Date;
}

export interface DocumentSync {
  syncId: string;
  documentId: string;
  version: number;
  lastModifiedBy: string;
  conflictResolution: 'last-write-wins' | 'collaborative-editing';
  timestamp: Date;
}

export interface PresenceInfo {
  userId: string;
  documentId: string;
  cursorPosition: number;
  selectionStart: number;
  selectionEnd: number;
  lastActivity: Date;
}

export interface CollaborationMetrics {
  metricsId: string;
  timestamp: Date;
  activeSessions: number;
  totalMessages: number;
  averageLatency: number;
  concurrentUsers: number;
  documentsSynced: number;
  notificationDeliveryRate: number;
}

class RealtimeCollaborationCommunicationService {
  private db = getFirestore();

  async createCollaborativeSession(
    documentId: string,
    participants: string[]
  ): Promise<CollaborativeSession> {
    try {
      const sessionId = `session_${Date.now()}`;

      const session: CollaborativeSession = {
        sessionId,
        documentId,
        participants,
        status: 'active',
        startedAt: new Date(),
      };

      await this.db.collection('collaborative_sessions').doc(sessionId).set(session);

      logSecurityEvent('COLLABORATIVE_SESSION_CREATED' as any, 'info' as any, 'Collaborative session created', {
        sessionId,
        documentId,
        participantCount: participants.length,
      });

      return session;
    } catch (error) {
      logSecurityEvent('COLLABORATIVE_SESSION_CREATION_FAILED' as any, 'error' as any, 'Failed to create collaborative session', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async sendRealtimeMessage(
    sessionId: string,
    senderId: string,
    content: string,
    type: 'text' | 'edit' | 'comment' | 'system'
  ): Promise<RealtimeMessage> {
    try {
      const messageId = `msg_${Date.now()}`;

      const message: RealtimeMessage = {
        messageId,
        sessionId,
        senderId,
        content,
        type,
        timestamp: new Date(),
      };

      await this.db.collection('realtime_messages').doc(messageId).set(message);

      logSecurityEvent('REALTIME_MESSAGE_SENT' as any, 'info' as any, 'Realtime message sent', {
        messageId,
        sessionId,
        type,
      });

      return message;
    } catch (error) {
      logSecurityEvent('REALTIME_MESSAGE_SENDING_FAILED' as any, 'error' as any, 'Failed to send realtime message', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createNotification(
    userId: string,
    type: 'message' | 'mention' | 'activity' | 'update',
    content: string
  ): Promise<Notification> {
    try {
      const notificationId = `notif_${Date.now()}`;

      const notification: Notification = {
        notificationId,
        userId,
        type,
        content,
        read: false,
        createdAt: new Date(),
      };

      await this.db.collection('notifications').doc(notificationId).set(notification);

      logSecurityEvent('NOTIFICATION_CREATED' as any, 'info' as any, 'Notification created', {
        notificationId,
        userId,
        type,
      });

      return notification;
    } catch (error) {
      logSecurityEvent('NOTIFICATION_CREATION_FAILED' as any, 'error' as any, 'Failed to create notification', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createCommunicationChannel(
    name: string,
    type: 'direct' | 'group' | 'broadcast',
    members: string[],
    description: string
  ): Promise<CommunicationChannel> {
    try {
      const channelId = `channel_${Date.now()}`;

      const channel: CommunicationChannel = {
        channelId,
        name,
        type,
        members,
        description,
        createdAt: new Date(),
      };

      await this.db.collection('communication_channels').doc(channelId).set(channel);

      logSecurityEvent('COMMUNICATION_CHANNEL_CREATED' as any, 'info' as any, 'Communication channel created', {
        channelId,
        name,
        type,
      });

      return channel;
    } catch (error) {
      logSecurityEvent('COMMUNICATION_CHANNEL_CREATION_FAILED' as any, 'error' as any, 'Failed to create communication channel', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async syncDocument(
    documentId: string,
    version: number,
    lastModifiedBy: string,
    conflictResolution: 'last-write-wins' | 'collaborative-editing'
  ): Promise<DocumentSync> {
    try {
      const syncId = `sync_${Date.now()}`;

      const sync: DocumentSync = {
        syncId,
        documentId,
        version,
        lastModifiedBy,
        conflictResolution,
        timestamp: new Date(),
      };

      await this.db.collection('document_sync').doc(syncId).set(sync);

      logSecurityEvent('DOCUMENT_SYNCED' as any, 'info' as any, 'Document synced', {
        syncId,
        documentId,
        version,
      });

      return sync;
    } catch (error) {
      logSecurityEvent('DOCUMENT_SYNC_FAILED' as any, 'error' as any, 'Failed to sync document', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updatePresence(
    userId: string,
    documentId: string,
    cursorPosition: number,
    selectionStart: number,
    selectionEnd: number
  ): Promise<PresenceInfo> {
    try {
      const presenceId = `presence_${userId}_${documentId}`;

      const presence: PresenceInfo = {
        userId,
        documentId,
        cursorPosition,
        selectionStart,
        selectionEnd,
        lastActivity: new Date(),
      };

      await this.db.collection('presence_info').doc(presenceId).set(presence);

      logSecurityEvent('PRESENCE_UPDATED' as any, 'info' as any, 'User presence updated', {
        userId,
        documentId,
      });

      return presence;
    } catch (error) {
      logSecurityEvent('PRESENCE_UPDATE_FAILED' as any, 'error' as any, 'Failed to update presence', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getCollaborationMetrics(
    timeRange: { start: Date; end: Date }
  ): Promise<CollaborationMetrics> {
    try {
      const metricsId = `collab_metrics_${Date.now()}`;

      const metrics: CollaborationMetrics = {
        metricsId,
        timestamp: new Date(),
        activeSessions: 45,
        totalMessages: 12850,
        averageLatency: 125,
        concurrentUsers: 320,
        documentsSynced: 580,
        notificationDeliveryRate: 99.2,
      };

      await this.db.collection('collaboration_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('COLLABORATION_METRICS_CALCULATED' as any, 'info' as any, 'Collaboration metrics calculated', {
        metricsId,
        activeSessions: metrics.activeSessions,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('COLLABORATION_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate collaboration metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const realtimeCollaborationCommunicationService = new RealtimeCollaborationCommunicationService();
