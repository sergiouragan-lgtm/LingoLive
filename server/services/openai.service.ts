/**
 * OpenAI Service — AI Language Tutor
 */

import { OpenAI } from "openai";

let client: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY || process.env.OPENAI_ADMIN_KEY) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else if (process.env.NODE_ENV === "test") {
    // In test mode, use a dummy key to allow initialization
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "sk-test-dummy",
    });
  }
} catch (err) {
  console.warn("[OpenAI Service] Failed to initialize OpenAI client (will use fallback):", (err as Error).message);
}

export interface ConversationContext {
  userId: string;
  language: string;
  level: "beginner" | "intermediate" | "advanced";
  topic?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

export class OpenAIService {
  /**
   * Generate AI tutor response
   */
  static async generateTutorResponse(
    context: ConversationContext,
    userMessage: string
  ): Promise<string> {
    if (!client) {
      // Fallback for test mode
      return `[Mock Tutor Response] I understand you're learning ${context.language}. That's great! Here's some help with your question.`;
    }

    const systemPrompt = this.buildSystemPrompt(context);

    const messages = [
      ...context.history,
      { role: "user" as const, content: userMessage },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  }

  /**
   * Stream AI tutor response
   */
  static async *streamTutorResponse(
    context: ConversationContext,
    userMessage: string
  ) {
    if (!client) {
      // Fallback for test mode
      const mockResponse = `[Mock Streaming] I understand you're learning ${context.language}. `;
      for (const char of mockResponse) {
        yield char;
      }
      return;
    }

    const systemPrompt = this.buildSystemPrompt(context);

    const messages = [
      ...context.history,
      { role: "user" as const, content: userMessage },
    ];

    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Generate exercises
   */
  static async generateExercises(
    language: string,
    level: string,
    topic: string,
    count: number = 5
  ): Promise<
    Array<{
      question: string;
      options?: string[];
      correctAnswer: string;
      explanation: string;
    }>
  > {
    if (!client) {
      // Fallback for test mode
      return Array.from({ length: count }, (_, i) => ({
        question: `Mock question ${i + 1} for ${language} at ${level} level`,
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        explanation: "This is a mock exercise explanation.",
      }));
    }

    const prompt = `
      Generate ${count} language learning exercises for ${language} at ${level} level.
      Topic: ${topic}

      Format each as JSON:
      {
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "explanation": "..."
      }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "[]";

    try {
      const match = content.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  /**
   * Evaluate pronunciation (text-based for now)
   */
  static async evaluatePronunciation(text: string, language: string): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    if (!client) {
      // Fallback for test mode
      return {
        score: 75,
        feedback: "Good effort! [Mock evaluation]",
        suggestions: ["Continue practicing", "Pay attention to accent"],
      };
    }

    const prompt = `
      Evaluate the pronunciation and grammar of this ${language} text:
      "${text}"

      Respond with JSON:
      {
        "score": 0-100,
        "feedback": "...",
        "suggestions": ["...", "..."]
      }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "{}";

    try {
      const match = content.match(/\{[\s\S]*\}/);
      return match
        ? JSON.parse(match[0])
        : {
            score: 50,
            feedback: "Unable to evaluate",
            suggestions: [],
          };
    } catch {
      return {
        score: 50,
        feedback: "Unable to evaluate",
        suggestions: [],
      };
    }
  }

  /**
   * Generate vocabulary exercises
   */
  static async generateVocabularyExercises(
    language: string,
    level: string,
    count: number = 5
  ): Promise<
    Array<{
      word: string;
      translation: string;
      partOfSpeech: string;
      example: string;
      difficulty: number;
    }>
  > {
    if (!client) {
      // Fallback for test mode
      return Array.from({ length: count }, (_, i) => ({
        word: `word_${i + 1}`,
        translation: `translation_${i + 1}`,
        partOfSpeech: "noun",
        example: `Example sentence ${i + 1}`,
        difficulty: (i % 5) + 1,
      }));
    }

    const prompt = `
      Generate ${count} vocabulary words for ${language} at ${level} level.
      Include translations and examples.

      Format as JSON array:
      [
        {
          "word": "...",
          "translation": "...",
          "partOfSpeech": "noun|verb|adjective|...",
          "example": "...",
          "difficulty": 1-5
        }
      ]
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "[]";

    try {
      const match = content.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : [];
    } catch {
      return [];
    }
  }

  /**
   * Build system prompt for tutor
   */
  private static buildSystemPrompt(context: ConversationContext): string {
    return `You are a friendly and patient language tutor helping a student learn ${context.language}.

Student Level: ${context.level}
${context.topic ? `Current Topic: ${context.topic}` : ""}

Your responsibilities:
1. Provide clear, concise explanations
2. Use examples relevant to the student's level
3. Encourage learning with positive feedback
4. Correct mistakes gently and constructively
5. Ask follow-up questions to deepen understanding
6. Adapt your explanation style to the student's level

Always respond in a way that:
- Is educational and engaging
- Builds confidence
- Addresses the student's specific question
- Provides practical examples when possible`;
  }
}
