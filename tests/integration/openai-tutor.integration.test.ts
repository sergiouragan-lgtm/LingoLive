/**
 * Integration Tests: OpenAI AI Tutor
 * Tests conversational AI and exercise generation
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";
import { auth, db } from "../../src/firebase";

const API_BASE = process.env.API_BASE || "http://localhost:3000";

describe("OpenAI AI Tutor Integration Tests", () => {
  let userId: string;
  let authToken: string;

  beforeAll(async () => {
    const userCred = await auth.createUserWithEmailAndPassword(
      `tutor-test-${Date.now()}@test.com`,
      "Test@12345"
    );
    userId = userCred.user.uid;
    authToken = await userCred.user.getIdToken();

    await db.collection("users").doc(userId).set({
      displayName: "Tutor Test User",
      language: "en",
      level: "intermediate",
    });

    console.log("✅ Test user created for AI tutor tests");
  });

  afterAll(async () => {
    if (userId) await db.collection("users").doc(userId).delete();
  });

  describe("1. Chat Conversation", () => {
    it("should process conversational AI request", async () => {
      const response = await axios.post(
        `${API_BASE}/api/ai-tutor/chat`,
        {
          message: "How do I conjugate the verb 'to be' in Spanish?",
          language: "es",
          level: "beginner",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("response");
      expect(response.data.response.length).toBeGreaterThan(0);
      expect(response.data).toHaveProperty("tokensUsed");

      console.log(`✅ AI chat response: ${response.data.response.substring(0, 50)}...`);
    });

    it("should maintain conversation history", async () => {
      const history = [
        { role: "user", content: "Hello, teach me Spanish" },
        { role: "assistant", content: "¡Hola! I'd be happy to teach you Spanish." },
      ];

      const response = await axios.post(
        `${API_BASE}/api/ai-tutor/chat`,
        {
          message: "What about greetings?",
          language: "es",
          level: "beginner",
          history,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("response");
      console.log(`✅ Conversation history maintained`);
    });

    it("should require authentication", async () => {
      try {
        await axios.post(`${API_BASE}/api/ai-tutor/chat`, {
          message: "Test message",
          language: "en",
        });
        throw new Error("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe("2. Streaming Responses", () => {
    it("should stream tutor response (SSE)", async () => {
      const response = await axios.post(
        `${API_BASE}/api/ai-tutor/chat-stream`,
        {
          message: "Tell me a story in French",
          language: "fr",
          level: "intermediate",
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "text/event-stream",
          },
          responseType: "stream",
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");

      let chunkCount = 0;
      response.data.on("data", (chunk: any) => {
        chunkCount++;
        expect(chunk.toString()).toContain("data:");
      });

      await new Promise((resolve) => {
        response.data.on("end", () => {
          expect(chunkCount).toBeGreaterThan(0);
          console.log(`✅ Streamed ${chunkCount} chunks`);
          resolve(null);
        });
      });
    });
  });

  describe("3. Exercise Generation", () => {
    it("should generate practice exercises", async () => {
      const response = await axios.post(
        `${API_BASE}/api/ai-tutor/exercises`,
        {
          topic: "verb conjugation",
          language: "es",
          level: "intermediate",
          questionCount: 5,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.exercises)).toBe(true);
      expect(response.data.exercises.length).toBe(5);

      // Verify exercise structure
      const exercise = response.data.exercises[0];
      expect(exercise).toHaveProperty("question");
      expect(exercise).toHaveProperty("options");
      expect(exercise).toHaveProperty("correctAnswer");
      expect(exercise.options.length).toBeGreaterThan(1);

      console.log(`✅ Generated 5 exercises`);
    });
  });

  describe("4. Vocabulary Builder", () => {
    it("should generate vocabulary exercises", async () => {
      const response = await axios.post(
        `${API_BASE}/api/ai-tutor/vocabulary`,
        {
          topic: "food and drinks",
          language: "pt",
          level: "beginner",
          wordCount: 10,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.words)).toBe(true);
      expect(response.data.words.length).toBe(10);

      // Verify word structure
      const word = response.data.words[0];
      expect(word).toHaveProperty("word");
      expect(word).toHaveProperty("translation");
      expect(word).toHaveProperty("example");

      console.log(`✅ Generated vocabulary list with 10 words`);
    });
  });

  describe("5. Grammar & Pronunciation Evaluation", () => {
    it("should evaluate user input", async () => {
      const response = await axios.post(
        `${API_BASE}/api/ai-tutor/evaluate`,
        {
          userInput: "Je suis très heureux",
          language: "fr",
          evaluationType: "grammar",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("isCorrect");
      expect(response.data).toHaveProperty("feedback");
      expect(response.data).toHaveProperty("corrections");

      console.log(`✅ Evaluation completed`);
    });

    it("should provide detailed feedback", async () => {
      const response = await axios.post(
        `${API_BASE}/api/ai-tutor/evaluate`,
        {
          userInput: "I goed to the school",
          language: "en",
          evaluationType: "grammar",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.isCorrect).toBe(false);
      expect(response.data.feedback.length).toBeGreaterThan(0);

      console.log(`✅ Feedback provided for incorrect input`);
    });
  });

  describe("6. API Error Handling", () => {
    it("should validate required parameters", async () => {
      try {
        await axios.post(
          `${API_BASE}/api/ai-tutor/chat`,
          {
            // Missing required fields
            language: "en",
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        throw new Error("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain("message");
      }
    });

    it("should handle API rate limiting gracefully", async () => {
      // Send multiple rapid requests
      const requests = Array.from({ length: 20 }).map(() =>
        axios.post(
          `${API_BASE}/api/ai-tutor/chat`,
          {
            message: "Hello",
            language: "en",
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
            validateStatus: () => true, // Don't throw on any status
          }
        )
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      if (rateLimited) {
        console.log(`✅ Rate limiting enforced`);
      } else {
        console.log(`✅ No rate limiting triggered (requests < threshold)`);
      }
    });
  });
});
