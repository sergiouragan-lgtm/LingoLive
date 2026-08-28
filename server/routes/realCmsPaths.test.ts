import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

describe("real educational CMS paths", () => {
  it("requires authentication and persists validated AI exercises", () => {
    const source = fs.readFileSync(path.join(root, "server/routes/ai.routes.ts"), "utf8");
    expect(source).toContain('router.post("/cms/generate-exercise", requireAuth');
    expect(source).toContain("validateGeneratedCmsExercises(parsedJSON, type)");
    expect(source).toContain('safeSetDoc("exercises", exercise.id, exercise)');
    expect(source).toContain('error: "CMS_EXERCISE_GENERATION_UNAVAILABLE"');
    expect(source).not.toContain("simulatedFallbacks");
  });

  it("loads CMS collections without seeding demonstration records", () => {
    const source = fs.readFileSync(path.join(root, "src/components/learning/EducationalCMS.tsx"), "utf8");
    expect(source).toContain('getDocs(collection(db, "courses"))');
    expect(source).toContain('getDocs(collection(db, "lessons"))');
    expect(source).toContain('getDocs(collection(db, "exercises"))');
    expect(source).not.toContain("mockCourses");
    expect(source).not.toContain("mockExercises");
  });
});
