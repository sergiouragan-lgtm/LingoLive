import { Router } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { requireAuth } from "../middleware/requireAuth";
import { completeAdaptiveFascicle, generateAdaptiveFascicle, toStudentAdaptiveMaterial } from "../services/ebook/AdaptiveFascicleService";

const router = Router();
async function tenant(user: any) { const account = await dbAdmin.collection("users").doc(user.uid).get(); return String(user.tenantId || account.data()?.tenantId || `individual:${user.uid}`); }
router.post("/generate", requireAuth, async (req: any, res) => { try { const result = await generateAdaptiveFascicle(await tenant(req.user), req.user.uid); return res.status(result.duplicate ? 200 : 201).json(result); } catch (error: any) { if (error.code === "NO_ACTIVE_GAPS") return res.status(409).json({ error: error.code }); console.error("[AdaptiveFascicle] generation failed", error.message); return res.status(500).json({ error: error.code || "GENERATION_FAILED" }); } });
router.get("/", requireAuth, async (req: any, res) => { try { const tenantId = await tenant(req.user); const snapshot = await dbAdmin.collection("adaptive_generated_materials").where("tenantId", "==", tenantId).where("studentId", "==", req.user.uid).orderBy("updatedAt", "desc").limit(10).get(); return res.json({ materials: snapshot.docs.map((doc: any) => toStudentAdaptiveMaterial(doc.id, doc.data())) }); } catch (error: any) { return res.status(500).json({ error: "MATERIAL_LIST_FAILED" }); } });
router.post("/:id/complete", requireAuth, async (req: any, res) => { try { return res.json(await completeAdaptiveFascicle(await tenant(req.user), req.user.uid, req.params.id, req.body?.answers, req.body?.completionKey)); } catch (error: any) { const status = error.code === "MATERIAL_NOT_FOUND" ? 404 : error.code === "INVALID_COMPLETION" ? 400 : 500; return res.status(status).json({ error: error.code || "COMPLETION_FAILED" }); } });
export default router;
