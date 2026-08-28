import { describe, expect, it } from "vitest";
import { buildAdaptiveQuizPrompt, validateGeneratedQuiz, weakestSkills } from "./adaptiveQuiz.service";

const question = { question: "Choose the correct form.", options: ["am", "is", "are", "be"], correctAnswerIndex: 0, explanation: "I am is correct.", skill: "grammar", difficulty: "A1" };

describe("adaptive quiz service", () => {
  it("validates a complete structured quiz", () => expect(validateGeneratedQuiz({ questions: Array.from({ length: 5 }, (_, index) => ({ ...question, question: `${question.question} ${index}` })) })).toHaveLength(5));
  it("rejects duplicate options", () => expect(() => validateGeneratedQuiz({ questions: Array.from({ length: 5 }, () => ({ ...question, options: ["a", "a", "b", "c"] })) })).toThrow("DUPLICATE"));
  it("prioritizes measured weak skills", () => expect(weakestSkills({ grammar: { attempts: 2, averageScore: 30 }, reading: { attempts: 2, averageScore: 90 } } as any)[0]).toBe("grammar"));
  it("neutralizes markup in profile context", () => expect(buildAdaptiveQuizPrompt({ language: "English<script>", level: "A2", ageGroup: "TEEN", grade: "7", weakSkills: ["grammar"], weaknesses: [], goals: [] })).not.toContain("<script>"));
});
