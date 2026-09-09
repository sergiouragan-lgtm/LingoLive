import { describe, expect, it } from "vitest";
import { decideVersionWrite, validateEbookDraft } from "./EbookDocumentService";

describe("versioned ebook document contract", () => {
  const draft = { title: "English at work", language: "en", chapters: [{ id: "chapter-1", title: "Meetings", content: "Hello", blocks: [{ id: "block-1", type: "paragraph", data: { text: "Hello" } }] }] };
  it("accepts a bounded block document", () => expect(validateEbookDraft(draft)).toBe(true));
  it("rejects unknown blocks and oversized text", () => {
    expect(validateEbookDraft({ ...draft, chapters: [{ ...draft.chapters[0], blocks: [{ id: "x", type: "script", data: {} }] }] })).toBe(false);
    expect(validateEbookDraft({ ...draft, description: "x".repeat(3001) })).toBe(false);
  });
  it("detects stale writes and preserves them only through an explicit fork", () => {
    expect(decideVersionWrite(4, 4)).toBe("update");
    expect(decideVersionWrite(4, 3)).toBe("conflict");
    expect(decideVersionWrite(4, 3, "fork")).toBe("fork");
  });
});
