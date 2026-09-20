/**
 * Mock LiveKit Service
 * Used in integration tests to simulate LiveKit API without real calls
 */

import { vi } from "vitest";

const mockRooms = new Map<string, any>();

export const createMockLiveKitService = () => {
  return {
    createRoom: vi.fn(async (roomName: string, config?: any) => {
      const room = {
        sid: `room_${Date.now()}`,
        name: roomName,
        createdAt: new Date().toISOString(),
        metadata: config?.metadata || {},
        recordingEnabled: config?.recordingEnabled || false,
        emptyTimeout: 300,
        maxParticipants: config?.maxParticipants || 100,
      };
      mockRooms.set(roomName, room);
      return room;
    }),

    deleteRoom: vi.fn(async (roomName: string) => {
      mockRooms.delete(roomName);
      return { success: true };
    }),

    listRooms: vi.fn(async () => ({
      rooms: Array.from(mockRooms.values()),
    })),

    getRoomInfo: vi.fn(async (roomName: string) => {
      const room = mockRooms.get(roomName) || {
        sid: `room_${Date.now()}`,
        name: roomName,
        participants: [],
        createdAt: new Date().toISOString(),
      };
      return {
        ...room,
        participants: Array.from({ length: 0 }, (_, i) => ({
          sid: `participant_${i}`,
          identity: `user_${i}`,
          state: "ACTIVE",
          joinedAt: Date.now(),
        })),
      };
    }),

    generateToken: vi.fn(async (roomName: string, identity: string, options?: any) => {
      const token = Buffer.from(
        JSON.stringify({
          room: roomName,
          identity: identity,
          permissions: options?.permissions || { canPublish: true, canSubscribe: true },
          iss: "livekit-mock",
          nbf: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      ).toString("base64");
      return {
        token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${token}.mock_signature`,
        url: `https://livekit.mock/${roomName}`,
      };
    }),

    removeParticipant: vi.fn(async (roomName: string, participantIdentity: string) => ({
      success: true,
      removed: participantIdentity,
    })),

    muteParticipant: vi.fn(async (roomName: string, participantIdentity: string) => ({
      success: true,
      muted: participantIdentity,
    })),

    unmuteParticipant: vi.fn(async (roomName: string, participantIdentity: string) => ({
      success: true,
      unmuted: participantIdentity,
    })),

    recordingStart: vi.fn(async (roomName: string) => ({
      recordingId: `rec_${Date.now()}`,
      roomName: roomName,
      startedAt: new Date().toISOString(),
    })),

    recordingStop: vi.fn(async (recordingId: string) => ({
      recordingId: recordingId,
      stoppedAt: new Date().toISOString(),
      duration: 3600,
    })),

    getRecordings: vi.fn(async (roomName?: string) => ({
      recordings: [],
    })),

    healthCheck: vi.fn(async () => ({
      status: "healthy",
      version: "0.0.0-mock",
      uptime: 3600,
    })),
  };
};
