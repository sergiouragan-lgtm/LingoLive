import { safeGetDoc } from "../firestoreSafe.service";

/**
 * Correção de quiz executada exclusivamente no servidor.
 *
 * O cliente mobile nunca recebe a chave de resposta antes da submissão e nunca
 * envia a pontuação: envia apenas as respostas escolhidas.
 */
export interface QuizSubmissionAnswer {
  questionId: string;
  value: string;
}

export interface GradedQuizQuestion {
  questionId: string;
  correct: boolean;
  expected: string;
  given: string;
  points: number;
  maxPoints: number;
  prompt: string;
}

export interface GradedQuiz {
  quizId: string;
  language: string | null;
  scorePercent: number;
  totalPointsEarned: number;
  totalPointsPossible: number;
  passed: boolean;
  questions: GradedQuizQuestion[];
  masteredTerms: string[];
  strugglingTerms: string[];
}

/** Tipos de questão que o cliente mobile consegue apresentar e o servidor corrigir sem IA. */
export const MOBILE_AUTOGRADABLE_TYPES = ["multiple-choice", "true-false", "fill-blank"];

const normalizeAnswer = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export class QuizUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuizUnavailableError";
  }
}

/**
 * Carrega um exame publicado e devolve apenas as questões auto-corrigíveis em
 * mobile, já sem a chave de resposta.
 */
export async function loadMobileQuiz(quizId: string) {
  const snapshot = await safeGetDoc("assessment_exams", quizId);
  if (!snapshot.exists) {
    throw new QuizUnavailableError("QUIZ_NOT_FOUND");
  }
  const exam = snapshot.data();
  if (exam.status !== "published") {
    throw new QuizUnavailableError("QUIZ_NOT_PUBLISHED");
  }

  const questions = (exam.questions || [])
    .filter((question: any) => MOBILE_AUTOGRADABLE_TYPES.includes(question.type));

  if (questions.length === 0) {
    throw new QuizUnavailableError("QUIZ_HAS_NO_MOBILE_QUESTIONS");
  }

  return {
    id: quizId,
    title: exam.title,
    language: exam.language || null,
    passingScorePercent: Number(exam.passingScorePercent ?? 60),
    questions: questions.map((question: any) => ({
      id: question.id,
      type: question.type,
      instruction: question.instruction || question.prompt || "",
      options: Array.isArray(question.options) ? question.options : [],
      points: Number(question.points ?? 1),
    })),
  };
}

/**
 * Corrige a submissão contra o gabarito persistido. Lança se o exame não
 * existir — nunca devolve uma nota inventada.
 */
export async function gradeMobileQuiz(
  quizId: string,
  answers: QuizSubmissionAnswer[],
): Promise<GradedQuiz> {
  const snapshot = await safeGetDoc("assessment_exams", quizId);
  if (!snapshot.exists) {
    throw new QuizUnavailableError("QUIZ_NOT_FOUND");
  }
  const exam = snapshot.data();
  if (exam.status !== "published") {
    throw new QuizUnavailableError("QUIZ_NOT_PUBLISHED");
  }

  const gradableQuestions = (exam.questions || [])
    .filter((question: any) => MOBILE_AUTOGRADABLE_TYPES.includes(question.type));

  if (gradableQuestions.length === 0) {
    throw new QuizUnavailableError("QUIZ_HAS_NO_MOBILE_QUESTIONS");
  }

  const questions: GradedQuizQuestion[] = [];
  const masteredTerms: string[] = [];
  const strugglingTerms: string[] = [];
  let totalPointsEarned = 0;
  let totalPointsPossible = 0;

  for (const question of gradableQuestions) {
    const maxPoints = Number(question.points ?? 1);
    totalPointsPossible += maxPoints;

    const submitted = answers.find((answer) => answer.questionId === question.id);
    const given = submitted ? String(submitted.value ?? "") : "";
    const expected = String(question.correctAnswer ?? "");
    const correct = normalizeAnswer(given) === normalizeAnswer(expected) && expected !== "";
    const points = correct ? maxPoints : 0;
    totalPointsEarned += points;

    const term = String(question.term || question.instruction || question.id);
    if (correct) masteredTerms.push(term);
    else strugglingTerms.push(term);

    questions.push({
      questionId: question.id,
      correct,
      expected,
      given,
      points,
      maxPoints,
      prompt: question.instruction || question.prompt || "",
    });
  }

  const scorePercent = totalPointsPossible > 0
    ? Math.round((totalPointsEarned / totalPointsPossible) * 100) : 0;

  return {
    quizId,
    language: exam.language || null,
    scorePercent,
    totalPointsEarned,
    totalPointsPossible,
    passed: scorePercent >= Number(exam.passingScorePercent ?? 60),
    questions,
    masteredTerms,
    strugglingTerms,
  };
}
