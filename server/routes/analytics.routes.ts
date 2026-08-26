import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { exportLearningProgressToBigQuery } from "../services/bigQueryLearningExport.service";

const router = Router();

router.post(
  "/bigquery-export",
  requireAuth,
  requireRole("SUPER_ADMIN", "PLATFORM_ADMIN", "super_admin", "platform_admin"),
  async (_req, res) => {
    try {
      return res.json(await exportLearningProgressToBigQuery());
    } catch (error: any) {
      console.error("[Analytics] BigQuery export failed:", error?.message || error);
      const configurationError = String(error?.message).includes("NOT_CONFIGURED")
        || String(error?.message).includes("UNAVAILABLE");
      return res.status(configurationError ? 503 : 502).json({
        error: configurationError ? "BigQuery não configurado." : "A exportação BigQuery falhou.",
      });
    }
  },
);

export default router;
