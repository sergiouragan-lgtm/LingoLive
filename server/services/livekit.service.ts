import { AccessToken } from 'livekit-server-sdk';
import { db } from '../config/firebase';
import { logger } from '../utils/logger';

export interface LiveKitRoom {
  id: string;
  teacherId: string;
  title: string;
  scheduledTime: number;
  duration: number;
  maxParticipants: number;
  participants: Map<string, ParticipantInfo>;
  recordingUrl?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface ParticipantInfo {
  userId: string;
  name: string;
  role: 'teacher' | 'student';
  joinedAt: number;
  leftAt?: number;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

export interface RoomTokenRequest {
  roomName: string;
  userId: string;
  userName: string;
  role?: 'teacher' | 'student';
  metadata?: Record<string, any>;
}

export class LiveKitService {
  private apiKey: string;
  private apiSecret: string;
  private liveKitUrl: string;
  private rooms: Map<string, LiveKitRoom> = new Map();

  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY || '';
    this.apiSecret = process.env.LIVEKIT_API_SECRET || '';
    this.liveKitUrl = process.env.LIVEKIT_URL || '';

    if (!this.apiKey || !this.apiSecret || !this.liveKitUrl) {
      logger.warn('LiveKit environment variables not configured');
    }
  }

  /**
   * Create a room token for a participant
   */
  createRoomToken(request: RoomTokenRequest): string {
    try {
      const token = new AccessToken(this.apiKey, this.apiSecret);

      token.addGrant({
        room: request.roomName,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      });

      token.identity = request.userId;
      token.name = request.userName;

      const jwt = token.toJwt();
      logger.info(`Generated room token for ${request.userId} in room ${request.roomName}`);
      return jwt;
    } catch (error) {
      logger.error(`Failed to create room token for ${request.userId}:`, error);
      throw error;
    }
  }

  /**
   * Get LiveKit URL for client connection
   */
  getLiveKitUrl(): string {
    return this.liveKitUrl;
  }

  /**
   * Initialize a room in Firestore
   */
  async initializeRoom(
    classId: string,
    teacherId: string,
    title: string,
    scheduledTime: number,
    duration: number,
    maxParticipants: number = 50
  ): Promise<LiveKitRoom> {
    try {
      const room: LiveKitRoom = {
        id: classId,
        teacherId,
        title,
        scheduledTime,
        duration,
        maxParticipants,
        participants: new Map(),
        status: 'scheduled',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Store in Firestore
      await db.collection('live_classes').doc(classId).set({
        id: classId,
        teacherId,
        title,
        scheduledTime,
        duration,
        maxParticipants,
        participants: [],
        status: 'scheduled',
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      });

      // Keep in memory
      this.rooms.set(classId, room);

      logger.info(`Room initialized: ${classId}`);
      return room;
    } catch (error) {
      logger.error(`Failed to initialize room ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Register participant join
   */
  async registerParticipant(
    roomId: string,
    userId: string,
    userName: string,
    role: 'teacher' | 'student'
  ): Promise<ParticipantInfo> {
    try {
      const participant: ParticipantInfo = {
        userId,
        name: userName,
        role,
        joinedAt: Date.now(),
        videoEnabled: true,
        audioEnabled: true,
      };

      // Update Firestore
      const roomRef = db.collection('live_classes').doc(roomId);
      const roomDoc = await roomRef.get();

      if (roomDoc.exists) {
        const roomData = roomDoc.data();
        const participants = roomData?.participants || [];

        await roomRef.update({
          participants: [
            ...participants,
            {
              userId,
              name: userName,
              role,
              joinedAt: Date.now(),
              videoEnabled: true,
              audioEnabled: true,
            },
          ],
          updatedAt: Date.now(),
        });
      }

      // Update in-memory room
      const room = this.rooms.get(roomId);
      if (room) {
        room.participants.set(userId, participant);
        room.updatedAt = Date.now();
      }

      logger.info(`Participant registered: ${userId} in room ${roomId}`);
      return participant;
    } catch (error) {
      logger.error(`Failed to register participant in room ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Register participant leave
   */
  async registerParticipantLeave(roomId: string, userId: string): Promise<void> {
    try {
      // Update Firestore
      const roomRef = db.collection('live_classes').doc(roomId);
      const roomDoc = await roomRef.get();

      if (roomDoc.exists) {
        const roomData = roomDoc.data();
        const participants = (roomData?.participants || []).map((p: any) => {
          if (p.userId === userId) {
            return { ...p, leftAt: Date.now() };
          }
          return p;
        });

        await roomRef.update({
          participants,
          updatedAt: Date.now(),
        });
      }

      // Update in-memory room
      const room = this.rooms.get(roomId);
      if (room) {
        const participant = room.participants.get(userId);
        if (participant) {
          participant.leftAt = Date.now();
        }
        room.updatedAt = Date.now();
      }

      logger.info(`Participant left: ${userId} from room ${roomId}`);
    } catch (error) {
      logger.error(`Failed to register participant leave in room ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Start recording
   */
  async startRecording(roomId: string): Promise<void> {
    try {
      // LiveKit recording is handled via webhooks/API
      // This is a placeholder for when recording actually starts

      const roomRef = db.collection('live_classes').doc(roomId);
      await roomRef.update({
        recordingStartedAt: Date.now(),
        recordingStatus: 'in_progress',
      });

      logger.info(`Recording started for room ${roomId}`);
    } catch (error) {
      logger.error(`Failed to start recording for room ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * End room (close the class)
   */
  async endRoom(roomId: string): Promise<void> {
    try {
      const room = this.rooms.get(roomId);

      if (room) {
        room.status = 'completed';
        room.updatedAt = Date.now();
      }

      // Update Firestore
      const roomRef = db.collection('live_classes').doc(roomId);
      await roomRef.update({
        status: 'completed',
        updatedAt: Date.now(),
      });

      logger.info(`Room ended: ${roomId}`);
    } catch (error) {
      logger.error(`Failed to end room ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Get room state
   */
  async getRoomState(roomId: string): Promise<LiveKitRoom | null> {
    try {
      // Try to get from Firestore first
      const roomRef = db.collection('live_classes').doc(roomId);
      const roomDoc = await roomRef.get();

      if (roomDoc.exists) {
        const data = roomDoc.data() as any;
        const room: LiveKitRoom = {
          id: data.id,
          teacherId: data.teacherId,
          title: data.title,
          scheduledTime: data.scheduledTime,
          duration: data.duration,
          maxParticipants: data.maxParticipants,
          participants: new Map(
            (data.participants || []).map((p: any) => [p.userId, p])
          ),
          recordingUrl: data.recordingUrl,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        // Update in-memory cache
        this.rooms.set(roomId, room);

        return room;
      }

      return this.rooms.get(roomId) || null;
    } catch (error) {
      logger.error(`Failed to get room state for ${roomId}:`, error);
      return null;
    }
  }

  /**
   * Broadcast message to all participants in a room
   * (Would be implemented via LiveKit webhooks or real-time messaging)
   */
  async broadcastMessage(
    roomId: string,
    message: Record<string, any>
  ): Promise<void> {
    try {
      logger.info(`Broadcasting message to room ${roomId}:`, message);
      // Implementation depends on LiveKit's messaging capabilities
    } catch (error) {
      logger.error(`Failed to broadcast message in room ${roomId}:`, error);
      throw error;
    }
  }

  /**
   * Get transcription for a room session
   * (Placeholder for Whisper API integration)
   */
  async getTranscription(roomId: string): Promise<any[]> {
    try {
      // This would be populated by a transcription service
      const roomRef = db.collection('live_class_recordings').doc(roomId);
      const recordingDoc = await roomRef.get();

      if (recordingDoc.exists) {
        return recordingDoc.data()?.transcription || [];
      }

      return [];
    } catch (error) {
      logger.error(`Failed to get transcription for room ${roomId}:`, error);
      return [];
    }
  }

  /**
   * Store recording metadata
   */
  async storeRecordingMetadata(
    roomId: string,
    recordingUrl: string,
    duration: number,
    fileSize: number
  ): Promise<void> {
    try {
      await db.collection('live_class_recordings').doc(roomId).set({
        classId: roomId,
        videoUrl: recordingUrl,
        duration,
        fileSize,
        processingStatus: 'pending',
        generatedAt: Date.now(),
        createdAt: Date.now(),
      });

      logger.info(`Recording metadata stored for room ${roomId}`);
    } catch (error) {
      logger.error(`Failed to store recording metadata for room ${roomId}:`, error);
      throw error;
    }
  }
}

export const liveKitService = new LiveKitService();
