import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  createEbookCheckoutSession,
  fulfillEbookPurchase,
  validateLicenseKey,
  getStudentLibrary,
  getAuthorStats,
  getPublishedEbooks,
} from "../services/ebook/EbookSalesService";
import { safeGetDoc } from "../services/firestoreSafe.service";
import { getStripeClient } from "../config/stripe";

const router = Router();

// ── Browse marketplace ────────────────────────────────────────────────────────
router.get("/marketplace", requireAuth, async (_req, res) => {
  try {
    const ebooks = await getPublishedEbooks();
    return res.json({ success: true, ebooks });
  } catch (err: any) {
    console.error("[ebook-sales] marketplace error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar marketplace" });
  }
});

// ── Create Stripe checkout session for ebook purchase ─────────────────────────
router.post("/checkout", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  const { ebookId, buyerName } = req.body;
  if (!ebookId) return res.status(400).json({ error: "ebookId é obrigatório" });

  try {
    const doc = await safeGetDoc("ebooks", ebookId);
    if (!doc.exists) return res.status(404).json({ error: "E-book não encontrado" });

    const data = doc.data() as any;
    if (data.status !== "published") {
      return res.status(400).json({ error: "Este e-book não está disponível para compra" });
    }

    const result = await createEbookCheckoutSession(
      ebookId,
      data.title,
      data.priceUsd ?? 9.99,
      userId,
      req.user?.email ?? "",
      buyerName ?? req.user?.displayName ?? "Estudante"
    );

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[ebook-sales] checkout error:", err.message);
    return res.status(500).json({ error: "Falha ao criar sessão de pagamento" });
  }
});

// ── Stripe webhook (fulfillment after payment) ────────────────────────────────
router.post("/webhook", async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) return res.json({ received: true });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_EBOOK_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[ebook-sales] webhook signature error:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.metadata?.ebookId) {
      try {
        await fulfillEbookPurchase(session.id);
        console.log(`[ebook-sales] Purchase fulfilled for session ${session.id}`);
      } catch (err: any) {
        console.error("[ebook-sales] fulfillment error:", err.message);
      }
    }
  }

  return res.json({ received: true });
});

// ── Validate license key (manual activation) ──────────────────────────────────
router.post("/validate-license", requireAuth, async (req: any, res) => {
  const { licenseKey, email } = req.body;
  if (!licenseKey || !email) {
    return res.status(400).json({ error: "licenseKey e email são obrigatórios" });
  }

  try {
    const result = await validateLicenseKey(licenseKey, email);
    if (!result.valid) {
      return res.status(404).json({ error: "Chave de licença inválida ou e-mail não corresponde" });
    }
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[ebook-sales] validate-license error:", err.message);
    return res.status(500).json({ error: "Falha ao validar licença" });
  }
});

// ── Student's purchased ebook library ─────────────────────────────────────────
router.get("/library", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const enrollments = await getStudentLibrary(userId);
    return res.json({ success: true, enrollments });
  } catch (err: any) {
    console.error("[ebook-sales] library error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar biblioteca" });
  }
});

// ── Author analytics ──────────────────────────────────────────────────────────
router.get("/stats", requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });

  try {
    const stats = await getAuthorStats(userId);
    return res.json({ success: true, stats });
  } catch (err: any) {
    console.error("[ebook-sales] stats error:", err.message);
    return res.status(500).json({ error: "Falha ao carregar estatísticas" });
  }
});

export default router;
