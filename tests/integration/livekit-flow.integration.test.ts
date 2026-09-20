/**
 * Integration Tests: LiveKit Live Classes
 * Tests real-time video/audio class functionality
 * Uses mocked LiveKit service to avoid real API calls
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testServices, resetTestServices } from "./setup";

describe("LiveKit Integration Tests", () => {
  let instructorId: string = `instructor-${Date.now()}`;
  let studentId: string = `student-${Date.now()}`;
  let roomName: string;

  beforeAll(() => {
    resetTestServices();
    console.log(`✅ Instructor ID: ${instructorId}`);
    console.log(`✅ Student ID: ${studentId}`);
    console.log("✅ Test users ready (instructor + student)");
  });

  afterAll(() => {
    resetTestServices();
    console.log(`✅ LiveKit tests complete`);
  });

  describe("1. Room Creation", () => {
    it("should create a live class room using mock service", async () => {
      const roomId = `class-${Date.now()}`;
      const result = await testServices.livekit.createRoom(roomId, {
        metadata: { language: "en", level: "intermediate" },
        recordingEnabled: true,
      });

      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("createdAt");
      expect(result.recordingEnabled).toBe(true);

      roomName = result.name;
      expect(testServices.livekit.createRoom).toHaveBeenCalledWith(roomId, expect.any(Object));
      console.log(`✅ Room created: ${roomName}`);
    });

    it("should handle room deletion using mock service", async () => {
      const roomId = `invalid-${Date.now()}`;
      const result = await testServices.livekit.deleteRoom(roomId);

      expect(result.success).toBe(true);
      console.log(`✅ Room deleted`);
    });
  });

  describe("2. Token Generation", () => {
    it("should generate token for instructor using mock service", async () => {
      const result = await testServices.livekit.generateToken(roomName, instructorId, {
        permissions: { canPublish: true, canSubscribe: true },
      });

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("url");
      expect(result.token.split(".").length).toBe(3); // JWT format

      expect(testServices.livekit.generateToken).toHaveBeenCalledWith(
        roomName,
        instructorId,
        expect.any(Object)
      );
      console.log(`✅ Instructor token generated`);
    });

    it("should generate token for student using mock service", async () => {
      const result = await testServices.livekit.generateToken(roomName, studentId, {
        permissions: { canPublish: false, canSubscribe: true },
      });

      expect(result).toHaveProperty("token");
      expect(result.token.split(".").length).toBe(3); // JWT format

      console.log(`✅ Student token generated`);
    });
  });

  describe("3. Room Management", () => {
    it("should retrieve room info and participants using mock service", async () => {
      const result = await testServices.livekit.getRoomInfo(roomName);

      expect(result).toHaveProperty("participants");
      expect(Array.isArray(result.participants)).toBe(true);

      console.log(`✅ Room info retrieved`);
    });

    it("should list active rooms using mock service", async () => {
      const result = await testServices.livekit.listRooms();

      expect(Array.isArray(result.rooms)).toBe(true);

      console.log(`✅ Active rooms listed`);
    });
  });

  describe("4. Participant Management", () => {
    it("should remove participant from room using mock service", async () => {
      const result = await testServices.livekit.removeParticipant(roomName, studentId);

      expect(result.success).toBe(true);
      expect(result.removed).toBe(studentId);
      console.log(`✅ Participant removed`);
    });

    it("should mute participant using mock service", async () => {
      const result = await testServices.livekit.muteParticipant(roomName, studentId);

      expect(result.success).toBe(true);
      expect(result.muted).toBe(studentId);
      console.log(`✅ Participant muted`);
    });
  });

  describe("5. Health Check", () => {
    it("should report LiveKit health status using mock service", async () => {
      const result = await testServices.livekit.healthCheck();

      expect(result).toHaveProperty("status");
      expect(result.status).toBe("healthy");

      expect(testServices.livekit.healthCheck).toHaveBeenCalled();
      console.log(`✅ LiveKit health check passed`);
    });
  });
});
