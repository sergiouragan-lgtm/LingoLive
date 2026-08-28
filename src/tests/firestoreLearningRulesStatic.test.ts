import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const rules = fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8");

const matchBlock = (collection: string) => {
  const match = rules.match(new RegExp(`match \\/${collection}\\/\\{[^}]+\\} \\{([\\s\\S]*?)\\n    \\}`));
  return match?.[1] ?? "";
};

describe("canonical learning records are backend-owned", () => {
  it("permite apenas get do progresso ao proprietário e bloqueia escritas", () => {
    const block = matchBlock("learning_progress");
    expect(block).toContain("allow get:");
    expect(block).toContain("isOwner(userId)");
    expect(block).toContain("allow list: if isAdmin()");
    expect(block).toContain("allow create, update, delete: if false");
  });

  it.each([
    "assessment_attempts",
    "assessment_certificates",
    "pronunciation_results",
    "pronunciation_reports",
  ])("bloqueia criação, alteração e eliminação direta em %s", (collection) => {
    expect(matchBlock(collection)).toContain("allow create, update, delete: if false");
  });

  it("mantém sessões de quiz e gabaritos exclusivamente no backend", () => {
    const block = matchBlock("quiz_sessions");
    expect(block).toContain("allow read, create, update, delete: if false");
  });
});
