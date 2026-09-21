/**
 * Mock OpenAI Service
 * Used in integration tests to simulate OpenAI API without real calls
 */

import { vi } from "vitest";

export const createMockOpenAIService = () => {
  return {
    generateChatResponse: vi.fn(async (message: string, language: string) => ({
      response: `Mock response to: "${message}" in ${language}. This is a simulated AI tutor response.`,
      tokensUsed: 42,
      finishReason: "stop",
    })),

    generateExercises: vi.fn(async (topic: string, language: string, count: number) => ({
      exercises: Array.from({ length: count }, (_, i) => ({
        id: `ex_mock_${i}`,
        question: `Mock question ${i + 1} about ${topic}`,
        options: [
          { id: "a", text: `Option A for question ${i + 1}` },
          { id: "b", text: `Option B for question ${i + 1}` },
          { id: "c", text: `Option C for question ${i + 1}` },
          { id: "d", text: `Option D for question ${i + 1}` },
        ],
        correctAnswer: "a",
        explanation: `This is the explanation for question ${i + 1}`,
      })),
    })),

    generateVocabulary: vi.fn(async (topic: string, language: string, count: number) => ({
      words: Array.from({ length: count }, (_, i) => ({
        id: `word_mock_${i}`,
        word: `mock_word_${i + 1}`,
        translation: `Word ${i + 1} translation`,
        partOfSpeech: "noun",
        example: `This is an example sentence with word ${i + 1}`,
        pronunciation: `/pɹə'naʊn.si.ˌeɪ.ʃən/`,
      })),
    })),

    evaluateInput: vi.fn(async (input: string, language: string, evaluationType: string) => ({
      isCorrect: Math.random() > 0.3,
      feedback: `Mock feedback for: "${input}"`,
      corrections: [`Correction suggestion 1`, `Correction suggestion 2`],
      score: Math.floor(Math.random() * 100),
    })),

    streamChatResponse: vi.fn(async function* (message: string, language: string) {
      yield { chunk: "Mock", tokensUsed: 1 };
      yield { chunk: " response", tokensUsed: 2 };
      yield { chunk: " to: ", tokensUsed: 1 };
      yield { chunk: `"${message}"`, tokensUsed: 5 };
      yield { chunk: " in ", tokensUsed: 1 };
      yield { chunk: language, tokensUsed: 3 };
      yield { chunk: ".", tokensUsed: 0 };
    }),
  };
};
