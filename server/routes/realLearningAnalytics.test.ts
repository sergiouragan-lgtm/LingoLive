import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("real learning analytics", () => {
  it("aggregates only persisted learning evidence", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "server/routes/learningAnalytics.routes.ts"), "utf8");
    expect(source).toContain('safeQueryDocs("assessment_attempts", "userId", studentId)');
    expect(source).toContain('safeQueryDocs("pronunciation_results", "userId", studentId)');
    expect(source).toContain('safeListDocs("analytics_export_events")');
    expect(source).not.toContain("Math.random");
  });

  it("does not seed or simulate analytics in the browser", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/components/learning/LearningAnalyticsPlatform.tsx"), "utf8");
    expect(source).toContain('fetch("/api/analytics/learning"');
    expect(source).toContain("Exportação real não configurada");
    expect(source).not.toContain("defaultStudents");
    expect(source).not.toContain("fallbackToDefaults");
    expect(source).not.toContain("High-fidelity fallback simulated feedback");
  });
});
