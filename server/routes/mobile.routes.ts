import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { attachSchoolClaims } from "../middleware/requireSchoolClaims";
import {
  safeAddDoc,
  safeGetDoc,
  safeListDocs,
  safeQueryDocs,
  safeSetDoc,
} from "../services/firestoreSafe.service";
import {
  CANONICAL_LEARNING_EVENTS,
  CANONICAL_LEARNING_EVENT_TYPES,
  ingestLearningEvent,
  listLearningEvents,
  resolveLearningActor,
} from "../services/learning/learningEvents.service";
import {
  gradeMobileQuiz,
  loadMobileQuiz,
  QuizUnavailableError,
} from "../services/learning/mobileQuiz.service";
import { qualityToScore, reviewCard } from "../services/learning/flashcardSrs.service";

const router = Router();

const number = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/**
 * GET /api/mobile/activities
 * Catálogo real das três atividades mobile. Devolve apenas conteúdo persistido;
 * quando não existe conteúdo publicado responde 200 com listas vazias e a razão,
 * em vez de fabricar exercícios.
 */
router.get("/activities", requireAuth, attachSchoolClaims, async (req: any, res) => {
  try {
    const claims = req.schoolClaims;

    const exams = (await safeQueryDocs("assessment_exams", "status", "published"))
      .filter((exam: any) => Array.isArray(exam.questions) && exam.questions.length > 0)
      .filter((exam: any) => !exam.tenantId || exam.tenantId === claims.tenantId);

    const quizzes = exams.map((exam: any) => ({
      id: exam.id,
      title: exam.title || "Quiz LingoLIVE",
      language: exam.language || null,
      questionCount: exam.questions.filter((question: any) =>
        ["multiple-choice", "true-false", "fill-blank"].includes(question.type)).length,
    })).filter((quiz: any) => quiz.questionCount > 0);

    const savedVocabulary = await safeGetDoc("user_achievements", req.user.uid);
    const savedWords = savedVocabulary.exists && Array.isArray(savedVocabulary.data().savedWords)
      ? savedVocabulary.data().savedWords : [];

    const flashcards = (await safeListDocs("flashcards"))
      .filter((card: any) => !card.tenantId || card.tenantId === claims.tenantId)
      .map((card: any) => ({
        id: card.id,
        collectionId: card.collectionId || null,
        front: card.front,
        back: card.back,
        mediaUrl: card.mediaUrl || null,
        difficulty: card.difficulty || null,
      }));

    const pronunciationPrompts = (await safeListDocs("pronunciation_prompts"))
      .filter((prompt: any) => !prompt.tenantId || prompt.tenantId === claims.tenantId)
      .map((prompt: any) => ({
        id: prompt.id,
        text: prompt.text || prompt.targetText,
        language: prompt.language || null,
      }))
      .filter((prompt: any) => Boolean(prompt.text));

    return res.json({
      tenantId: claims.tenantId,
      quizzes,
      flashcards,
      pronunciationPrompts,
      savedWords,
      emptyReasons: {
        quizzes: quizzes.length === 0 ? "NO_PUBLISHED_MOBILE_QUIZZES" : null,
        flashcards: flashcards.length === 0 ? "NO_FLASHCARDS_FOR_TENANT" : null,
        pronunciationPrompts: pronunciationPrompts.length === 0 ? "NO_PRONUNCIATION_PROMPTS" : null,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Mobile] Falha ao listar atividades:", error);
    return res.status(503).json({
      error: "MOBILE_ACTIVITIES_UNAVAILABLE",
      message: "Não foi possível carregar as atividades reais neste momento.",
      retryable: true,
    });
  }
});

/**
 * GET /api/mobile/quiz/:quizId
 * Devolve o quiz sem a chave de resposta.
 */
router.get("/quiz/:quizId", requireAuth, async (req: any, res) => {
  try {
    const quiz = await loadMobileQuiz(req.params.quizId);
    return res.json(quiz);
  } catch (error: any) {
    if (error instanceof QuizUnavailableError) {
      return res.status(404).json({ error: error.message });
    }
    console.error("[Mobile] Falha ao carregar quiz:", error);
    return res.status(500).json({ error: "MOBILE_QUIZ_LOAD_FAILED" });
  }
});

/**
 * POST /api/mobile/quiz/submit
 * Corrige no servidor, emite o evento canónico e atribui XP.
 */
router.post("/quiz/submit", requireAuth, async (req: any, res) => {
  const { quizId, answers, attemptId } = req.body || {};

  if (!quizId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Os parâmetros 'quizId' e 'answers' são obrigatórios." });
  }

  try {
    const actor = await resolveLearningActor(req.user);
    const graded = await gradeMobileQuiz(quizId, answers);

    // `attemptId` permite ao cliente reenviar a mesma tentativa sem duplicar XP.
    const activityId = `${quizId}:${attemptId || new Date().toISOString().slice(0, 10)}`;

    const { event, duplicated, xp } = await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED,
      actor,
      activityId,
      score: graded.scorePercent,
      language: graded.language,
      source: "mobile",
      payload: {
        quizId,
        passed: graded.passed,
        totalPointsEarned: graded.totalPointsEarned,
        totalPointsPossible: graded.totalPointsPossible,
        masteredTerms: graded.masteredTerms,
        strugglingTerms: graded.strugglingTerms,
      },
    });

    return res.json({ result: graded, event, duplicated, xp });
  } catch (error: any) {
    if (error instanceof QuizUnavailableError) {
      return res.status(404).json({ error: error.message });
    }
    console.error("[Mobile] Falha ao submeter quiz:", error);
    return res.status(500).json({ error: "MOBILE_QUIZ_SUBMIT_FAILED", message: error.message });
  }
});

/**
 * POST /api/mobile/pronunciation/record
 * Regista o evento canónico de uma avaliação de pronúncia já produzida por
 * /api/pronunciation/evaluate. O score nunca vem do cliente: é relido do
 * documento persistido em `pronunciation_results`.
 */
router.post("/pronunciation/record", requireAuth, async (req: any, res) => {
  const { evaluationId } = req.body || {};

  if (!evaluationId) {
    return res.status(400).json({ error: "O parâmetro 'evaluationId' é obrigatório." });
  }

  try {
    const snapshot = await safeGetDoc("pronunciation_results", evaluationId);
    if (!snapshot.exists) {
      return res.status(404).json({ error: "PRONUNCIATION_EVALUATION_NOT_FOUND" });
    }

    const evaluation = snapshot.data();
    if (evaluation.userId !== req.user.uid) {
      return res.status(403).json({ error: "PRONUNCIATION_EVALUATION_FORBIDDEN" });
    }

    const actor = await resolveLearningActor(req.user);
    const { event, duplicated, xp } = await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.PRONUNCIATION_EVALUATED,
      actor,
      activityId: evaluationId,
      score: number(evaluation.overallScore),
      language: evaluation.language || null,
      source: "mobile",
      occurredOn: evaluation.timestamp,
      payload: {
        evaluationId,
        targetText: evaluation.targetText || "",
        accuracyScore: number(evaluation.accuracyScore),
        fluencyScore: number(evaluation.fluencyScore),
        completenessScore: number(evaluation.completenessScore),
        strugglingTerms: Array.isArray(evaluation.phonemeAnalysis)
          ? evaluation.phonemeAnalysis
              .filter((phoneme: any) => number(phoneme.accuracy) < 70)
              .map((phoneme: any) => String(phoneme.phoneme))
          : [],
      },
    });

    return res.json({ evaluation, event, duplicated, xp });
  } catch (error: any) {
    console.error("[Mobile] Falha ao registar pronúncia:", error);
    return res.status(500).json({ error: "MOBILE_PRONUNCIATION_RECORD_FAILED", message: error.message });
  }
});

/**
 * GET /api/mobile/flashcards/due
 * Cartas a rever hoje, com base no agendamento SRS persistido.
 */
router.get("/flashcards/due", requireAuth, attachSchoolClaims, async (req: any, res) => {
  try {
    const claims = req.schoolClaims;
    const nowMs = Date.now();

    const cards = (await safeListDocs("flashcards"))
      .filter((card: any) => !card.tenantId || card.tenantId === claims.tenantId);

    const progress = await safeQueryDocs("flashcard_progress", "userId", req.user.uid);
    const progressByCard = new Map(progress.map((item: any) => [item.cardId, item]));

    const due = cards
      .map((card: any) => {
        const state = progressByCard.get(card.id);
        const nextReviewAt = state?.nextReviewAt || null;
        return {
          id: card.id,
          collectionId: card.collectionId || null,
          front: card.front,
          back: card.back,
          mediaUrl: card.mediaUrl || null,
          repetitionCount: number(state?.repetitionCount),
          easeFactor: state?.easeFactor ?? null,
          nextReviewAt,
          isNew: !state,
        };
      })
      .filter((card: any) => card.isNew || !card.nextReviewAt || Date.parse(card.nextReviewAt) <= nowMs);

    return res.json({ due, total: cards.length, generatedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error("[Mobile] Falha ao listar flashcards:", error);
    return res.status(503).json({ error: "MOBILE_FLASHCARDS_UNAVAILABLE", retryable: true });
  }
});

/**
 * POST /api/mobile/flashcards/review
 * Aplica SM-2 no servidor, persiste o progresso e emite o evento canónico.
 */
router.post("/flashcards/review", requireAuth, async (req: any, res) => {
  const { cardId, quality, sessionId } = req.body || {};

  if (!cardId || quality === undefined || quality === null) {
    return res.status(400).json({ error: "Os parâmetros 'cardId' e 'quality' são obrigatórios." });
  }

  try {
    const cardSnapshot = await safeGetDoc("flashcards", cardId);
    if (!cardSnapshot.exists) {
      return res.status(404).json({ error: "FLASHCARD_NOT_FOUND" });
    }
    const card = cardSnapshot.data();

    const progressId = `${req.user.uid}_${cardId}`;
    const progressSnapshot = await safeGetDoc("flashcard_progress", progressId);
    const previous = progressSnapshot.exists ? progressSnapshot.data() : {};

    const srs = reviewCard(previous, quality);
    const score = qualityToScore(quality);

    await safeSetDoc("flashcard_progress", progressId, {
      id: progressId,
      userId: req.user.uid,
      cardId,
      easeFactor: srs.easeFactor,
      interval: srs.interval,
      repetitionCount: srs.repetitionCount,
      nextReviewAt: srs.nextReviewAt,
      lastReviewedAt: new Date().toISOString(),
      totalReviews: number(previous.totalReviews) + 1,
    }, true);

    const actor = await resolveLearningActor(req.user);
    const activityId = `${cardId}:${sessionId || new Date().toISOString().slice(0, 10)}`;

    const { event, duplicated, xp } = await ingestLearningEvent({
      type: CANONICAL_LEARNING_EVENTS.FLASHCARD_REVIEWED,
      actor,
      activityId,
      score,
      language: card.language || null,
      source: "mobile",
      payload: {
        cardId,
        quality: Number(quality),
        interval: srs.interval,
        nextReviewAt: srs.nextReviewAt,
        masteredTerms: srs.lapsed ? [] : [String(card.front)],
        strugglingTerms: srs.lapsed ? [String(card.front)] : [],
      },
    });

    return res.json({ srs, event, duplicated, xp });
  } catch (error: any) {
    console.error("[Mobile] Falha ao rever flashcard:", error);
    return res.status(500).json({ error: "MOBILE_FLASHCARD_REVIEW_FAILED", message: error.message });
  }
});

/**
 * GET /api/mobile/dashboard
 * Vista única do progresso mobile: XP/nível reais, linha temporal de eventos
 * canónicos, memória de longo prazo e progresso por competência. Todos os
 * valores derivam de documentos persistidos.
 */
router.get("/dashboard", requireAuth, attachSchoolClaims, async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const claims = req.schoolClaims;

    const [gamificationSnapshot, memorySnapshot, profileSnapshot, events] = await Promise.all([
      safeGetDoc("user_gamification", userId),
      safeGetDoc("user_memory", userId),
      safeGetDoc("adaptive_profiles", userId),
      listLearningEvents(userId, 50),
    ]);

    const gamification = gamificationSnapshot.exists ? gamificationSnapshot.data() : {};
    const memory = memorySnapshot.exists ? memorySnapshot.data() : {};
    const profile = profileSnapshot.exists ? profileSnapshot.data() : {};

    const totalXp = number(gamification.xp || gamification.totalXp);
    const level = number(gamification.level) || Math.floor(totalXp / 500) + 1;
    const xpIntoLevel = totalXp - (level - 1) * 500;

    const byType: Record<string, number> = {};
    for (const type of CANONICAL_LEARNING_EVENT_TYPES) byType[type] = 0;
    for (const event of events) byType[event.type] = (byType[event.type] || 0) + 1;

    const scoreFor = (type: string) => {
      const scoped = events.filter((event) => event.type === type);
      if (scoped.length === 0) return null;
      return Math.round(scoped.reduce((sum, event) => sum + number(event.score), 0) / scoped.length);
    };

    const activeDays = new Set(
      events
        .map((event) => (event.occurredOn || "").slice(0, 10))
        .filter(Boolean),
    );

    return res.json({
      userId,
      tenantId: claims.tenantId,
      role: claims.role,
      xp: {
        total: totalXp,
        level,
        xpIntoLevel: Math.max(0, xpIntoLevel),
        xpForNextLevel: 500,
        coins: number(gamification.coins),
      },
      progress: {
        quizAverage: scoreFor(CANONICAL_LEARNING_EVENTS.QUIZ_COMPLETED),
        pronunciationAverage: scoreFor(CANONICAL_LEARNING_EVENTS.PRONUNCIATION_EVALUATED),
        flashcardAverage: scoreFor(CANONICAL_LEARNING_EVENTS.FLASHCARD_REVIEWED),
        estimatedCefr: profile.estimatedCefr || null,
        activeDays: activeDays.size,
        eventCounts: byType,
      },
      memory: {
        vocabularyMastered: Array.isArray(memory.vocabularyMastered)
          ? memory.vocabularyMastered.slice(-20) : [],
        grammarWeaknesses: Array.isArray(memory.grammarWeaknesses)
          ? memory.grammarWeaknesses.slice(-20) : [],
        lastUpdated: memory.lastUpdated || null,
      },
      timeline: events.slice(0, 20).map((event) => ({
        eventId: event.eventId,
        type: event.type,
        occurredOn: event.occurredOn,
        score: event.score,
        activityId: event.activityId,
        source: event.source,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Mobile] Falha ao agregar dashboard:", error);
    return res.status(503).json({
      error: "MOBILE_DASHBOARD_UNAVAILABLE",
      message: "Não foi possível agregar o progresso real neste momento.",
      retryable: true,
    });
  }
});

/**
 * POST /api/mobile/devices
 * Regista o token FCM do dispositivo para notificações push nativas.
 */
router.post("/devices", requireAuth, async (req: any, res) => {
  const { fcmToken, platform, appVersion, deviceModel, locale } = req.body || {};

  if (!fcmToken || typeof fcmToken !== "string") {
    return res.status(400).json({ error: "O parâmetro 'fcmToken' é obrigatório." });
  }
  if (!["android", "ios"].includes(String(platform))) {
    return res.status(400).json({ error: "O parâmetro 'platform' tem de ser 'android' ou 'ios'." });
  }
  if (fcmToken.startsWith("simulated_")) {
    return res.status(422).json({
      error: "INVALID_FCM_TOKEN",
      message: "Tokens simulados não são aceites. Registe o dispositivo com um token FCM real.",
    });
  }

  try {
    const nowIso = new Date().toISOString();
    await safeSetDoc("device_tokens", fcmToken, {
      fcmToken,
      userId: req.user.uid,
      platform,
      appVersion: appVersion || null,
      deviceModel: deviceModel || null,
      locale: locale || null,
      active: true,
      updatedAt: nowIso,
    }, true);

    await safeAddDoc("auditLogs", {
      action: "MOBILE_DEVICE_REGISTERED",
      actorId: req.user.uid,
      platform,
      appVersion: appVersion || null,
      createdAt: nowIso,
    });

    return res.status(201).json({ success: true, registeredAt: nowIso });
  } catch (error: any) {
    console.error("[Mobile] Falha ao registar dispositivo:", error);
    return res.status(500).json({ error: "MOBILE_DEVICE_REGISTRATION_FAILED" });
  }
});

/**
 * DELETE /api/mobile/devices/:token
 * Desativa o token no logout, evitando envios para dispositivos alheios.
 */
router.delete("/devices/:token", requireAuth, async (req: any, res) => {
  try {
    const snapshot = await safeGetDoc("device_tokens", req.params.token);
    if (!snapshot.exists) {
      return res.status(404).json({ error: "DEVICE_TOKEN_NOT_FOUND" });
    }
    if (snapshot.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "DEVICE_TOKEN_FORBIDDEN" });
    }
    await safeSetDoc("device_tokens", req.params.token, {
      active: false,
      revokedAt: new Date().toISOString(),
    }, true);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("[Mobile] Falha ao remover dispositivo:", error);
    return res.status(500).json({ error: "MOBILE_DEVICE_REVOKE_FAILED" });
  }
});

export default router;
