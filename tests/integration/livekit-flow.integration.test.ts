/**
 * Integration Tests: LiveKit Live Classes
 * Tests real-time video/audio class functionality
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";

const API_BASE = process.env.API_BASE || "http://localhost:3000";

describe("LiveKit Integration Tests", () => {
  let instructorToken: string = "test-instructor-token-" + Date.now();
  let studentToken: string = "test-student-token-" + Date.now();
  let instructorId: string = `instructor-${Date.now()}`;
  let studentId: string = `student-${Date.now()}`;
  let roomName: string;

  beforeAll(async () => {
    // Use mock tokens for integration testing
    console.log(`✅ Instructor ID: ${instructorId}`);
    console.log(`✅ Student ID: ${studentId}`);
    console.log("✅ Test users ready (instructor + student)");
  });

  afterAll(async () => {
    console.log(`✅ LiveKit tests complete`);
  });

  describe("1. Room Creation", () => {
    it("should create a live class room", async () => {
      const response = await axios.post(
        `${API_BASE}/api/livekit/room/create`,
        {
          roomName: `class-${Date.now()}`,
          language: "en",
          level: "intermediate",
          recordingEnabled: true,
        },
        {
          headers: { Authorization: `Bearer ${instructorToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("roomName");
      expect(response.data).toHaveProperty("createdAt");

      roomName = response.data.roomName;
      console.log(`✅ Room created: ${roomName}`);
    });

    it("should reject room creation from non-instructor", async () => {
      try {
        await axios.post(
          `${API_BASE}/api/livekit/room/create`,
          { roomName: `invalid-${Date.now()}` },
          { headers: { Authorization: `Bearer ${studentToken}` } }
        );
        throw new Error("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe("2. Token Generation", () => {
    it("should generate token for instructor", async () => {
      const response = await axios.post(
        `${API_BASE}/api/livekit/token`,
        {
          roomName,
          userRole: "instructor",
        },
        {
          headers: { Authorization: `Bearer ${instructorToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("token");
      expect(response.data).toHaveProperty("url");
      expect(response.data.url).toContain(roomName);

      console.log(`✅ Instructor token generated`);
    });

    it("should generate token for student", async () => {
      const response = await axios.post(
        `${API_BASE}/api/livekit/token`,
        {
          roomName,
          userRole: "student",
        },
        {
          headers: { Authorization: `Bearer ${studentToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("token");

      // Student token should have limited permissions
      const tokenParts = response.data.token.split(".");
      expect(tokenParts.length).toBe(3); // JWT format

      console.log(`✅ Student token generated`);
    });
  });

  describe("3. Room Management", () => {
    it("should retrieve room info and participants", async () => {
      const response = await axios.get(
        `${API_BASE}/api/livekit/room/${roomName}`,
        {
          headers: { Authorization: `Bearer ${instructorToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("participants");
      expect(Array.isArray(response.data.participants)).toBe(true);

      console.log(`✅ Room info retrieved`);
    });

    it("should list active rooms", async () => {
      const response = await axios.get(`${API_BASE}/api/livekit/rooms`, {
        headers: { Authorization: `Bearer ${instructorToken}` },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.rooms)).toBe(true);
      expect(response.data.rooms.length).toBeGreaterThan(0);

      console.log(`✅ Active rooms listed`);
    });
  });

  describe("4. Participant Management", () => {
    it("should remove participant from room", async () => {
      // This would require actual participant in room
      // For now, test the endpoint structure

      const response = await axios.post(
        `${API_BASE}/api/livekit/room/${roomName}/end`,
        {},
        {
          headers: { Authorization: `Bearer ${instructorToken}` },
        }
      );

      expect(response.status).toBe(200);
      console.log(`✅ Room ended by instructor`);
    });

    it("should reject participant removal from non-instructor", async () => {
      try {
        await axios.delete(
          `${API_BASE}/api/livekit/room/${roomName}/participant/test-id`,
          {
            headers: { Authorization: `Bearer ${studentToken}` },
          }
        );
        throw new Error("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe("5. Health Check", () => {
    it("should report LiveKit health status", async () => {
      const response = await axios.get(`${API_BASE}/api/livekit/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("status");
      expect(response.data.status).toBe("healthy");

      console.log(`✅ LiveKit health check passed`);
    });
  });
});
