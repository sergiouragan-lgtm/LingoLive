const allowedMimeTypes = new Set([
  "audio/mpeg", "audio/wav", "audio/x-wav", "audio/webm",
  "video/mp4", "video/webm",
  "image/png", "image/jpeg", "image/webp",
  "application/pdf",
]);

export function validateCmsMediaInput(body: any) {
  const fileName = typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType.trim().toLowerCase() : "";
  const mediaType = typeof body?.mediaType === "string" ? body.mediaType.trim().toLowerCase() : "";
  const fileUrl = typeof body?.fileUrl === "string" ? body.fileUrl.trim() : "";
  const audioOrFileBase64 = typeof body?.fileBase64 === "string" ? body.fileBase64 : "";
  if (!fileName || fileName.length > 180 || !title || title.length > 160 || !allowedMimeTypes.has(mimeType)) {
    throw new Error("INVALID_CMS_MEDIA_METADATA");
  }
  const expectedPrefix = mimeType.split("/")[0];
  if ((mediaType === "pdf" && mimeType !== "application/pdf") || (mediaType !== "pdf" && mediaType !== expectedPrefix)) {
    throw new Error("INVALID_CMS_MEDIA_TYPE");
  }
  let parsedUrl: URL;
  try { parsedUrl = new URL(fileUrl); } catch { throw new Error("INVALID_CMS_MEDIA_URL"); }
  if (parsedUrl.protocol !== "https:" || !["firebasestorage.googleapis.com", "storage.googleapis.com"].includes(parsedUrl.hostname)) {
    throw new Error("INVALID_CMS_MEDIA_URL");
  }
  const cleanBase64 = audioOrFileBase64.includes(",") ? audioOrFileBase64.split(",").pop() || "" : audioOrFileBase64;
  if (!cleanBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64)) throw new Error("INVALID_CMS_MEDIA_CONTENT");
  const buffer = Buffer.from(cleanBase64, "base64");
  if (!buffer.length || buffer.length > 15 * 1024 * 1024) throw new Error("INVALID_CMS_MEDIA_SIZE");
  return { fileName, title, mimeType, mediaType, fileUrl, cleanBase64, sizeBytes: buffer.length };
}

export function validateCmsMediaAnalysis(value: any) {
  if (
    !value || typeof value.suggestedTitle !== "string" || !value.suggestedTitle.trim() ||
    !Array.isArray(value.tags) || value.tags.length < 1 || value.tags.length > 5 ||
    value.tags.some((tag: unknown) => typeof tag !== "string" || !tag.trim()) ||
    typeof value.whisperTranscript !== "string" ||
    !value.suggestedMetadata || typeof value.suggestedMetadata.language !== "string" ||
    typeof value.suggestedMetadata.proficiency !== "string" ||
    typeof value.suggestedMetadata.estimatedDuration !== "string" ||
    typeof value.suggestedMetadata.description !== "string"
  ) throw new Error("INVALID_CMS_MEDIA_ANALYSIS");
  return {
    suggestedTitle: value.suggestedTitle.trim(),
    tags: value.tags.map((tag: string) => tag.trim()),
    whisperTranscript: value.whisperTranscript.trim(),
    suggestedMetadata: value.suggestedMetadata,
  };
}
