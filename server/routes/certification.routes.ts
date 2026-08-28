import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { safeAddDoc, safeGetDoc, safeListDocs, safeQueryDocs, safeSetDoc } from "../services/firestoreSafe.service";

const router = Router();
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "PLATFORM_ADMIN", "SCHOOL_ADMIN", "ORG_ADMIN"]);
const isAdmin = (req: any) => ADMIN_ROLES.has(String(req.user?.role || "").toUpperCase());
const publicCertificate = (certificate: any) => ({
  id: certificate.id, userId: certificate.userId, studentName: certificate.studentName,
  examTitle: certificate.examTitle, language: certificate.language, scorePercent: certificate.scorePercent,
  issueDate: certificate.issueDate, verificationCode: certificate.verificationCode,
  status: certificate.status || "issued", documentStatus: certificate.documentStatus || "pending",
  deliveryStatus: certificate.deliveryStatus || "not_sent",
  documentUrl: certificate.documentStatus === "ready" ? certificate.documentUrl || null : null,
  documentSizeBytes: certificate.documentSizeBytes || null, documentSha256: certificate.documentSha256 || null,
});

router.get("/certificates", requireAuth, async (req: any, res) => {
  try {
    const records = isAdmin(req) ? await safeListDocs("assessment_certificates") : await safeQueryDocs("assessment_certificates", "userId", req.user.uid);
    return res.json(records.map(publicCertificate).sort((a, b) => Date.parse(b.issueDate) - Date.parse(a.issueDate)));
  } catch (error: any) { return res.status(503).json({ error: "CERTIFICATE_STORE_UNAVAILABLE", message: error.message }); }
});

router.get("/verify/:code", requireAuth, async (req: any, res) => {
  const code = String(req.params.code || "").trim();
  if (!code || code.length > 128) return res.status(400).json({ error: "INVALID_VERIFICATION_CODE" });
  try {
    const certificate = (await safeQueryDocs("assessment_certificates", "verificationCode", code))[0];
    await safeAddDoc("certificate_audit_events", { certificateId: certificate?.id || null, userId: certificate?.userId || req.user.uid, actorId: req.user.uid, action: certificate ? "CERTIFICATE_VERIFIED" : "CERTIFICATE_VERIFICATION_FAILED", result: certificate ? "found" : "not_found", createdAt: new Date().toISOString() });
    if (!certificate) return res.status(404).json({ error: "CERTIFICATE_NOT_FOUND" });
    return res.json(publicCertificate(certificate));
  } catch (error: any) { return res.status(503).json({ error: "CERTIFICATE_STORE_UNAVAILABLE", message: error.message }); }
});

router.post("/certificates/:id/revoke", requireAuth, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "CERTIFICATE_ADMIN_REQUIRED" });
  try {
    const snapshot = await safeGetDoc("assessment_certificates", req.params.id);
    if (!snapshot.exists) return res.status(404).json({ error: "CERTIFICATE_NOT_FOUND" });
    const revokedAt = new Date().toISOString();
    await safeSetDoc("assessment_certificates", req.params.id, { status: "revoked", revokedAt, revokedBy: req.user.uid });
    await safeAddDoc("certificate_audit_events", { certificateId: req.params.id, userId: snapshot.data().userId, actorId: req.user.uid, action: "CERTIFICATE_REVOKED", result: "success", createdAt: revokedAt });
    return res.json({ id: req.params.id, status: "revoked", revokedAt });
  } catch (error: any) { return res.status(503).json({ error: "CERTIFICATE_STORE_UNAVAILABLE", message: error.message }); }
});

router.get("/audit", requireAuth, async (req: any, res) => {
  try {
    const events = isAdmin(req) ? await safeListDocs("certificate_audit_events") : await safeQueryDocs("certificate_audit_events", "userId", req.user.uid);
    return res.json(events.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 200));
  } catch (error: any) { return res.status(503).json({ error: "CERTIFICATE_AUDIT_UNAVAILABLE", message: error.message }); }
});

router.get("/metrics", requireAuth, async (req: any, res) => {
  try {
    const records = isAdmin(req) ? await safeListDocs("assessment_certificates") : await safeQueryDocs("assessment_certificates", "userId", req.user.uid);
    const issued = records.filter((item) => (item.status || "issued") === "issued");
    const readyDocuments = records.filter((item) => item.documentStatus === "ready" && item.documentUrl);
    const byMonth = new Map<string, number>();
    for (const item of issued) { const date = new Date(item.issueDate); if (!Number.isNaN(date.getTime())) { const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; byMonth.set(key, (byMonth.get(key) || 0) + 1); } }
    return res.json({ total: records.length, issued: issued.length, revoked: records.length - issued.length, readyDocuments: readyDocuments.length, pendingDocuments: records.length - readyDocuments.length, averageScorePercent: records.length ? Math.round(records.reduce((sum, item) => sum + Number(item.scorePercent || 0), 0) / records.length) : null, emissionsByMonth: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })) });
  } catch (error: any) { return res.status(503).json({ error: "CERTIFICATE_METRICS_UNAVAILABLE", message: error.message }); }
});

export default router;
