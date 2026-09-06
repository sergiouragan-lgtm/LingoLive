import { beforeEach, describe, expect, it } from "vitest";
import { localMemoryDb, safeSetDoc } from "../firestoreSafe.service";
import {
  gradeMobileQuiz,
  loadMobileQuiz,
  MOBILE_AUTOGRADABLE_TYPES,
  QuizUnavailableError,
} from "./mobileQuiz.service";

const EXAM = {
  id: "quiz-1",
  title: "Inglês A2",
  language: "en",
  status: "published",
  passingScorePercent: 60,
  questions: [
    {
      id: "q1",
      type: "multiple-choice",
      instruction: "Escolhe a tradução de 'casa'.",
      options: ["house", "horse", "hose"],
      correctAnswer: "house",
      points: 2,
      term: "house",
    },
    {
      id: "q2",
      type: "true-false",
      instruction: "'Cat' significa gato.",
      correctAnswer: "Verdadeiro",
      points: 1,
      term: "cat",
    },
    {
      id: "q3",
      type: "essay",
      instruction: "Escreve um parágrafo sobre a tua rotina.",
      points: 10,
    },
  ],
};

beforeEach(async () => {
  for (const key of [...localMemoryDb.keys()]) {
    if (key.startsWith("assessment_exams_")) localMemoryDb.delete(key);
  }
  await safeSetDoc("assessment_exams", EXAM.id, EXAM, false);
});

describe("carregamento do quiz mobile", () => {
  it("entrega as questões sem a chave de resposta", async () => {
    const quiz = await loadMobileQuiz("quiz-1");
    expect(quiz.questions).toHaveLength(2);
    for (const question of quiz.questions) {
      expect(MOBILE_AUTOGRADABLE_TYPES).toContain(question.type);
      expect(question).not.toHaveProperty("correctAnswer");
    }
    // As opções contêm necessariamente a resposta certa — o que não pode
    // vazar é a chave que identifica qual delas é. Uma questão de preenchimento
    // livre torna a fuga detetável: o seu gabarito não aparece em lado nenhum.
    expect(JSON.stringify(quiz)).not.toContain("correctAnswer");
    expect(JSON.stringify(quiz)).not.toContain("Verdadeiro");
  });

  it("recusa exames inexistentes ou por publicar", async () => {
    await expect(loadMobileQuiz("nao-existe")).rejects.toThrow("QUIZ_NOT_FOUND");
    await safeSetDoc("assessment_exams", "rascunho", { ...EXAM, id: "rascunho", status: "draft" }, false);
    await expect(loadMobileQuiz("rascunho")).rejects.toThrow("QUIZ_NOT_PUBLISHED");
  });

  it("recusa exames sem questões corrigíveis em mobile", async () => {
    await safeSetDoc("assessment_exams", "so-ensaio", {
      ...EXAM,
      id: "so-ensaio",
      questions: [EXAM.questions[2]],
    }, false);
    await expect(loadMobileQuiz("so-ensaio")).rejects.toThrow("QUIZ_HAS_NO_MOBILE_QUESTIONS");
  });
});

describe("correção no servidor", () => {
  it("pontua apenas as questões auto-corrigíveis", async () => {
    const graded = await gradeMobileQuiz("quiz-1", [
      { questionId: "q1", value: "house" },
      { questionId: "q2", value: "Verdadeiro" },
      { questionId: "q3", value: "texto longo" },
    ]);

    expect(graded.totalPointsPossible).toBe(3);
    expect(graded.totalPointsEarned).toBe(3);
    expect(graded.scorePercent).toBe(100);
    expect(graded.passed).toBe(true);
    expect(graded.masteredTerms).toEqual(["house", "cat"]);
    expect(graded.strugglingTerms).toEqual([]);
  });

  it("ignora maiúsculas e espaços supérfluos na comparação", async () => {
    const graded = await gradeMobileQuiz("quiz-1", [
      { questionId: "q1", value: "  HOUSE " },
      { questionId: "q2", value: "verdadeiro" },
    ]);
    expect(graded.scorePercent).toBe(100);
  });

  it("trata respostas em falta como erradas sem rebentar", async () => {
    const graded = await gradeMobileQuiz("quiz-1", []);
    expect(graded.scorePercent).toBe(0);
    expect(graded.passed).toBe(false);
    expect(graded.strugglingTerms).toEqual(["house", "cat"]);
    expect(graded.questions.every((question) => question.given === "")).toBe(true);
  });

  it("aplica a ponderação por pontos, não a contagem de acertos", async () => {
    const graded = await gradeMobileQuiz("quiz-1", [
      { questionId: "q1", value: "house" },
      { questionId: "q2", value: "Falso" },
    ]);
    expect(graded.totalPointsEarned).toBe(2);
    expect(graded.scorePercent).toBe(67);
    expect(graded.passed).toBe(true);
  });

  it("nunca dá como correta uma questão sem gabarito definido", async () => {
    await safeSetDoc("assessment_exams", "sem-chave", {
      ...EXAM,
      id: "sem-chave",
      questions: [{ id: "q1", type: "fill-blank", instruction: "?", points: 1 }],
    }, false);
    const graded = await gradeMobileQuiz("sem-chave", [{ questionId: "q1", value: "" }]);
    expect(graded.questions[0].correct).toBe(false);
    expect(graded.scorePercent).toBe(0);
  });

  it("recusa corrigir contra um exame que não existe", async () => {
    await expect(gradeMobileQuiz("fantasma", [])).rejects.toBeInstanceOf(QuizUnavailableError);
  });
});
