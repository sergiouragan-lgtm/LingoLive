import { describe, it, expect, beforeEach, vi } from "vitest";
import { LiveKitService } from "../../services/livekit.service";

vi.mock("../../services/livekit.service");

describe("LiveKit Integration", () => {
  const mockUserId = "user-123";
  const mockUserName = "John Doe";
  const mockRoomName = "class-portuguese-101";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Token Generation", () => {
    it("should generate valid access token", () => {
      const mockToken = {
        token: "jwt_token_here",
        url: "https://livekit.example.com?token=jwt_token_here",
        roomName: mockRoomName,
        expiresAt: new Date(Date.now() + 3600000),
      };

      vi.spyOn(LiveKitService, "generateToken").mockReturnValue(mockToken);

      const token = LiveKitService.generateToken(
        mockUserId,
        mockUserName,
        mockRoomName,
        false,
        3600
      );

      expect(token.token).toBeDefined();
      expect(token.url).toContain("token=");
      expect(token.roomName).toBe(mockRoomName);
      expect(token.expiresAt).toBeInstanceOf(Date);
    });

    it("should generate different tokens for instructor", () => {
      const studentToken = {
        token: "student_jwt",
        url: "https://livekit.example.com?token=student_jwt",
        roomName: mockRoomName,
        expiresAt: new Date(Date.now() + 3600000),
      };

      const instructorToken = {
        token: "instructor_jwt",
        url: "https://livekit.example.com?token=instructor_jwt",
        roomName: mockRoomName,
        expiresAt: new Date(Date.now() + 3600000),
      };

      vi.spyOn(LiveKitService, "generateToken")
        .mockReturnValueOnce(studentToken)
        .mockReturnValueOnce(instructorToken);

      const student = LiveKitService.generateToken(mockUserId, mockUserName, mockRoomName, false);
      const instructor = LiveKitService.generateToken(mockUserId, mockUserName, mockRoomName, true);

      expect(student.token).not.toBe(instructor.token);
    });

    it("should throw when LiveKit not configured", () => {
      vi.spyOn(LiveKitService, "generateToken").mockImplementation(() => {
        throw new Error("LiveKit is not configured");
      });

      expect(() => {
        LiveKitService.generateToken(mockUserId, mockUserName, mockRoomName);
      }).toThrow("LiveKit is not configured");
    });
  });

  describe("Room Management", () => {
    it("should create a room successfully", async () => {
      const mockCreateResult = { success: true, roomName: mockRoomName };

      vi.spyOn(LiveKitService, "createRoom").mockResolvedValue(mockCreateResult);

      const result = await LiveKitService.createRoom(mockRoomName, {
        maxParticipants: 50,
      });

      expect(result.success).toBe(true);
      expect(result.roomName).toBe(mockRoomName);
    });

    it("should get room info with participants", async () => {
      const mockRoomInfo = {
        roomName: mockRoomName,
        sessionId: "session-123",
        instructorId: mockUserId,
        instructorName: "John Doe",
        language: "portuguese",
        level: "intermediate",
        maxParticipants: 50,
        startTime: new Date(),
        status: "active" as const,
        participantCount: 5,
        participants: [],
      };

      vi.spyOn(LiveKitService, "getRoomInfo").mockResolvedValue(mockRoomInfo);

      const roomInfo = await LiveKitService.getRoomInfo(mockRoomName);

      expect(roomInfo).toBeDefined();
      expect(roomInfo?.roomName).toBe(mockRoomName);
      expect(roomInfo?.participantCount).toBe(5);
      expect(roomInfo?.status).toBe("active");
    });

    it("should return null for non-existent room", async () => {
      vi.spyOn(LiveKitService, "getRoomInfo").mockResolvedValue(null);

      const roomInfo = await LiveKitService.getRoomInfo("non-existent-room");

      expect(roomInfo).toBeNull();
    });

    it("should list all active rooms", async () => {
      const mockRooms = [
        {
          roomName: "class-1",
          sessionId: "session-1",
          instructorId: "user-1",
          instructorName: "Teacher 1",
          language: "portuguese",
          level: "beginner",
          maxParticipants: 50,
          startTime: new Date(),
          status: "active" as const,
          participantCount: 3,
          participants: [],
        },
        {
          roomName: "class-2",
          sessionId: "session-2",
          instructorId: "user-2",
          instructorName: "Teacher 2",
          language: "spanish",
          level: "intermediate",
          maxParticipants: 50,
          startTime: new Date(),
          status: "active" as const,
          participantCount: 5,
          participants: [],
        },
      ];

      vi.spyOn(LiveKitService, "listActiveRooms").mockResolvedValue(mockRooms);

      const rooms = await LiveKitService.listActiveRooms();

      expect(rooms).toHaveLength(2);
      expect(rooms[0].roomName).toBe("class-1");
      expect(rooms[1].roomName).toBe("class-2");
    });

    it("should end a session successfully", async () => {
      vi.spyOn(LiveKitService, "endSession").mockResolvedValue(true);

      const result = await LiveKitService.endSession(mockRoomName);

      expect(result).toBe(true);
    });

    it("should handle session end failure", async () => {
      vi.spyOn(LiveKitService, "endSession").mockResolvedValue(false);

      const result = await LiveKitService.endSession(mockRoomName);

      expect(result).toBe(false);
    });
  });

  describe("Participant Management", () => {
    it("should remove participant from room", async () => {
      const participantId = "participant-123";

      vi.spyOn(LiveKitService, "removeParticipant").mockResolvedValue(true);

      const result = await LiveKitService.removeParticipant(mockRoomName, participantId);

      expect(result).toBe(true);
    });

    it("should handle participant removal failure", async () => {
      const participantId = "participant-123";

      vi.spyOn(LiveKitService, "removeParticipant").mockResolvedValue(false);

      const result = await LiveKitService.removeParticipant(mockRoomName, participantId);

      expect(result).toBe(false);
    });
  });

  describe("Health Check", () => {
    it("should return healthy status when configured", async () => {
      const mockHealth = { healthy: true };

      vi.spyOn(LiveKitService, "healthCheck").mockResolvedValue(mockHealth);

      const health = await LiveKitService.healthCheck();

      expect(health.healthy).toBe(true);
    });

    it("should return unhealthy when not configured", async () => {
      const mockHealth = { healthy: false, error: "LiveKit not configured" };

      vi.spyOn(LiveKitService, "healthCheck").mockResolvedValue(mockHealth);

      const health = await LiveKitService.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.error).toBeDefined();
    });
  });
});
