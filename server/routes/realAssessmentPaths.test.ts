import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

describe("real assessment paths", () => {
  it("keeps the answer key on the server for placement assessments", () => {
    const source = fs.readFileSync(path.join(root, "server/routes/ai.routes.ts"), "utf8");
    expect(source).toContain('safeSetDoc("assessment_sessions", assessmentId');
    expect(source).toContain("questions.map(({ question, options }) => ({ question, options }))");
    expect(source).toContain('safeGetDoc("assessment_sessions", assessmentId)');
    expect(source).not.toContain("const { answers, questions } = req.body");
  });

  it("does not fabricate exams, schedules or subjective grades", () => {
    const source = fs.readFileSync(path.join(root, "server/routes/assessment.routes.ts"), "utf8");
    expect(source).toContain('safeQueryDocs("assessment_exams", "status", "published")');
    expect(source).toContain('error: "ASSESSMENT_GRADING_UNAVAILABLE"');
    expect(source).not.toContain("const exams = localMemoryDb.get(\"assessment_exams_list\") || DEFAULT_EXAMS");
    expect(source).not.toContain("Math.round(sub.question.points * 0.8)");
  });
});
