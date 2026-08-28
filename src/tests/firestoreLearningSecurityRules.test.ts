import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

describe("Firestore learning records security", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: `lingolive-learning-rules-${Date.now()}`,
      firestore: {
        host: "127.0.0.1",
        port: 8080,
        rules: fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "learning_progress", "alice"), { userId: "alice", totalActivities: 2 });
      await setDoc(doc(db, "assessment_attempts", "attempt-1"), { userId: "alice", scorePercent: 90 });
      await setDoc(doc(db, "assessment_certificates", "cert-1"), { userId: "alice", scorePercent: 90 });
      await setDoc(doc(db, "pronunciation_results", "result-1"), { userId: "alice", overallScore: 88 });
      await setDoc(doc(db, "pronunciation_reports", "report-1"), { userId: "alice", totalAttempts: 1 });
    });
  });

  afterAll(async () => env.cleanup());

  it.each([
    ["learning_progress", "alice"],
    ["assessment_attempts", "attempt-1"],
    ["assessment_certificates", "cert-1"],
    ["pronunciation_results", "result-1"],
    ["pronunciation_reports", "report-1"],
  ])("permite ao proprietário ler %s", async (collectionName, id) => {
    const alice = env.authenticatedContext("alice", { email_verified: true });
    await assertSucceeds(getDoc(doc(alice.firestore(), collectionName, id)));
  });

  it.each([
    ["learning_progress", "alice"],
    ["assessment_attempts", "attempt-1"],
    ["assessment_certificates", "cert-1"],
    ["pronunciation_results", "result-1"],
    ["pronunciation_reports", "report-1"],
  ])("impede leitura cruzada em %s", async (collectionName, id) => {
    const bob = env.authenticatedContext("bob", { email_verified: true });
    await assertFails(getDoc(doc(bob.firestore(), collectionName, id)));
  });

  it.each([
    ["learning_progress", "alice"],
    ["assessment_attempts", "attempt-1"],
    ["assessment_certificates", "cert-1"],
    ["pronunciation_results", "result-1"],
    ["pronunciation_reports", "report-1"],
  ])("bloqueia criação direta em %s", async (collectionName) => {
    const alice = env.authenticatedContext("alice", { email_verified: true });
    await assertFails(setDoc(doc(alice.firestore(), collectionName, "forged"), { userId: "alice" }));
  });

  it("bloqueia alteração e eliminação direta de resultados", async () => {
    const alice = env.authenticatedContext("alice", { email_verified: true });
    const attempt = doc(alice.firestore(), "assessment_attempts", "attempt-1");
    await assertFails(updateDoc(attempt, { scorePercent: 100 }));
    await assertFails(deleteDoc(attempt));
  });
});
