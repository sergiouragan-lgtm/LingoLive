import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { generateEpub, generatePdf, type ExportBook } from "./EbookExportService";

const book: ExportBook = { id: "book-1", title: "English & Work", description: "Accessible study guide", language: "en", cefrLevel: "B1", authorName: "LingoLive", authorEmail: "author@example.test", updatedAt: Date.UTC(2026, 8, 9), chapters: [{ number: 1, title: "Meetings <Basics>", content: "## Hello\n\nUse **clear** language & examples." }] };

describe("ebook exporters", () => {
  it("generates byte-identical deterministic PDF for identical input", async () => {
    const first = await generatePdf(book); const second = await generatePdf(book);
    expect(first.equals(second)).toBe(true);
    expect(first.subarray(0, 4).toString()).toBe("%PDF");
  });
  it("generates deterministic EPUB3 with navigation, accessibility metadata and escaped XHTML", async () => {
    const first = await generateEpub(book); const second = await generateEpub(book);
    expect(first.equals(second)).toBe(true);
    const zip = await JSZip.loadAsync(first);
    expect(await zip.file("mimetype")!.async("string")).toBe("application/epub+zip");
    expect(await zip.file("EPUB/content.opf")!.async("string")).toContain("schema:accessibilityFeature");
    expect(await zip.file("EPUB/nav.xhtml")!.async("string")).toContain("epub:type=\"toc\"");
    expect(await zip.file("EPUB/Text/chapter1.xhtml")!.async("string")).toContain("Meetings &lt;Basics&gt;");
  });
});
