import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  generateEbookStructure,
  generateChapterContent,
  improveContent,
  generateTitleSuggestions,
  generateExercises,
  analyzeToneConsistency,
  adaptToLevel,
  type ToneConfig,
} from "../services/ebook/EbookCurationService";
import { safeAddDoc, safeSetDoc, safeGetDoc, safeQueryDocs } from "../services/firestoreSafe.service";

const router = Router();

router.post("/generate-structure", requireAuth, async (req: any, res) => {
  const { topic, language, cefrLevel, tone, numChapters = 8 } = req.body;

  if (!topic || !language || !cefrLevel || !tone) {
    return res.status(400).json({ error: "topic, language, cefrLevel e tone são obrigatórios" });
  }

  if (numChapters < 2 || numChapters > 20) {
    return res.status(400).json({ error: "numChapters deve ser entre 2 e 20" });
  }

  try {
    const structure = await generateEbookStructure(topic, language, cefrLevel, tone as ToneConfig, numChapters);
    return res.json({ success: true, structure });
  } catch (err: any) {
    console.error("[ebook] generate-structure error:", err.message);
    return res.status(500).json({ error: "Falha ao gerar estrutura do e-book" });
  }
});

router.post("/generate-chapter", requireAuth, async (req: any, res) => {
  const { ebookTitle, chapter, language, tone, previousContext = "" } = req.body;

  if (!ebookTitle || !chapter || !language || !tone) {
    return res.status(400).json({ error: "ebookTitle, chapter, language e tone são obrigatórios" });
  }

  try {
    const content = await generateChapterContent(ebookTitle, chapter, language, tone as ToneConfig, previousContext);
    return res.json({ success: true, content });
  } catch (err: any) {
    console.error("[ebook] generate-chapter error:", err.message);
    return res.status(500).json({ error: "Falha ao gerar conteúdo do capítulo" });
  }
});

router.post("/improve-content", requireAuth, async (req: any, res) => {
  const { content, instruction, tone, language } = req.body;

  if (!content || !instruction || !tone || !language) {
    return res.status(400).json({ error: "content, instruction, tone e language são obrigatórios" });
  }

  if (content.length > 15000) {
    return res.status(400).json({ error: "Conteúdo muito longo. Limite: 15.000 caracteres por vez" });
  }

  try {
    const improved = await improveContent(content, instruction, tone as ToneConfig, language);
    return res.json({ success: true, content: improved });
  } catch (err: any) {
    console.error("[ebook] improve-content error:", err.message);
    return res.status(500).json({ error: "Falha ao melhorar conteúdo" });
  }
});

router.post("/title-suggestions", requireAuth, async (req: any, res) => {
  const { topic, language, audience } = req.body;

  if (!topic || !language || !audience) {
    return res.status(400).json({ error: "topic, language e audience são obrigatórios" });
  }

  try {
    const titles = await generateTitleSuggestions(topic, language, audience);
    return res.json({ success: true, titles });
  } catch (err: any) {
    console.error("[ebook] title-suggestions error:", err.message);
    return res.status(500).json({ error: "Falha ao gerar sugestões de títulos" });
  }
});

router.post("/generate-exercises", requireAuth, async (req: any, res) => {
  const { chapterContent, cefrLevel, language, count = 5 } = req.body;

  if (!chapterContent || !cefrLevel || !language) {
    return res.status(400).json({ error: "chapterContent, cefrLevel e language são obrigatórios" });
  }

  try {
    const exercises = await generateExercises(chapterContent, cefrLevel, language, count);
    return res.json({ success: true, exercises });
  } catch (err: any) {
    console.error("[ebook] generate-exercises error:", err.message);
    return res.status(500).json({ error: "Falha ao gerar exercícios" });
  }
});

router.post("/analyze-tone", requireAuth, async (req: any, res) => {
  const { content, targetTone } = req.body;

  if (!content || !targetTone) {
    return res.status(400).json({ error: "content e targetTone são obrigatórios" });
  }

  try {
    const analysis = await analyzeToneConsistency(content, targetTone as ToneConfig);
    return res.json({ success: true, analysis });
  } catch (err: any) {
    console.error("[ebook] analyze-tone error:", err.message);
    return res.status(500).json({ error: "Falha ao analisar tom" });
  }
});

router.post("/adapt-level", requireAuth, async (req: any, res) => {
  const { text, targetLevel, language } = req.body;

  if (!text || !targetLevel || !language) {
    return res.status(400).json({ error: "text, targetLevel e language são obrigatórios" });
  }

  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!validLevels.includes(targetLevel)) {
    return res.status(400).json({ error: `targetLevel deve ser um de: ${validLevels.join(", ")}` });
  }

  if (text.length > 8000) {
    return res.status(400).json({ error: "Texto muito longo. Limite: 8.000 caracteres por vez" });
  }

  try {
    const adapted = await adaptToLevel(text, targetLevel, language);
    return res.json({ success: true, adapted });
  } catch (err: any) {
    console.error("[ebook] adapt-level error:", err.message);
    return res.status(500).json({ error: "Falha ao adaptar nível do texto" });
  }
});

router.get("/list", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const results = await safeQueryDocs("ebooks", "authorId", userId);
    const ebooks = results.filter((r: any) => !r.deleted);
    ebooks.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return (res as any).json({ success: true, ebooks });
  } catch (err: any) {
    console.error("[ebook] list error:", err.message);
    return res.status(500).json({ error: "Falha ao listar e-books" });
  }
});

router.post("/save", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { id, title, subtitle, description, language, cefrLevel, tone, chapters, status } = req.body;

  if (!title || !language) {
    return res.status(400).json({ error: "title e language são obrigatórios" });
  }

  const now = Date.now();
  const ebookData = {
    authorId: userId,
    title,
    subtitle: subtitle ?? "",
    description: description ?? "",
    language,
    cefrLevel: cefrLevel ?? "B1",
    tone: tone ?? {},
    chapters: chapters ?? [],
    status: status ?? "draft",
    updatedAt: now,
  };

  try {
    if (id) {
      await safeSetDoc("ebooks", id, { ...ebookData });
      return res.json({ success: true, id });
    } else {
      const docRef = await safeAddDoc("ebooks", { ...ebookData, createdAt: now });
      return res.json({ success: true, id: docRef.id });
    }
  } catch (err: any) {
    console.error("[ebook] save error:", err.message);
    return res.status(500).json({ error: "Falha ao guardar e-book" });
  }
});

router.delete("/:id", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { id } = req.params;

  try {
    const doc = await safeGetDoc("ebooks", id);
    if (!doc.exists) return res.status(404).json({ error: "E-book não encontrado" });
    const data = doc.data();
    if (data?.authorId !== userId) return res.status(403).json({ error: "Acesso negado" });

    await safeSetDoc("ebooks", id, { deleted: true, deletedAt: Date.now() });
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[ebook] delete error:", err.message);
    return res.status(500).json({ error: "Falha ao eliminar e-book" });
  }
});

export default router;
