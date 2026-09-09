import crypto from "crypto";
import { getStorage } from "firebase-admin/storage";
import { dbAdmin } from "../../config/firebaseAdmin";

export const EBOOK_AUDIO_SCHEMA_VERSION = "1.0";
export const EBOOK_AUDIO_MODEL = "eleven_multilingual_v2";

export interface WordTiming {
  index: number;
  text: string;
  startMs: number;
  endMs: number;
}

interface CharacterAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export function characterAlignmentToWords(alignment: CharacterAlignment): WordTiming[] {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
  if (!Array.isArray(characters) || characters.length !== starts?.length || characters.length !== ends?.length) throw Object.assign(new Error("Invalid provider alignment"), { code: "INVALID_AUDIO_ALIGNMENT" });
  const words: WordTiming[] = [];
  let current = "";
  let start = 0;
  let end = 0;
  const flush = () => {
    if (!current) return;
    words.push({ index: words.length, text: current, startMs: Math.round(start * 1000), endMs: Math.round(end * 1000) });
    current = "";
  };
  characters.forEach((character, index) => {
    const charStart = starts[index]; const charEnd = ends[index];
    if (typeof character !== "string" || !Number.isFinite(charStart) || !Number.isFinite(charEnd) || charStart < 0 || charEnd < charStart) throw Object.assign(new Error("Invalid provider alignment"), { code: "INVALID_AUDIO_ALIGNMENT" });
    if (/\s/u.test(character)) return flush();
    if (!current) start = charStart;
    current += character;
    end = charEnd;
  });
  flush();
  if (!words.length || words.some((word, index) => index > 0 && word.startMs < words[index - 1].endMs)) throw Object.assign(new Error("Non-monotonic word alignment"), { code: "INVALID_AUDIO_ALIGNMENT" });
  return words;
}

const validId = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9._:-]{1,100}$/.test(value);
export async function generateEbookAudio(input: { authorId: string; ebookId: string; chapterId: string; blockId: string; text: string; voiceId: string }, request: typeof fetch = fetch) {
  if (!dbAdmin) throw Object.assign(new Error("Firestore unavailable"), { code: "FIRESTORE_UNAVAILABLE" });
  if (![input.ebookId, input.chapterId, input.blockId, input.voiceId].every(validId) || typeof input.text !== "string" || input.text.trim().length < 1 || input.text.length > 5000) throw Object.assign(new Error("Invalid audio request"), { code: "INVALID_AUDIO_REQUEST" });
  const key = process.env.ELEVENLABS_API_KEY; const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!key || !bucketName) throw Object.assign(new Error("Audio provider or storage unavailable"), { code: "AUDIO_UNAVAILABLE" });
  const ebook = await dbAdmin.collection("ebooks").doc(input.ebookId).get();
  if (!ebook.exists || ebook.data()?.authorId !== input.authorId) throw Object.assign(new Error("Ebook not found"), { code: "EBOOK_NOT_FOUND" });
  const digest = crypto.createHash("sha256").update([input.authorId, input.ebookId, input.chapterId, input.blockId, input.voiceId, EBOOK_AUDIO_MODEL, input.text].join("\0")).digest("hex");
  const assetId = digest.slice(0, 40); const assetRef = dbAdmin.collection("ebook_audio_assets").doc(assetId);
  const existing = await assetRef.get();
  if (existing.exists && existing.data()?.status === "ready") return { duplicate: true, asset: { id: assetId, ...existing.data(), audioUrl: `/api/ebook/audio/${assetId}/file` } };
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await request(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(input.voiceId)}/with-timestamps?output_format=mp3_44100_128`, { method: "POST", headers: { "Content-Type": "application/json", "xi-api-key": key }, body: JSON.stringify({ text: input.text, model_id: EBOOK_AUDIO_MODEL }), signal: controller.signal });
    if (!response.ok) throw Object.assign(new Error(`Audio provider returned ${response.status}`), { code: "AUDIO_PROVIDER_FAILED" });
    const payload = await response.json() as any; const alignment = payload.normalized_alignment || payload.alignment;
    const words = characterAlignmentToWords(alignment); const audio = Buffer.from(payload.audio_base64 || "", "base64");
    if (!audio.length || audio.length > 20 * 1024 * 1024) throw Object.assign(new Error("Invalid audio payload"), { code: "INVALID_AUDIO_PAYLOAD" });
    const audioPath = `ebooks/${input.authorId}/${input.ebookId}/${input.chapterId}/${input.blockId}/${assetId}.mp3`;
    await getStorage().bucket(bucketName).file(audioPath).save(audio, { resumable: false, contentType: "audio/mpeg", metadata: { cacheControl: "private,max-age=3600", metadata: { ebookId: input.ebookId, assetId } } });
    const now = new Date(); const asset = { schemaVersion: EBOOK_AUDIO_SCHEMA_VERSION, status: "ready", authorId: input.authorId, ebookId: input.ebookId, chapterId: input.chapterId, blockId: input.blockId, text: input.text, voiceId: input.voiceId, provider: "elevenlabs", model: EBOOK_AUDIO_MODEL, mimeType: "audio/mpeg", audioPath, durationMs: words.at(-1)?.endMs || 0, words, createdAt: now, updatedAt: now };
    await assetRef.set(asset);
    return { duplicate: false, asset: { id: assetId, ...asset, audioUrl: `/api/ebook/audio/${assetId}/file` } };
  } finally { clearTimeout(timeout); }
}

export async function getAuthorizedAudioAsset(userId: string, assetId: string) {
  if (!dbAdmin || !validId(assetId)) throw Object.assign(new Error("Asset not found"), { code: "ASSET_NOT_FOUND" });
  const snapshot = await dbAdmin.collection("ebook_audio_assets").doc(assetId).get();
  if (!snapshot.exists) throw Object.assign(new Error("Asset not found"), { code: "ASSET_NOT_FOUND" });
  const asset = snapshot.data();
  if (asset?.authorId !== userId) {
    const ebook = await dbAdmin.collection("ebooks").doc(asset?.ebookId).get();
    if (!ebook.exists || ebook.data()?.status !== "published") throw Object.assign(new Error("Asset not found"), { code: "ASSET_NOT_FOUND" });
  }
  return { id: assetId, ...asset } as any;
}
