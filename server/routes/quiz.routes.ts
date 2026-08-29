import { Router } from "express";
import { Type } from "@google/genai";
import { requireAuth } from "../middleware/requireAuth";
import { generateContentWithRetry } from "../config/gemini";
import { safeGetDoc, safeSetDoc } from "../services/firestoreSafe.service";
import { getLearningProgress } from "../services/learningProgress.repository";
import { buildAdaptiveQuizPrompt, isQuizSessionExpired, QUIZ_SESSION_TTL_MS, validateGeneratedQuiz, weakestSkills } from "../services/adaptiveQuiz.service";
import { normalizeTutorMemory } from "../services/tutorMemory.service";
import { quizGenerationLimiter, quizSubmissionLimiter } from "../middleware/rateLimit";
import { completeQuiz, QuizCompletionError } from "../services/quizCompletion.repository";

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
    const createdAt = new Date();
    await safeSetDoc("quiz_sessions", sessionId, {
      userId: req.user.uid, language, level, questions, status: "active",
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + QUIZ_SESSION_TTL_MS).toISOString(),
    }, false);
    res.status(201).json({ sessionId, questions: questions.map(({ correctAnswerIndex: _answer, explanation: _explanation, ...question }) => question) });
  } catch (error) {
    console.error("Adaptive quiz generation failed:", error);
    res.status(503).json({ error: "Não foi possível gerar um quiz validado neste momento." });
  }
});

router.post("/:sessionId/submit", requireAuth, quizSubmissionLimiter, async (req: any, res) => {
  try { res.json(await completeQuiz(req.user.uid, req.params.sessionId, Array.isArray(req.body.answers) ? req.body.answers : [], req.body.durationMinutes)); }
  catch (error) { const code = error instanceof QuizCompletionError ? error.code : "INTERNAL"; const statuses: Record<string, number> = { NOT_FOUND: 404, INVALID_ANSWERS: 400, EXPIRED: 410, UNAVAILABLE: 409, INTEGRITY_CONFLICT: 409, STORAGE_UNAVAILABLE: 503 }; res.status(statuses[code] || 500).json({ error: code }); }
});

export default router;
