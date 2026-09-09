import { describe, expect, it } from "vitest";
import { characterAlignmentToWords } from "./EbookAudioService";

describe("ebook audio timing contract", () => {
  it("converts authoritative character alignment into monotonic word timestamps", () => {
    expect(characterAlignmentToWords({ characters: ["H", "i", " ", "S", "o", "f", "i", "a"], character_start_times_seconds: [0, .1, .2, .3, .4, .5, .6, .7], character_end_times_seconds: [.1, .2, .3, .4, .5, .6, .7, .8] })).toEqual([
      { index: 0, text: "Hi", startMs: 0, endMs: 200 },
      { index: 1, text: "Sofia", startMs: 300, endMs: 800 },
    ]);
  });
  it("rejects mismatched and non-monotonic provider data", () => {
    expect(() => characterAlignmentToWords({ characters: ["a"], character_start_times_seconds: [], character_end_times_seconds: [] })).toThrow("Invalid provider alignment");
    expect(() => characterAlignmentToWords({ characters: ["a", " ", "b"], character_start_times_seconds: [.5, .6, .1], character_end_times_seconds: [.6, .7, .2] })).toThrow("Non-monotonic word alignment");
  });
});
