import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("real learning paths", () => {
  it("does not fabricate pronunciation scores when real providers fail", () => {
    const source = read("./pronunciation.routes.ts");
    expect(source).toContain("PRONUNCIATION_EVALUATION_UNAVAILABLE");
    expect(source).not.toContain("SMART FALLBACK SIMULATION");
    expect(source).not.toContain("accuracySim");
  });

  it("does not return fabricated adaptive recommendations or paths", () => {
    const source = read("./adaptive.routes.ts");
    expect(source).toContain("ADAPTIVE_RECOMMENDATIONS_UNAVAILABLE");
    expect(source).toContain("ADAPTIVE_PATH_UNAVAILABLE");
    expect(source).not.toContain("id: \"fb_1\"");
    expect(source).not.toContain("path_${userId}_fallback");
  });

  it("uses MediaRecorder and the real pronunciation service in the student portal", () => {
    const source = read("../../src/components/learning/StudentPortal.tsx");
    expect(source).toContain("new MediaRecorder");
    expect(source).toContain("evaluatePronunciation(");
    expect(source).toContain("Parar e avaliar");
    expect(source).not.toContain("Desvio fonético de apenas 0.4 Hz");
  });
});
