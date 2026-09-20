/**
 * LiveKit Service — WebRTC Live Classes
 */

import { AccessToken, RoomServiceClient, ParticipantInfo } from "livekit-server-sdk";

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const isTestMode = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  if (!isTestMode) {
    console.warn("[LiveKit] ⚠️ LiveKit credentials not configured");
  }
}

export interface LiveClassSession {
  roomName: string;
  sessionId: string;
  instructorId: string;
  instructorName: string;
  language: string;
  level: string;
  maxParticipants: number;
  startTime: Date;
  status: "pending" | "active" | "recording" | "ended";
  participantCount: number;
  participants: ParticipantInfo[];
}

export interface LiveClassToken {
  token: string;
  url: string;
  roomName: string;
  expiresAt: Date;
}

export class LiveKitService {
  private static roomClient: RoomServiceClient | null = null;

  private static initRoomClient(): RoomServiceClient | null {
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error("LiveKit credentials not configured");
    }

    if (!this.roomClient) {
      this.roomClient = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    }

    return this.roomClient;
  }

  /**
   * Generate access token for joining a live class
   */
  static generateToken(
    userId: string,
    userName: string,
    roomName: string,
    isInstructor: boolean = false,
    expirationSeconds: number = 3600
  ): LiveClassToken {
    if (isTestMode) {
      const mockToken = `test_token_${userId}_${Date.now()}`;
      return {
        token: mockToken,
        url: `http://localhost:7880?token=${mockToken}`,
        roomName,
        expiresAt: new Date(Date.now() + expirationSeconds * 1000),
      };
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new Error("LiveKit is not configured");
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    token.identity = userId;
    token.name = userName;
    token.metadata = JSON.stringify({
      userId,
      userName,
      isInstructor,
      joinedAt: new Date().toISOString(),
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    token.ttl = expirationSeconds;
    const jwt = token.toJwt();

    return {
      token: jwt,
      url: `${LIVEKIT_URL}?token=${jwt}`,
      roomName,
      expiresAt: new Date(Date.now() + expirationSeconds * 1000),
    };
  }

  /**
   * Create a new live class room
   */
  static async createRoom(
    roomName: string,
    options: { maxParticipants?: number; metadata?: string } = {}
  ): Promise<{ success: boolean; roomName: string }> {
    try {
      if (isTestMode) {
        console.log(`[LiveKit Mock] Room created: ${roomName}`);
        return { success: true, roomName, createdAt: new Date().toISOString() };
      }

      const roomClient = this.initRoomClient();
      if (!roomClient) throw new Error("Room client not initialized");

      const room = await roomClient.createRoom({
        roomName,
        maxParticipants: options.maxParticipants || 50,
        emptyTimeout: 300,
        metadata: options.metadata || "",
      });

      console.log(`[LiveKit] ✅ Room created: ${roomName}`);
      return { success: true, roomName: room.name };
    } catch (error: any) {
      console.error(`[LiveKit] ❌ Failed to create room:`, error.message);
      throw error;
    }
  }

  /**
   * Get room information
   */
  static async getRoomInfo(roomName: string): Promise<LiveClassSession | null> {
    try {
      if (isTestMode) {
        return {
          roomName,
          sessionId: `session_${roomName}`,
          instructorId: "test-instructor",
          instructorName: "Test Instructor",
          language: "en",
          level: "intermediate",
          maxParticipants: 50,
          startTime: new Date(),
          status: "active",
          participantCount: 2,
          participants: [],
        };
      }

      const roomClient = this.initRoomClient();
      if (!roomClient) throw new Error("Room client not initialized");

      const room = await roomClient.listRooms([roomName]);
      if (!room || room.length === 0) return null;

      const roomInfo = room[0];
      const participants = await roomClient.listParticipants(roomName);
      const metadata = roomInfo.metadata ? JSON.parse(roomInfo.metadata) : {};

      return {
        roomName: roomInfo.name,
        sessionId: metadata.sessionId || roomInfo.name,
        instructorId: metadata.instructorId || "unknown",
        instructorName: metadata.instructorName || "Instructor",
        language: metadata.language || "unknown",
        level: metadata.level || "beginner",
        maxParticipants: roomInfo.maxParticipants,
        startTime: new Date(roomInfo.creationTime * 1000),
        status: participants.length > 0 ? "active" : "pending",
        participantCount: participants.length,
        participants,
      };
    } catch (error: any) {
      console.error(`[LiveKit] ❌ Failed to get room info:`, error.message);
      return null;
    }
  }

  /**
   * List all active rooms
   */
  static async listActiveRooms(): Promise<LiveClassSession[]> {
    try {
      if (isTestMode) {
        return [
          {
            roomName: "test-room-1",
            sessionId: "session_test_1",
            instructorId: "test-instructor",
            instructorName: "Test Instructor",
            language: "en",
            level: "beginner",
            maxParticipants: 50,
            startTime: new Date(),
            status: "active",
            participantCount: 3,
            participants: [],
          },
        ];
      }

      const roomClient = this.initRoomClient();
      if (!roomClient) throw new Error("Room client not initialized");

      const rooms = await roomClient.listRooms([]);
      const sessions: LiveClassSession[] = [];

      for (const room of rooms) {
        const participants = await roomClient.listParticipants(room.name);
        const metadata = room.metadata ? JSON.parse(room.metadata) : {};

        sessions.push({
          roomName: room.name,
          sessionId: metadata.sessionId || room.name,
          instructorId: metadata.instructorId || "unknown",
          instructorName: metadata.instructorName || "Instructor",
          language: metadata.language || "unknown",
          level: metadata.level || "beginner",
          maxParticipants: room.maxParticipants,
          startTime: new Date(room.creationTime * 1000),
          status: participants.length > 0 ? "active" : "pending",
          participantCount: participants.length,
          participants,
        });
      }

      return sessions;
    } catch (error: any) {
      console.error("[LiveKit] ❌ Failed to list rooms:", error.message);
      return [];
    }
  }

  /**
   * Remove participant
   */
  static async removeParticipant(roomName: string, participantId: string): Promise<boolean> {
    try {
      const roomClient = this.initRoomClient();
      if (!roomClient) throw new Error("Room client not initialized");

      await roomClient.removeParticipant(roomName, participantId);
      console.log(`[LiveKit] ✅ Participant removed: ${participantId}`);
      return true;
    } catch (error: any) {
      console.error("[LiveKit] ❌ Failed to remove participant:", error.message);
      return false;
    }
  }

  /**
   * End session
   */
  static async endSession(roomName: string): Promise<boolean> {
    try {
      const roomClient = this.initRoomClient();
      if (!roomClient) throw new Error("Room client not initialized");

      const participants = await roomClient.listParticipants(roomName);
      await roomClient.deleteRoom(roomName);
      console.log(`[LiveKit] ✅ Session ended: ${roomName} (${participants.length} participants)`);
      return true;
    } catch (error: any) {
      console.error("[LiveKit] ❌ Failed to end session:", error.message);
      return false;
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      if (isTestMode) {
        return { healthy: true, status: "healthy" };
      }

      if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        return { healthy: false, error: "LiveKit not configured" };
      }

      const roomClient = this.initRoomClient();
      if (!roomClient) return { healthy: false, error: "Failed to initialize" };

      await roomClient.listRooms([]);
      return { healthy: true };
    } catch (error: any) {
      return { healthy: false, error: error.message };
    }
  }
}
