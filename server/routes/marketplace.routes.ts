import crypto from "crypto";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { acquireMarketplaceItem, getMarketplaceItem, listOwned, listPublishedItems, saveMarketplaceItem } from "../services/marketplace.repository";
import { validateIdempotencyKey, validateMarketplaceItem } from "../services/marketplace.service";
import { safeGetDoc } from "../services/firestoreSafe.service";

const router = Router();
const privilegedRole = (role: unknown) => ["super_admin", "admin", "SUPER_ADMIN", "PLATFORM_ADMIN", "MODERATOR"].includes(String(role || ""));
const creatorRole = (role: unknown) => privilegedRole(role) || ["creator", "teacher", "professor", "MARKETPLACE_SELLER"].includes(String(role || ""));
async function resolvedRole(user: any) {
  if (user?.role) return user.role;
  const profile = await safeGetDoc("users", user.uid);
  return profile.exists ? profile.data()?.role : "";
}

router.get("/catalog", requireAuth, async (_req, res) => {
  try { res.json({ items: await listPublishedItems() }); }
  catch { res.status(503).json({ error: "Catálogo temporariamente indisponível." }); }
});

router.get("/library", requireAuth, async (req: any, res) => {
  try { res.json({ entitlements: await listOwned("marketplace_entitlements", req.user.uid) }); }
  catch { res.status(503).json({ error: "Biblioteca temporariamente indisponível." }); }
});

router.get("/creator/items", requireAuth, async (req: any, res) => {
  if (!creatorRole(await resolvedRole(req.user))) return res.status(403).json({ error: "Perfil de criador necessário." });
  try { res.json({ items: await listOwned("marketplace_items", req.user.uid) }); }
  catch { res.status(503).json({ error: "Produtos temporariamente indisponíveis." }); }
});

router.post("/creator/items", requireAuth, async (req: any, res) => {
  if (!creatorRole(await resolvedRole(req.user))) return res.status(403).json({ error: "Perfil de criador necessário." });
  try {
    const item = validateMarketplaceItem(req.body); const id = crypto.randomUUID(); const now = new Date().toISOString();
    await saveMarketplaceItem(id, { ...item, creatorId: req.user.uid, creatorName: String(req.user.name || "Criador LingoLIVE").slice(0, 80), status: "DRAFT", rejectionReason: "", createdAt: now, updatedAt: now }, true);
    res.status(201).json({ id, status: "DRAFT" });
  } catch (error: any) { res.status(400).json({ error: error.message || "Produto inválido." }); }
});

router.post("/creator/items/:itemId/submit", requireAuth, async (req: any, res) => {
  try {
    const item = await getMarketplaceItem(req.params.itemId);
    if (!item || item.creatorId !== req.user.uid) return res.status(404).json({ error: "Produto não encontrado." });
    if (!["DRAFT", "REJECTED"].includes(item.status)) return res.status(409).json({ error: "Estado inválido para revisão." });
    await saveMarketplaceItem(req.params.itemId, { status: "IN_REVIEW", rejectionReason: "", updatedAt: new Date().toISOString() });
    res.json({ id: req.params.itemId, status: "IN_REVIEW" });
  } catch { res.status(503).json({ error: "Não foi possível enviar para revisão." }); }
});

router.post("/admin/items/:itemId/moderate", requireAuth, async (req: any, res) => {
  if (!privilegedRole(await resolvedRole(req.user))) return res.status(403).json({ error: "Permissão de moderação necessária." });
  const decision = req.body.decision === "APPROVE" ? "PUBLISHED" : req.body.decision === "REJECT" ? "REJECTED" : null;
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";
  if (!decision || (decision === "REJECTED" && reason.length < 5)) return res.status(400).json({ error: "Decisão ou motivo inválido." });
  const item = await getMarketplaceItem(req.params.itemId);
  if (!item || item.status !== "IN_REVIEW") return res.status(404).json({ error: "Produto em revisão não encontrado." });
  await saveMarketplaceItem(req.params.itemId, { status: decision, rejectionReason: reason, moderatedBy: req.user.uid, moderatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  res.json({ id: req.params.itemId, status: decision });
});

router.post("/items/:itemId/acquire", requireAuth, async (req: any, res) => {
  try {
    const key = validateIdempotencyKey(req.header("Idempotency-Key"));
    res.status(201).json(await acquireMarketplaceItem(req.user.uid, req.params.itemId, key));
  } catch (error: any) {
    const statuses: Record<string, number> = { INVALID_IDEMPOTENCY_KEY: 400, ITEM_NOT_AVAILABLE: 404, ALREADY_OWNED: 409, INSUFFICIENT_COINS: 402, OUT_OF_STOCK: 409, MARKETPLACE_STORAGE_UNAVAILABLE: 503 };
    res.status(statuses[error.message] || 500).json({ error: error.message || "Aquisição falhou." });
  }
});

export default router;
