import { Router } from "express";
import { getStorage } from "firebase-admin/storage";
import { requireAuth } from "../middleware/requireAuth";
import { generateEbookAudio, getAuthorizedAudioAsset } from "../services/ebook/EbookAudioService";

const router = Router();

router.post("/generate", requireAuth, async (req: any, res) => {
  try {
    const result = await generateEbookAudio({ authorId: req.user.uid, ebookId: req.body?.ebookId, chapterId: req.body?.chapterId, blockId: req.body?.blockId, text: req.body?.text, voiceId: req.body?.voiceId });
    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error: any) {
    const status = error.code === "INVALID_AUDIO_REQUEST" ? 400 : error.code === "EBOOK_NOT_FOUND" ? 404 : error.code === "AUDIO_UNAVAILABLE" ? 503 : 502;
    console.error("[EbookAudio] generation failed", error.code || error.message);
    return res.status(status).json({ error: error.code || "AUDIO_GENERATION_FAILED" });
  }
});

router.get("/:assetId", requireAuth, async (req: any, res) => {
  try {
    const asset = await getAuthorizedAudioAsset(req.user.uid, req.params.assetId);
    const { audioPath: _audioPath, ...safe } = asset;
    return res.json({ asset: { ...safe, audioUrl: `/api/ebook/audio/${asset.id}/file` } });
  } catch { return res.status(404).json({ error: "ASSET_NOT_FOUND" }); }
});

router.get("/:assetId/file", requireAuth, async (req: any, res) => {
  try {
    const asset = await getAuthorizedAudioAsset(req.user.uid, req.params.assetId);
    res.setHeader("Content-Type", asset.mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET).file(asset.audioPath).createReadStream().on("error", () => { if (!res.headersSent) res.status(404).end(); else res.destroy(); }).pipe(res);
  } catch { return res.status(404).json({ error: "ASSET_NOT_FOUND" }); }
});

export default router;
