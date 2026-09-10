import { describe, expect, it } from "vitest";
import { findActiveWordIndex } from "./KaraokePlayer";

describe("karaoke synchronization", () => {
  const words = [{ index: 0, text: "Hello", startMs: 0, endMs: 400 }, { index: 1, text: "world", startMs: 500, endMs: 900 }];
  it("uses indexed lookup across playback, gaps and seeking", () => {
    expect(findActiveWordIndex(words, 200)).toBe(0);
    expect(findActiveWordIndex(words, 450)).toBe(-1);
    expect(findActiveWordIndex(words, 700)).toBe(1);
    expect(findActiveWordIndex(words, 1200)).toBe(-1);
  });
});
