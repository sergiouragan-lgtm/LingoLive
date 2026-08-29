const exerciseTypes = new Set(["multiple-choice", "true-false", "fill-in-blanks", "translation", "pronunciation"]);
const difficulties = new Set(["Beginner", "Intermediate", "Advanced"]);

export function validateCmsExerciseRequest(body: any) {
  const language = typeof body?.language === "string" ? body.language.trim() : "";
  const proficiency = typeof body?.proficiency === "string" ? body.proficiency.trim() : "";
  const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
  const type = typeof body?.type === "string" ? body.type.trim() : "";
  if (!language || language.length > 60 || !proficiency || proficiency.length > 30 || !topic || topic.length > 160 || !exerciseTypes.has(type)) {
    throw new Error("INVALID_CMS_EXERCISE_REQUEST");
  }
  return { language, proficiency, topic, type };
}

export function validateGeneratedCmsExercises(value: unknown, expectedType?: string) {
  if (!Array.isArray(value) || value.length !== 3) throw new Error("INVALID_CMS_EXERCISE_COUNT");
  return value.map((exercise: any) => {
    const options = Array.isArray(exercise?.options) ? exercise.options : [];
    if (
      !exercise || typeof exercise.question !== "string" || !exercise.question.trim() ||
      typeof exercise.answer !== "string" || !exercise.answer.trim() ||
      typeof exercise.explanation !== "string" || !exercise.explanation.trim() ||
      !difficulties.has(exercise.difficulty) ||
      !Array.isArray(exercise.tags) || exercise.tags.length < 2 || exercise.tags.length > 3 ||
      exercise.tags.some((tag: unknown) => typeof tag !== "string" || !tag.trim())
    ) throw new Error("INVALID_CMS_EXERCISE");

    const exerciseType = expectedType || exercise.type;
    const needsOptions = exerciseType === "multiple-choice" || exerciseType === "true-false";
    if (needsOptions && (options.length < 2 || !options.includes(exercise.answer))) {
      throw new Error("INVALID_CMS_EXERCISE_OPTIONS");
    }
    return {
      question: exercise.question.trim(),
      options: options.map((option: string) => option.trim()),
      answer: exercise.answer.trim(),
      explanation: exercise.explanation.trim(),
      difficulty: exercise.difficulty,
      tags: exercise.tags.map((tag: string) => tag.trim()),
    };
  });
}
