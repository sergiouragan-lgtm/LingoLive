import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  chatWithAssistant,
  extractVocabulary,
  generateGrammarExplanation,
  type ChatMessage,
} from "../services/ebook/EbookAIAssistantService";
import { getEnrollment } from "../services/ebook/AdaptiveLearningService";

const router = Router();

// ── AI chat about chapter content ─────────────────────────────────────────────
router.post("/chat", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, chapterTitle, chapterContent, ebookLanguage, cefrLevel, history, message } = req.body;

  if (!ebookId || !chapterContent || !ebookLanguage || !message) {
    return res.status(400).json({
      error: "ebookId, chapterContent, ebookLanguage e message são obrigatórios",
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: "Mensagem muito longa (máx. 1000 caracteres)" });
  }

  // Verify enrollment
  const enrollment = await getEnrollment(ebookId, userId);
  if (!enrollment) {
    return res.status(403).json({ error: "Acesso negado — inscreva-se primeiro" });
  }

  try {
    const reply = await chatWithAssistant(
      chapterTitle ?? "Capítulo",
      chapterContent,
      ebookLanguage,
      cefrLevel ?? enrollment.currentCefrLevel ?? "B1",
      (history ?? []) as ChatMessage[],
      message
    );
    return res.json({ success: true, reply });
  } catch (err: any) {
    console.error("[ebook-assistant] chat error:", err.message);
    return res.status(500).json({ error: "Falha ao processar mensagem" });
  }
});

// ── Extract vocabulary from chapter ──────────────────────────────────────────
router.post("/vocabulary", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, chapterContent, ebookLanguage, cefrLevel, count = 10 } = req.body;

  if (!ebookId || !chapterContent || !ebookLanguage) {
    return res.status(400).json({
      error: "ebookId, chapterContent e ebookLanguage são obrigatórios",
    });
  }

  if (count < 1 || count > 30) {
    return res.status(400).json({ error: "count deve ser entre 1 e 30" });
  }

  const enrollment = await getEnrollment(ebookId, userId);
  if (!enrollment) {
    return res.status(403).json({ error: "Acesso negado — inscreva-se primeiro" });
  }

  try {
    const vocabulary = await extractVocabulary(
      chapterContent,
      ebookLanguage,
      cefrLevel ?? enrollment.currentCefrLevel ?? "B1",
      count
    );
    return res.json({ success: true, vocabulary });
  } catch (err: any) {
    console.error("[ebook-assistant] vocabulary error:", err.message);
    return res.status(500).json({ error: "Falha ao extrair vocabulário" });
  }
});

// ── Grammar explanation for a sentence ───────────────────────────────────────
router.post("/grammar", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, sentence, ebookLanguage, cefrLevel } = req.body;

  if (!ebookId || !sentence || !ebookLanguage) {
    return res.status(400).json({ error: "ebookId, sentence e ebookLanguage são obrigatórios" });
  }

  if (sentence.length > 500) {
    return res.status(400).json({ error: "Frase muito longa (máx. 500 caracteres)" });
  }

  const enrollment = await getEnrollment(ebookId, userId);
  if (!enrollment) {
    return res.status(403).json({ error: "Acesso negado — inscreva-se primeiro" });
  }

  try {
    const explanation = await generateGrammarExplanation(
      sentence,
      ebookLanguage,
      cefrLevel ?? enrollment.currentCefrLevel ?? "B1"
    );
    return res.json({ success: true, explanation });
  } catch (err: any) {
    console.error("[ebook-assistant] grammar error:", err.message);
    return res.status(500).json({ error: "Falha ao gerar explicação gramatical" });
  }
});

export default router;
