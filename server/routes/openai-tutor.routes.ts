import { Router } from "express";
import { OpenAIService } from "../services/openai.service";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/**
 * POST /api/ai-tutor/chat
 * Send message to AI tutor
 */
router.post("/chat", requireAuth, async (req: any, res: any) => {
  try {
    const { language, level, message, history = [] } = req.body;
    const userId = req.user.uid;

    if (!language || !message) {
      return res.status(400).json({ error: "language and message required" });
    }

    const context = {
      userId,
      language,
      level: level || "intermediate",
      history,
    };

    const response = await OpenAIService.generateTutorResponse(context, message);

    res.json({
      response,
      language,
      level,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[AI Tutor] Chat failed:", error.message);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

/**
 * POST /api/ai-tutor/chat-stream
 * Stream response from AI tutor
 */
router.post("/chat-stream", requireAuth, async (req: any, res: any) => {
  try {
    const { language, level, message, history = [] } = req.body;

    if (!language || !message) {
      return res.status(400).json({ error: "language and message required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const context = {
      userId: req.user.uid,
      language,
      level: level || "intermediate",
      history,
    };

    for await (const chunk of OpenAIService.streamTutorResponse(context, message)) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.end();
  } catch (error: any) {
    console.error("[AI Tutor] Stream failed:", error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/ai-tutor/exercises
 * Generate exercises for a topic
 */
router.post("/exercises", requireAuth, async (req: any, res: any) => {
  try {
    const { language, level, topic, count = 5 } = req.body;

    if (!language || !level || !topic) {
      return res.status(400).json({ error: "language, level, and topic required" });
    }

    const exercises = await OpenAIService.generateExercises(
      language,
      level,
      topic,
      Math.min(count, 20)
    );

    res.json({
      exercises,
      count: exercises.length,
      language,
      level,
      topic,
    });
  } catch (error: any) {
    console.error("[AI Tutor] Exercise generation failed:", error.message);
    res.status(500).json({ error: "Failed to generate exercises" });
  }
});

/**
 * POST /api/ai-tutor/vocabulary
 * Generate vocabulary exercises
 */
router.post("/vocabulary", requireAuth, async (req: any, res: any) => {
  try {
    const { language, level, count = 5 } = req.body;

    if (!language || !level) {
      return res.status(400).json({ error: "language and level required" });
    }

    const vocabulary = await OpenAIService.generateVocabularyExercises(
      language,
      level,
      Math.min(count, 20)
    );

    res.json({
      vocabulary,
      count: vocabulary.length,
      language,
      level,
    });
  } catch (error: any) {
    console.error("[AI Tutor] Vocabulary generation failed:", error.message);
    res.status(500).json({ error: "Failed to generate vocabulary" });
  }
});

/**
 * POST /api/ai-tutor/evaluate
 * Evaluate pronunciation/grammar
 */
router.post("/evaluate", requireAuth, async (req: any, res: any) => {
  try {
    const { language, text } = req.body;

    if (!language || !text) {
      return res.status(400).json({ error: "language and text required" });
    }

    const evaluation = await OpenAIService.evaluatePronunciation(text, language);

    res.json({
      text,
      language,
      evaluation,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[AI Tutor] Evaluation failed:", error.message);
    res.status(500).json({ error: "Failed to evaluate" });
  }
});

export default router;
