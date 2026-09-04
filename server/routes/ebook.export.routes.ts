import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { generateEpub, generateDrmPdf, type ExportBook, type DrmBuyerInfo } from "../services/ebook/EbookExportService";
import { safeGetDoc } from "../services/firestoreSafe.service";

const router = Router();

router.post("/epub", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, authorName } = req.body;
  if (!ebookId) return res.status(400).json({ error: "ebookId é obrigatório" });

  try {
    const doc = await safeGetDoc("ebooks", ebookId);
    if (!doc.exists) return res.status(404).json({ error: "E-book não encontrado" });

    const data = doc.data() as any;
    if (data.authorId !== userId) return res.status(403).json({ error: "Acesso negado" });

    const book: ExportBook = {
      id: ebookId,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      language: data.language ?? "pt",
      cefrLevel: data.cefrLevel ?? "B1",
      authorName: authorName ?? data.authorName ?? "Autor Desconhecido",
      authorEmail: req.user?.email ?? "",
      chapters: (data.chapters ?? []).map((ch: any, idx: number) => ({
        number: ch.number ?? idx + 1,
        title: ch.title ?? `Capítulo ${idx + 1}`,
        content: ch.content ?? "",
      })),
      coverColor: data.coverColor,
    };

    const epubBuffer = await generateEpub(book);
    const filename = `${book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.epub`;

    res.setHeader("Content-Type", "application/epub+zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", epubBuffer.length);
    return res.send(epubBuffer);
  } catch (err: any) {
    console.error("[ebook-export] epub error:", err.message);
    return res.status(500).json({ error: "Falha ao gerar ePub" });
  }
});

router.post("/pdf-drm", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, buyerName, buyerEmail, buyerNif, purchaseId } = req.body;
  if (!ebookId || !buyerName || !buyerEmail) {
    return res.status(400).json({ error: "ebookId, buyerName e buyerEmail são obrigatórios" });
  }

  try {
    const doc = await safeGetDoc("ebooks", ebookId);
    if (!doc.exists) return res.status(404).json({ error: "E-book não encontrado" });

    const data = doc.data() as any;
    if (data.authorId !== userId) return res.status(403).json({ error: "Acesso negado" });

    const book: ExportBook = {
      id: ebookId,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      language: data.language ?? "pt",
      cefrLevel: data.cefrLevel ?? "B1",
      authorName: data.authorName ?? "Autor",
      authorEmail: req.user?.email ?? "",
      chapters: (data.chapters ?? []).map((ch: any, idx: number) => ({
        number: ch.number ?? idx + 1,
        title: ch.title ?? `Capítulo ${idx + 1}`,
        content: ch.content ?? "",
      })),
      coverColor: data.coverColor,
    };

    const buyer: DrmBuyerInfo = {
      name: buyerName,
      email: buyerEmail,
      nif: buyerNif,
      ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ?? req.socket.remoteAddress ?? "",
      purchaseId: purchaseId ?? `PUR-${Date.now()}`,
      purchasedAt: Date.now(),
    };

    const pdfBuffer = await generateDrmPdf(book, buyer);
    const filename = `${book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_drm.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("X-DRM-Purchase-Id", buyer.purchaseId);
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error("[ebook-export] pdf-drm error:", err.message);
    return res.status(500).json({ error: "Falha ao gerar PDF com DRM" });
  }
});

export default router;
