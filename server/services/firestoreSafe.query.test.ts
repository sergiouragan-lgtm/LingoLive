import { beforeEach, describe, expect, it } from "vitest";
import { localMemoryDb, safeQueryDocs } from "./firestoreSafe.service";

describe("safeQueryDocs local query", () => {
  beforeEach(() => {
    for (const key of [...localMemoryDb.keys()]) {
      if (key.startsWith("query_test_")) localMemoryDb.delete(key);
    }
  });

  it("returns only documents matching the assigned field", async () => {
    localMemoryDb.set("query_test_student-a", { id: "student-a", teacherUid: "teacher-1" });
    localMemoryDb.set("query_test_student-b", { id: "student-b", teacherUid: "teacher-2" });
    const results = await safeQueryDocs("query_test", "teacherUid", "teacher-1");
    expect(results).toEqual([expect.objectContaining({ id: "student-a", teacherUid: "teacher-1" })]);
  });
});
