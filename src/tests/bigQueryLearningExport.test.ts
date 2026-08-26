// @vitest-environment node
import { describe, expect, it } from "vitest";
import { toLearningExportRow } from "../../server/services/bigQueryLearningExport.service";

describe("BigQuery learning export", () => {
  it("removes learner PII and normalizes exported metrics", () => {
    const row = toLearningExportRow("progress-1", {
      userId: "learner@example.com",
      courseId: "english-a1",
      cefrLevel: "A1",
      xp: 120,
      streakDays: 4,
      version: 3,
      updatedAt: "2026-08-26T10:00:00.000Z",
      displayName: "Must not leave Firestore",
    });

    expect(row.learner_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(row)).not.toContain("learner@example.com");
    expect(JSON.stringify(row)).not.toContain("Must not leave Firestore");
    expect(row).toMatchObject({ progress_id: "progress-1", course_id: "english-a1", xp: 120 });
  });
});
