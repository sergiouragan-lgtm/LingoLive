import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentReader } from "./StudentReader";

vi.mock("firebase/auth", () => ({ getAuth: () => ({ currentUser: { getIdToken: async () => "token" } }) }));

describe("WebReader accessibility contract", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/progress/")) return new Response(JSON.stringify({ enrollment: { ebookId: "book-1", studentUid: "student", chapterProgress: [] }, completionPercent: 0 }), { status: 200 });
    return new Response(JSON.stringify({ ebook: { id: "book-1", title: "English at work", language: "en", cefrLevel: "B1", authorId: "author", chapters: [{ id: "chapter-1", title: "Meetings", order: 1, blocks: [{ id: "block-1", type: "paragraph", data: { text: "Welcome to the meeting." } }] }] } }), { status: 200 });
  })));
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
  it("provides a skip link, main landmark, labelled index and selectable CEFR controls", async () => {
    render(<StudentReader ebookId="book-1" onBack={vi.fn()} />);
    expect(await screen.findByRole("heading", { name: "Meetings" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Saltar para a leitura" }).getAttribute("href")).toBe("#ebook-reader-content");
    expect(screen.getByRole("main").getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("complementary", { name: "Índice do e-book" })).toBeDefined();
    expect(screen.getByRole("button", { name: "B1" }).getAttribute("aria-pressed")).toBe("true");
  });
});
