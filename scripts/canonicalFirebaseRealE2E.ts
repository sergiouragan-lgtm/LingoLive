import crypto from "crypto";
import fs from "fs";
import path from "path";

process.env.NODE_ENV = "production";
process.env.ENABLE_SANDBOX_FALLBACK = "false";

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const suffix = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
const email = `lingolive-e2e-${suffix}@example.com`;
const password = `E2e!${crypto.randomBytes(16).toString("hex")}aA1`;
let idToken = "";
let uid = "";
let cleanupComplete = false;
const manifestPath = process.env.LINGOLIVE_E2E_MANIFEST || "";

const identityRequest = async (method: string, body: Record<string, unknown>) => {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${config.apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Firebase Auth ${method} failed: ${payload?.error?.message || response.status}`);
  return payload;
};

const createdRefs: any[] = [];
try {
  const signedUp = await identityRequest("signUp", { email, password, returnSecureToken: true });
  idToken = signedUp.idToken; uid = signedUp.localId;
  const [{ dbAdmin, authAdmin }, { completeQuiz }, { completePronunciation, completeFlashcardSession }] = await Promise.all([
    import("../server/config/firebaseAdmin"),
    import("../server/services/quizCompletion.repository"),
    import("../server/services/canonicalPracticeCompletion.service"),
  ]);
  if (!dbAdmin || !authAdmin) throw new Error("Firebase Admin real não inicializado.");
  await authAdmin.updateUser(uid, { emailVerified: true });
  const verified = await authAdmin.verifyIdToken(idToken);
  if (verified.uid !== uid) throw new Error("Token autenticado não corresponde ao utilizador descartável.");

  const accountRef = dbAdmin.collection("users").doc(uid);
  const profileRef = dbAdmin.collection("intelligentProfiles").doc(uid);
  const subscriptionRef = dbAdmin.collection("subscriptions").doc(`${uid}_sub`);
  const accessRef = dbAdmin.collection("email_permissions").doc(email.toLowerCase());
  await Promise.all([
    accountRef.create({ id: uid, email, roles: ["student"], role: "student", status: "ACTIVE", onboardingCompleted: true, welcomeCompleted: true, paymentCompleted: true, displayName: "E2E Learner", createdAt: new Date().toISOString() }),
    profileRef.create({ userId: uid, identity: { displayName: "E2E Learner" }, account: { status: "ACTIVE" }, learning: { targetLanguage: "en", cefrLevel: "A1" }, subscription: { status: "active" }, status: "ACTIVE", onboardingCompleted: true }),
    subscriptionRef.create({ userId: uid, status: "active", planId: "e2e-validation", currentPeriodEnd: new Date(Date.now() + 86_400_000).toISOString() }),
    accessRef.create({ email: email.toLowerCase(), role: "student", status: "active", grantedAt: new Date().toISOString() }),
  ]);
  createdRefs.push(accountRef, profileRef, subscriptionRef, accessRef);

  const quizSessionId = `e2e_quiz_${suffix}`;
  const pronunciationId = `e2e_pron_${suffix}`;
  const flashcardId = `e2e_flash_${suffix}`;
  const questions = Array.from({ length: 5 }, (_, index) => ({ id: `q${index}`, correctAnswerIndex: 0, explanation: "E2E evidence", skill: index < 2 ? "grammar" : "vocabulary", difficulty: "A1" }));
  const quizRef = dbAdmin.collection("quiz_sessions").doc(quizSessionId);
  await quizRef.create({ userId: uid, language: "en", level: "A1", questions, status: "active", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 300_000).toISOString() });
  createdRefs.push(quizRef);

  const quiz = await completeQuiz(uid, quizSessionId, [0, 0, 0, 0, 0], 1);
  const pronunciation = await completePronunciation(uid, pronunciationId, { targetText: "three", transcription: "three", overallScore: 84, accuracyScore: 80, fluencyScore: 86, completenessScore: 100, phonemeAnalysis: [{ phoneme: "th", ipaSymbol: "θ", accuracy: 65, feedback: "E2E" }] }, "en", 1);
  const flashcards = await completeFlashcardSession(uid, flashcardId, { language: "en", durationMinutes: 1, ratings: [{ cardId: "hello", word: "hello", rating: "known" }, { cardId: "world", word: "world", rating: "learning" }] });
  const [quizReplay, pronunciationReplay, flashcardsReplay] = await Promise.all([
    completeQuiz(uid, quizSessionId, [0, 0, 0, 0, 0], 1),
    completePronunciation(uid, pronunciationId, { targetText: "three", transcription: "three", overallScore: 84, accuracyScore: 80, fluencyScore: 86, completenessScore: 100, phonemeAnalysis: [{ phoneme: "th", ipaSymbol: "θ", accuracy: 65, feedback: "E2E" }] }, "en", 1),
    completeFlashcardSession(uid, flashcardId, { language: "en", durationMinutes: 1, ratings: [{ cardId: "hello", word: "hello", rating: "known" }, { cardId: "world", word: "world", rating: "learning" }] }),
  ]);

  const progressRef = dbAdmin.collection("learning_progress").doc(uid);
  const memoryRef = dbAdmin.collection("user_memory").doc(uid);
  const gameRef = dbAdmin.collection("user_gamification").doc(uid);
  const sourceRefs = [dbAdmin.collection("pronunciation_results").doc(pronunciationId), dbAdmin.collection("flashcard_sessions").doc(flashcardId)];
  const receiptRefs = [`quiz_${quizSessionId}`, `pronunciation_${pronunciationId}`, `flashcard_${flashcardId}`].map(id => progressRef.collection("events").doc(id));
  const snapshots = await dbAdmin.getAll(progressRef, memoryRef, gameRef, ...sourceRefs, ...receiptRefs);
  const progress = snapshots[0].data(); const memory = snapshots[1].data(); const game = snapshots[2].data();
  if (progress?.totalActivities !== 3 || progress?.completedByType?.quiz !== 1 || progress?.completedByType?.pronunciation !== 1 || progress?.completedByType?.vocabulary !== 1) throw new Error("Progresso canónico remoto divergente.");
  if (!memory?.lastQuizAt || !memory?.lastPronunciationAt || !memory?.lastFlashcardAt) throw new Error("Memória remota incompleta.");
  if (!snapshots.slice(3).every((snapshot: any) => snapshot.exists)) throw new Error("Fontes ou recibos remotos ausentes.");
  if (!quizReplay.duplicated || !pronunciationReplay.duplicate || !flashcardsReplay.duplicate) throw new Error("Replay remoto não foi idempotente.");
  const expectedXp = Number(quiz.xpAwarded) + Number(pronunciation.xpAwarded) + Number(flashcards.xpAwarded);
  if (Number(game?.xp) !== expectedXp) throw new Error("XP remoto foi duplicado ou divergiu.");
  console.log(JSON.stringify({ ok: true, databaseId: config.firestoreDatabaseId, authenticated: true, activities: progress.totalActivities, receipts: 3, xp: game.xp, replayIdempotent: true, cleanup: "pending" }));

  const quizAudit = crypto.createHash("sha256").update(`${uid}|quiz_attempt|${quizSessionId}`).digest("hex");
  const practiceAudits = [`pronunciation_${pronunciationId}`, `flashcard_${flashcardId}`].map(id => crypto.createHash("sha256").update(`${uid}|${id}`).digest("hex"));
  createdRefs.push(...sourceRefs, ...receiptRefs, progressRef, memoryRef, gameRef, ...[quizAudit, ...practiceAudits].map(id => dbAdmin.collection("xp_audit_logs").doc(id)));
  if (manifestPath) {
    fs.writeFileSync(manifestPath, JSON.stringify({ email, password, idToken, uid, documentPaths: createdRefs.map(ref => ref.path), apiKey: config.apiKey }), { encoding: "utf8", mode: 0o600 });
    console.log(JSON.stringify({ visualFixture: "ready", manifestPath, email }));
  }
} finally {
  if (!manifestPath && createdRefs.length) {
    const { dbAdmin } = await import("../server/config/firebaseAdmin");
    for (const ref of createdRefs) await ref.delete().catch(() => undefined);
  }
  if (!manifestPath && idToken) await identityRequest("delete", { idToken }).catch(() => undefined);
  cleanupComplete = !manifestPath;
  if (!manifestPath) console.log(JSON.stringify({ cleanup: "complete", firestoreDocumentsRemoved: createdRefs.length, authUserRemoved: Boolean(idToken) }));
}
