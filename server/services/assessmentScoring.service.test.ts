import { describe, expect, it } from "vitest";
import { scoreAssessment, validateGeneratedQuestions } from "./assessmentScoring.service";

const questions = Array.from({ length: 5 }, (_, index) => ({
  question: `Pergunta ${index + 1}`,
  options: ["A", "B", "C", "D"],
  correctAnswer: index % 4,
}));

describe("assessment scoring", () => {
  it("validates a complete generated assessment", () => {
    expect(validateGeneratedQuestions(questions)).toHaveLength(5);
  });

  it("rejects malformed or incomplete question banks", () => {
    expect(() => validateGeneratedQuestions(questions.slice(0, 4))).toThrow("INVALID_ASSESSMENT_QUESTION_COUNT");
    expect(() => validateGeneratedQuestions([{ ...questions[0], correctAnswer: 7 }, ...questions.slice(1)]))
      .toThrow("INVALID_ASSESSMENT_QUESTION");
  });

  it("scores only against the server-side answer key", () => {
    expect(scoreAssessment(questions, [0, 1, 2, 3, 0])).toEqual({
      correctCount: 5,
      percentage: 100,
      suggestedLevel: "C2",
    });
    expect(scoreAssessment(questions, [3, 3, 3, 3, 3]).percentage).toBe(20);
  });

  it("rejects missing and invalid answers", () => {
    expect(() => scoreAssessment(questions, [0])).toThrow("INVALID_ASSESSMENT_ANSWERS");
    expect(() => scoreAssessment(questions, [0, 1, 2, 3, 9])).toThrow("INVALID_ASSESSMENT_ANSWER");
  });
});
