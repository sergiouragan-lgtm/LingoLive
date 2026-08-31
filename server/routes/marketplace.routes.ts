import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { paymentsLimiter } from "../middleware/rateLimit";
import { MarketplaceService, MarketplaceValidationError } from "../services/marketplace.service";

const router = Router();
const CREATOR_ROLES = new Set(["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_ADMIN", "SCHOOL_ADMIN", "TEACHER", "NATIVE_TEACHER"]);
const canCreate = (req: any) => CREATOR_ROLES.has(String(req.user?.role || "").toUpperCase());
const fail = (res: any, error: any) => error instanceof MarketplaceValidationError
  ? res.status(400).json({ error: "MARKETPLACE_VALIDATION_ERROR", message: error.message })
  : res.status(503).json({ error: "MARKETPLACE_UNAVAILABLE", message: error.message });

router.get("/items", requireAuth, async (req: any, res) => {
  try { return res.json(await MarketplaceService.list({ type: req.query.type, language: req.query.language, query: req.query.q })); }
  catch (error: any) { return fail(res, error); }
});

router.get("/items/:id", requireAuth, async (req: any, res) => {
  try { const item = await MarketplaceService.get(req.params.id); return item ? res.json(item) : res.status(404).json({ error: "MARKETPLACE_ITEM_NOT_FOUND" }); }
  catch (error: any) { return fail(res, error); }
});

router.post("/items", requireAuth, async (req: any, res) => {
  if (!canCreate(req)) return res.status(403).json({ error: "MARKETPLACE_CREATOR_ROLE_REQUIRED" });
  try { return res.status(201).json(await MarketplaceService.create(req.body, { uid: req.user.uid, displayName: req.user.name || req.user.email })); }
  catch (error: any) { return fail(res, error); }
});

router.post("/items/:id/checkout", requireAuth, paymentsLimiter, async (req: any, res) => {
  try { return res.json(await MarketplaceService.createCheckout(req.params.id, req.user.uid)); }
  catch (error: any) { return fail(res, error); }
});

router.get("/purchases", requireAuth, async (req: any, res) => {
  try { return res.json(await MarketplaceService.myPurchases(req.user.uid)); }
  catch (error: any) { return fail(res, error); }
});

router.post("/items/:id/reviews", requireAuth, async (req: any, res) => {
  try { return res.status(201).json(await MarketplaceService.addReview(req.params.id, req.user.uid, Number(req.body.rating), req.body.comment)); }
  catch (error: any) { return fail(res, error); }
});

export default router;
