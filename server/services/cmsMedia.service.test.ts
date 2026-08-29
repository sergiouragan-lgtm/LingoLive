import { describe, expect, it } from "vitest";
import { validateCmsMediaAnalysis, validateCmsMediaInput } from "./cmsMedia.service";

const validInput = {
  title: "Pronúncia real",
  fileName: "pronuncia.webm",
  mediaType: "audio",
  mimeType: "audio/webm",
  fileUrl: "https://firebasestorage.googleapis.com/v0/b/example/o/file.webm",
  fileBase64: Buffer.from("real audio bytes").toString("base64"),
};

describe("CMS media validation", () => {
  it("accepts supported real file metadata and bytes", () => {
    expect(validateCmsMediaInput(validInput)).toMatchObject({ mediaType: "audio", sizeBytes: 16 });
  });

  it("rejects mismatched types, untrusted URLs and oversized content", () => {
    expect(() => validateCmsMediaInput({ ...validInput, mediaType: "image" })).toThrow("INVALID_CMS_MEDIA_TYPE");
    expect(() => validateCmsMediaInput({ ...validInput, fileUrl: "https://example.com/file.webm" })).toThrow("INVALID_CMS_MEDIA_URL");
  });

  it("validates analysis without inventing defaults", () => {
    expect(validateCmsMediaAnalysis({
      suggestedTitle: "Aula",
      tags: ["pronúncia"],
      whisperTranscript: "Conteúdo ouvido.",
      suggestedMetadata: { language: "Português", proficiency: "B1", estimatedDuration: "2 min", description: "Áudio real" },
    }).suggestedTitle).toBe("Aula");
    expect(() => validateCmsMediaAnalysis({ suggestedTitle: "Aula", tags: [] })).toThrow("INVALID_CMS_MEDIA_ANALYSIS");
  });
});
