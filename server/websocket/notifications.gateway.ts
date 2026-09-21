import { Server, Socket } from 'socket.io';
import { notificationsService, UserNotification, NotificationType } from '../services/notifications.service';
import { logSecurityEvent } from '../services/security.event.logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

interface NotificationRoom {
  userId: string;
  socketIds: Set<string>;
}

class NotificationsGateway {
  private io: Server | null = null;
  private userRooms: Map<string, NotificationRoom> = new Map();
  private socketUserMap: Map<string, string> = new Map();

  public initialize(io: Server): void {
    this.io = io;

    io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`[Notifications] Client connected: ${socket.id}`);

      // Authenticate connection
      socket.on('authenticate', (data: { userId: string; token: string }, callback) => {
        this.handleAuthentication(socket, data, callback);
      });

      // Join user's notification room
      socket.on('subscribe', (data: { userId: string }, callback) => {
        this.handleSubscribe(socket, data, callback);
      });

      // Leave notification room
      socket.on('unsubscribe', (callback) => {
        this.handleUnsubscribe(socket, callback);
      });

      // Request notifications
      socket.on('get-notifications', (data: { limit?: number; unreadOnly?: boolean }, callback) => {
        this.handleGetNotifications(socket, data, callback);
      });

      // Mark notification as read
      socket.on('mark-read', (data: { notificationId: string }, callback) => {
        this.handleMarkRead(socket, data, callback);
      });

      // Mark all as read
      socket.on('mark-all-read', (callback) => {
        this.handleMarkAllRead(socket, callback);
      });

      // Delete notification
      socket.on('delete-notification', (data: { notificationId: string }, callback) => {
        this.handleDeleteNotification(socket, data, callback);
      });

      // Get unread count
      socket.on('get-unread-count', (callback) => {
        this.handleGetUnreadCount(socket, callback);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`[Notifications] Socket error:`, error);
        logSecurityEvent(
          'NOTIFICATION_SOCKET_ERROR' as any,
          'warning' as any,
          `WebSocket error: ${error.message}`,
          { socketId: socket.id },
          { error: error.message }
        );
      });
    });

    console.log('[Notifications] WebSocket gateway initialized');
  }

  private handleAuthentication(
    socket: AuthenticatedSocket,
    data: { userId: string; token: string },
    callback: (error?: string | null, data?: { success: boolean }) => void
  ): void {
    const { userId } = data;

    // In production, validate token here
    if (!userId) {
      callback('Missing userId');
      return;
    }

    socket.userId = userId;
    socket.join(`notifications:${userId}`);
    this.socketUserMap.set(socket.id, userId);

    logSecurityEvent(
      'NOTIFICATION_SOCKET_AUTH' as any,
      'info' as any,
      'User authenticated on notifications WebSocket',
      { userId, socketId: socket.id },
      { userId }
    );

    callback(null, { success: true });
  }

  private handleSubscribe(
    socket: AuthenticatedSocket,
    data: { userId: string },
    callback: (error?: string | null, data?: { success: boolean; message: string }) => void
  ): void {
    const userId = socket.userId || data.userId;

    if (!userId) {
      callback('Not authenticated');
      return;
    }

    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, { userId, socketIds: new Set() });
    }

    this.userRooms.get(userId)!.socketIds.add(socket.id);
    socket.join(`notifications:${userId}`);

    logSecurityEvent(
      'NOTIFICATION_SUBSCRIBED' as any,
      'info' as any,
      'User subscribed to notifications',
      { userId, socketId: socket.id },
      { userId }
    );

    callback(null, { success: true, message: 'Subscribed to notifications' });
  }

  private handleUnsubscribe(
    socket: AuthenticatedSocket,
    callback: (error?: string | null, data?: { success: boolean }) => void
  ): void {
    const userId = this.socketUserMap.get(socket.id);

    if (userId) {
      const room = this.userRooms.get(userId);
      if (room) {
        room.socketIds.delete(socket.id);
        if (room.socketIds.size === 0) {
          this.userRooms.delete(userId);
        }
      }

      socket.leave(`notifications:${userId}`);
      this.socketUserMap.delete(socket.id);

      logSecurityEvent(
        'NOTIFICATION_UNSUBSCRIBED' as any,
        'info' as any,
        'User unsubscribed from notifications',
        { userId, socketId: socket.id },
        {}
      );
    }

    callback(null, { success: true });
  }

  private async handleGetNotifications(
    socket: AuthenticatedSocket,
    data: { limit?: number; unreadOnly?: boolean },
    callback: (error?: string | null, notifications?: UserNotification[]) => void
  ): Promise<void> {
    const userId = socket.userId;

    if (!userId) {
      callback('Not authenticated');
      return;
    }

    try {
      const notifications = await notificationsService.getNotifications(
        userId,
        data.limit || 50,
        data.unreadOnly || false
      );

      callback(null, notifications);
    } catch (error: any) {
      callback(`Failed to fetch notifications: ${error.message}`);
    }
  }

  private async handleMarkRead(
    socket: AuthenticatedSocket,
    data: { notificationId: string },
    callback: (error?: string | null, data?: { success: boolean }) => void
  ): Promise<void> {
    const userId = socket.userId;

    if (!userId) {
      callback('Not authenticated');
      return;
    }

    try {
      await notificationsService.markAsRead(userId, data.notificationId);
      callback(null, { success: true });
    } catch (error: any) {
      callback(`Failed to mark as read: ${error.message}`);
    }
  }

  private async handleMarkAllRead(
    socket: AuthenticatedSocket,
    callback: (error?: string | null, data?: { success: boolean; count: number }) => void
  ): Promise<void> {
    const userId = socket.userId;

    if (!userId) {
      callback('Not authenticated');
      return;
    }

    try {
      const count = await notificationsService.markAllAsRead(userId);
      callback(null, { success: true, count });
    } catch (error: any) {
      callback(`Failed to mark all as read: ${error.message}`);
    }
  }

  private async handleDeleteNotification(
    socket: AuthenticatedSocket,
    data: { notificationId: string },
    callback: (error?: string | null, data?: { success: boolean }) => void
  ): Promise<void> {
    const userId = socket.userId;

    if (!userId) {
      callback('Not authenticated');
      return;
    }

    try {
      await notificationsService.deleteNotification(userId, data.notificationId);
      callback(null, { success: true });
    } catch (error: any) {
      callback(`Failed to delete notification: ${error.message}`);
    }
  }

  private async handleGetUnreadCount(
    socket: AuthenticatedSocket,
    callback: (error?: string | null, data?: { count: number }) => void
  ): Promise<void> {
    const userId = socket.userId;

    if (!userId) {
      callback('Not authenticated');
      return;
    }

    try {
      const count = await notificationsService.getUnreadCount(userId);
      callback(null, { count });
    } catch (error: any) {
      callback(`Failed to get unread count: ${error.message}`);
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    const userId = this.socketUserMap.get(socket.id);

    if (userId) {
      const room = this.userRooms.get(userId);
      if (room) {
        room.socketIds.delete(socket.id);
        if (room.socketIds.size === 0) {
          this.userRooms.delete(userId);
        }
      }

      this.socketUserMap.delete(socket.id);

      logSecurityEvent(
        'NOTIFICATION_SOCKET_DISCONNECT' as any,
        'info' as any,
        'User disconnected from notifications',
        { userId, socketId: socket.id },
        {}
      );
    }

    console.log(`[Notifications] Client disconnected: ${socket.id}`);
  }

  /**
   * Broadcast notification to user (real-time delivery)
   */
  public broadcastToUser(userId: string, notification: UserNotification): void {
    if (!this.io) return;

    this.io.to(`notifications:${userId}`).emit('notification', {
      type: 'new-notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast notification to multiple users
   */
  public broadcastToUsers(userIds: string[], notification: UserNotification): void {
    userIds.forEach((userId) => {
      this.broadcastToUser(userId, notification);
    });
  }

  /**
   * Broadcast notification to all connected users
   */
  public broadcastToAll(notification: UserNotification): void {
    if (!this.io) return;

    this.io.emit('notification', {
      type: 'broadcast-notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send notification to specific socket
   */
  public sendToSocket(socketId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(socketId).emit(event, data);
  }

  /**
   * Get active connections count
   */
  public getActiveConnectionsCount(): number {
    return this.socketUserMap.size;
  }

  /**
   * Get user's active connections
   */
  public getUserConnectionCount(userId: string): number {
    const room = this.userRooms.get(userId);
    return room ? room.socketIds.size : 0;
  }
}

export const notificationsGateway = new NotificationsGateway();
