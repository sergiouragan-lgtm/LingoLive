import { describe, expect, it } from "vitest";
import { validateCmsExerciseRequest, validateGeneratedCmsExercises } from "./cmsExercise.service";

const generated = Array.from({ length: 3 }, (_, index) => ({
  type: "multiple-choice",
  question: `Pergunta ${index + 1}`,
  options: ["Correta", "Incorreta"],
  answer: "Correta",
  explanation: "Explicação verificável.",
  difficulty: "Intermediate",
  tags: ["gramática", "vocabulário"],
}));

describe("CMS exercise validation", () => {
  it("normalizes a valid request", () => {
    expect(validateCmsExerciseRequest({ language: " Inglês ", proficiency: "B1", topic: "Viagens", type: "translation" }))
      .toEqual({ language: "Inglês", proficiency: "B1", topic: "Viagens", type: "translation" });
  });

  it("rejects unsupported generation requests", () => {
    expect(() => validateCmsExerciseRequest({ language: "Inglês", proficiency: "B1", topic: "Viagens", type: "invented" }))
      .toThrow("INVALID_CMS_EXERCISE_REQUEST");
  });

  it("requires exactly three complete exercises with a valid answer", () => {
    expect(validateGeneratedCmsExercises(generated)).toHaveLength(3);
    expect(() => validateGeneratedCmsExercises(generated.slice(1))).toThrow("INVALID_CMS_EXERCISE_COUNT");
    expect(() => validateGeneratedCmsExercises([{ ...generated[0], answer: "Ausente" }, ...generated.slice(1)]))
      .toThrow("INVALID_CMS_EXERCISE_OPTIONS");
  });
});
