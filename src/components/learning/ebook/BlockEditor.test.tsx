import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockEditor, blocksToMarkdown, createBlock } from "./BlockEditor";

describe("Ebook block editor", () => {
  afterEach(cleanup);
  it("creates all supported block contracts and serializes pedagogical content", () => {
    expect(["paragraph", "dialogue", "grammar-table", "vocab-card", "accordion", "quiz", "audio-player"].map(type => createBlock(type as any).type)).toHaveLength(7);
    expect(blocksToMarkdown([{ id: "p", type: "paragraph", data: { text: "Hello", heading: "h2" } }])).toBe("## Hello");
  });
  it("adds a block through a keyboard-accessible button", () => {
    const onChange = vi.fn(); render(<BlockEditor blocks={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar bloco" }));
    fireEvent.click(screen.getByRole("button", { name: /Parágrafo/ }));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ type: "paragraph" })]);
  });
});
