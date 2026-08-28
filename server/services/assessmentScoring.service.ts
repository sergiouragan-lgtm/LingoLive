export interface GeneratedAssessmentQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export function validateGeneratedQuestions(value: unknown): GeneratedAssessmentQuestion[] {
  if (!Array.isArray(value) || value.length !== 5) {
    throw new Error("INVALID_ASSESSMENT_QUESTION_COUNT");
  }

  return value.map((item: any) => {
    if (
      !item ||
      typeof item.question !== "string" ||
      !item.question.trim() ||
      !Array.isArray(item.options) ||
      item.options.length !== 4 ||
      item.options.some((option: unknown) => typeof option !== "string" || !option.trim()) ||
      !Number.isInteger(item.correctAnswer) ||
      item.correctAnswer < 0 ||
      item.correctAnswer > 3
    ) {
      throw new Error("INVALID_ASSESSMENT_QUESTION");
    }

    return {
      question: item.question.trim(),
      options: item.options.map((option: string) => option.trim()),
      correctAnswer: item.correctAnswer,
    };
  });
}

export function scoreAssessment(questions: GeneratedAssessmentQuestion[], answers: unknown) {
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new Error("INVALID_ASSESSMENT_ANSWERS");
  }

  const normalizedAnswers = answers.map((answer) => {
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
      throw new Error("INVALID_ASSESSMENT_ANSWER");
    }
    return Number(answer);
  });
  const correctCount = questions.reduce(
    (total, question, index) => total + (normalizedAnswers[index] === question.correctAnswer ? 1 : 0),
    0,
  );
  const percentage = Math.round((correctCount / questions.length) * 100);
  const suggestedLevel = percentage >= 90 ? "C2"
    : percentage >= 75 ? "C1"
      : percentage >= 60 ? "B2"
        : percentage >= 40 ? "B1"
          : percentage >= 20 ? "A2" : "A1";

  return { correctCount, percentage, suggestedLevel };
}
