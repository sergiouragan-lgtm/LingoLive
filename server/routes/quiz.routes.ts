import { Router } from "express";
import { Type } from "@google/genai";
import { requireAuth } from "../middleware/requireAuth";
import { generateContentWithRetry } from "../config/gemini";
import { safeGetDoc, safeSetDoc } from "../services/firestoreSafe.service";
import { getLearningProgress, recordLearningEvent } from "../services/learningProgress.repository";
import { buildAdaptiveQuizPrompt, validateGeneratedQuiz, weakestSkills } from "../services/adaptiveQuiz.service";
import { normalizeTutorMemory } from "../services/tutorMemory.service";
import { quizGenerationLimiter, quizSubmissionLimiter } from "../middleware/rateLimit";

const router = Router();
const allowedLevels = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

router.post("/generate", requireAuth, quizGenerationLimiter, async (req: any, res) => {
  const language = typeof req.body.language === "string" ? req.body.language.trim().slice(0, 40) : "";
  if (!language) return res.status(400).json({ error: "Idioma obrigatório." });
    const requestedLevel = allowedLevels.has(req.body.level) ? req.body.level : null;
  try {
    const [progress, memoryDoc] = await Promise.all([
      getLearningProgress(req.user.uid),
      safeGetDoc("user_memory", req.user.uid),
    ]);
    const memory = normalizeTutorMemory(memoryDoc.exists ? memoryDoc.data() : null, req.user.uid);
    const level = allowedLevels.has(memory.cefrLevel) ? memory.cefrLevel : requestedLevel || "A1";
    const prompt = buildAdaptiveQuizPrompt({
      language,
      level,
      ageGroup: String(req.body.ageGroup || "ADULT").slice(0, 20),
      grade: String(req.body.grade || "não informado").slice(0, 30),
      weakSkills: weakestSkills(progress.skills),
      weaknesses: Array.from(memory.grammarWeaknesses),
      goals: Array.from(memory.learningGoals),
    });
    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
            question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING },
            skill: { type: Type.STRING }, difficulty: { type: Type.STRING },
          }, required: ["question", "options", "correctAnswerIndex", "explanation", "skill", "difficulty"] } } },
          required: ["questions"],
        },
      },
    });
    const generated = validateGeneratedQuiz(JSON.parse(response.text || "{}"));
    const sessionId = `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const questions = generated.map((question, index) => ({ ...question, id: `${sessionId}_${index + 1}` }));
    await safeSetDoc("quiz_sessions", sessionId, { userId: req.user.uid, language, level, questions, status: "active", createdAt: new Date().toISOString() }, false);
    res.status(201).json({ sessionId, questions: questions.map(({ correctAnswerIndex: _answer, explanation: _explanation, ...question }) => question) });
  } catch (error) {
    console.error("Adaptive quiz generation failed:", error);
    res.status(503).json({ error: "Não foi possível gerar um quiz validado neste momento." });
  }
});

router.post("/:sessionId/submit", requireAuth, quizSubmissionLimiter, async (req: any, res) => {
  const session = await safeGetDoc("quiz_sessions", req.params.sessionId);
  if (!session.exists) return res.status(404).json({ error: "Quiz não encontrado." });
  const data = session.data();
  if (data.userId !== req.user.uid) return res.status(403).json({ error: "Acesso negado." });
  if (data.status === "completed" && data.result) return res.json(data.result);
  if (data.status !== "active") return res.status(409).json({ error: "Quiz indisponível para submissão." });
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  if (answers.length !== data.questions.length || answers.some((answer: unknown) => !Number.isInteger(answer))) return res.status(400).json({ error: "Respostas inválidas." });
  const results = data.questions.map((question: any, index: number) => ({
    questionId: question.id, correct: answers[index] === question.correctAnswerIndex,
    correctAnswerIndex: question.correctAnswerIndex, explanation: question.explanation, skill: question.skill,
  }));
  const correctAnswers = results.filter((result: any) => result.correct).length;
  const score = Math.round(correctAnswers / results.length * 100);
  const durationMinutes = Math.max(0.1, Math.min(120, Number(req.body.durationMinutes) || 0.1));
  const result = { score, correctAnswers, totalQuestions: results.length, results };
  await safeSetDoc("quiz_sessions", req.params.sessionId, { status: "completed", answers, score, result, completedAt: new Date().toISOString() });
  await recordLearningEvent(req.user.uid, { id: `quiz_${req.params.sessionId}`, type: "quiz", language: data.language, occurredAt: new Date().toISOString(), durationMinutes, score, skills: [...new Set(data.questions.map((question: any) => question.skill))] as any });
  res.json(result);
});

export default router;
