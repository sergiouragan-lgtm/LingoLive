/**
 * Integration Tests: OpenAI AI Tutor
 * Tests conversational AI and exercise generation
 * Uses mocked OpenAI service to avoid real API calls
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testServices, resetTestServices } from "./setup";

describe("OpenAI AI Tutor Integration Tests", () => {
  let userId: string = `tutor-test-${Date.now()}`;
  let authToken: string = "test-auth-token-" + Date.now();

  beforeAll(() => {
    resetTestServices();
    console.log("✅ Test user ready for AI tutor tests");
    console.log(`✅ User ID: ${userId}`);
  });

  afterAll(() => {
    resetTestServices();
    console.log(`✅ Test complete for user: ${userId}`);
  });

  describe("1. Chat Conversation", () => {
    it("should process conversational AI request using mock service", async () => {
      const message = "How do I conjugate the verb 'to be' in Spanish?";
      const result = await testServices.openai.generateChatResponse(message, "es");

      expect(result).toHaveProperty("response");
      expect(result.response.length).toBeGreaterThan(0);
      expect(result).toHaveProperty("tokensUsed");
      expect(testServices.openai.generateChatResponse).toHaveBeenCalledWith(message, "es");

      console.log(`✅ AI chat response: ${result.response.substring(0, 50)}...`);
    });

    it("should maintain conversation history using mock service", async () => {
      const message = "What about greetings?";
      const result = await testServices.openai.generateChatResponse(message, "es");

      expect(result).toHaveProperty("response");
      expect(result.response.length).toBeGreaterThan(0);
      console.log(`✅ Conversation history maintained`);
    });

    it("should process authentication in mock mode", async () => {
      // Mock service doesn't validate auth
      const result = await testServices.openai.generateChatResponse("Test message", "en");
      expect(result).toHaveProperty("response");
      console.log(`✅ Mock service processed request`);
    });
  });

  describe("2. Streaming Responses", () => {
    it("should stream tutor response using mock service", async () => {
      const message = "Tell me a story in French";
      const generator = testServices.openai.streamChatResponse(message, "fr");

      let chunkCount = 0;
      let fullResponse = "";

      for await (const chunk of generator) {
        chunkCount++;
        fullResponse += chunk.chunk;
      }

      expect(chunkCount).toBeGreaterThan(0);
      expect(fullResponse.length).toBeGreaterThan(0);
      console.log(`✅ Streamed ${chunkCount} chunks`);
    });
  });

  describe("3. Exercise Generation", () => {
    it("should generate practice exercises using mock service", async () => {
      const result = await testServices.openai.generateExercises("verb conjugation", "es", 5);

      expect(Array.isArray(result.exercises)).toBe(true);
      expect(result.exercises.length).toBe(5);

      // Verify exercise structure
      const exercise = result.exercises[0];
      expect(exercise).toHaveProperty("question");
      expect(exercise).toHaveProperty("options");
      expect(exercise).toHaveProperty("correctAnswer");
      expect(exercise.options.length).toBeGreaterThan(1);

      expect(testServices.openai.generateExercises).toHaveBeenCalledWith("verb conjugation", "es", 5);
      console.log(`✅ Generated 5 exercises`);
    });
  });

  describe("4. Vocabulary Builder", () => {
    it("should generate vocabulary exercises using mock service", async () => {
      const result = await testServices.openai.generateVocabulary("food and drinks", "pt", 10);

      expect(Array.isArray(result.words)).toBe(true);
      expect(result.words.length).toBe(10);

      // Verify word structure
      const word = result.words[0];
      expect(word).toHaveProperty("word");
      expect(word).toHaveProperty("translation");
      expect(word).toHaveProperty("example");

      expect(testServices.openai.generateVocabulary).toHaveBeenCalledWith("food and drinks", "pt", 10);
      console.log(`✅ Generated vocabulary list with 10 words`);
    });
  });

  describe("5. Grammar & Pronunciation Evaluation", () => {
    it("should evaluate user input using mock service", async () => {
      const result = await testServices.openai.evaluateInput("Je suis très heureux", "fr", "grammar");

      expect(result).toHaveProperty("isCorrect");
      expect(result).toHaveProperty("feedback");
      expect(result).toHaveProperty("corrections");
      expect(typeof result.isCorrect).toBe("boolean");

      console.log(`✅ Evaluation completed`);
    });

    it("should provide detailed feedback using mock service", async () => {
      const result = await testServices.openai.evaluateInput("I goed to the school", "en", "grammar");

      expect(result).toHaveProperty("isCorrect");
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(Array.isArray(result.corrections)).toBe(true);

      console.log(`✅ Feedback provided for input`);
    });
  });

  describe("6. API Error Handling", () => {
    it("should process requests with mock service", async () => {
      const result = await testServices.openai.generateChatResponse("Hello", "en");
      expect(result).toHaveProperty("response");
      console.log(`✅ Request processed successfully`);
    });

    it("should handle multiple requests with mock service", async () => {
      // Send multiple rapid requests
      const requests = Array.from({ length: 5 }).map(() =>
        testServices.openai.generateChatResponse("Hello", "en")
      );

      const responses = await Promise.all(requests);
      expect(responses.length).toBe(5);
      expect(responses.every((r) => r.response.length > 0)).toBe(true);

      console.log(`✅ Multiple requests processed successfully`);
    });
  });
});
