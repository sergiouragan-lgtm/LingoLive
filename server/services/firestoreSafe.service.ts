import { dbAdmin } from "../config/firebaseAdmin";
import { ENABLE_SANDBOX_FALLBACK } from "../config/env";

// CORREÇÃO DE BUG CRÍTICO (encontrado pelo pipeline DevSecOps): este ficheiro
// é o caminho central de leitura/escrita usado em quase todo o backend
// (safeGetDoc, safeSetDoc, safeSetSubDoc, safeGetSubDocs, safeAddDoc).
// dbAdmin fica sempre inicializado (não-nulo) quando existe
// firebase-applet-config.json, mesmo sem credenciais reais — a
// inicialização em si não contacta a rede, só as chamadas reais o fazem.
// Isto fazia com que, em ambiente de testes automatizados (sem acesso à
// rede do Firestore), CADA operação de leitura/escrita em CADA teste
// tentasse uma chamada real de rede antes de cair no modo local — e cada
// tentativa falhada demorava perto do limite de timeout do Vitest,
// derrubando suites inteiras (ex: 88 testes em webhooks.test.ts). Usamos a
// variável VITEST, definida automaticamente pelo Vitest em qualquer
// execução de testes, para saltar direto para o modo local em memória
// durante os testes — o comportamento em produção não muda.
const isRunningUnderTests = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
const dbAdminUsable = () => dbAdmin && !isRunningUnderTests;

export function shouldFallback(err: any): boolean {
  if (ENABLE_SANDBOX_FALLBACK) return true;
  const errMsg = err?.message || String(err || "");
  const errMsgLower = errMsg.toLowerCase();
  return (
    errMsgLower.includes("permission") ||
    errMsgLower.includes("denied") ||
    errMsgLower.includes("quota") ||
    errMsgLower.includes("disable") ||
    errMsgLower.includes("not enabled") ||
    errMsgLower.includes("not initialized") ||
    errMsgLower.includes("invalid-argument") ||
    err?.code === 7
  );
}

export function logSandboxWarning(operation: string, err: any) {
  const errMsg = err?.message || String(err || "");
  const errMsgLower = errMsg.toLowerCase();
  if (
    shouldFallback(err)
  ) {
    console.log(`[Storage Sandbox] Active for ${operation} (Running with local high-availability state)`);
  } else {
    console.warn(`[Storage Sandbox] ${operation} warning: ${errMsg}`);
  }
}

// Resilient Fallback Storage for High-Availability Sandbox Mode
export const localMemoryDb = new Map<string, any>();
export const localAiSessionsDb: any[] = [];

// Seed default teacher and student data so the app remains fully interactive even if Firestore API is disabled
export const seedTeachers = [
  { id: "t1", nome: "Dra. Maria Neto", email: "maria.neto@lingolive.ai", telefone: "923-456-789", idioma: "Inglês", sala: "Sala 4 - Bloco A", turno: "Manhã", schoolId: "default-school", allowedClassIds: ["c1"], invitationCode: "PROF-NETO1" },
  { id: "t2", nome: "Prof. António Gonga", email: "antonio.gonga@lingolive.ai", telefone: "912-345-678", idioma: "Francês", sala: "Sala 2 - Bloco B", turno: "Tarde", schoolId: "default-school", allowedClassIds: ["c2"], invitationCode: "PROF-GONGA" }
];
seedTeachers.forEach(t => localMemoryDb.set(`teachers_${t.id}`, t));

export const seedStudents = [
  { id: "s1", name: "Helder de Sousa", emailPai: "pai.helder@gmail.com", parentName: "Carlos de Sousa", targetLanguage: "en", teacherUid: "t1", xp: 1250, streak: 12, completedLessons: 18, lastActive: "2026-07-07" },
  { id: "s2", name: "Aline Cassinda", emailPai: "mae.aline@gmail.com", parentName: "Sofia Cassinda", targetLanguage: "fr", teacherUid: "t2", xp: 950, streak: 8, completedLessons: 14, lastActive: "2026-07-06" }
];
seedStudents.forEach(s => localMemoryDb.set(`students_${s.id}`, s));

// Robust wrapper functions for database reading and writing
export async function safeGetDoc(collectionName: string, docId: string) {
  if (dbAdminUsable()) {
    try {
      const docRef = dbAdmin.collection(collectionName).doc(docId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return { exists: true, data: () => docSnap.data() };
      }
    } catch (e: any) {
      logSandboxWarning(`read on ${collectionName}/${docId}`, e);
      if (!shouldFallback(e)) {
        throw e;
      }
    }
  } else if (!ENABLE_SANDBOX_FALLBACK) {
    console.log(`[Storage Sandbox] dbAdmin not initialized, falling back for read on ${collectionName}/${docId}`);
  }
  const key = `${collectionName}_${docId}`;
  if (localMemoryDb.has(key)) {
    return { exists: true, data: () => localMemoryDb.get(key) };
  }
  return { exists: false, data: () => null };
}

export function removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefinedFields);
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = typeof val === "object" && val !== null ? removeUndefinedFields(val) : val;
    }
  }
  return cleaned;
}

// Fixed safeSetDoc to default to { merge: true } to prevent overwriting entire documents
export async function safeSetDoc(
  collectionName: string,
  docId: string,
  data: any,
  merge = true
) {
  const key = `${collectionName}_${docId}`;
  const cleanedData = removeUndefinedFields(data);

  const existingLocal = localMemoryDb.get(key) || {};
  localMemoryDb.set(key, merge ? { ...existingLocal, ...cleanedData } : cleanedData);

  if (dbAdminUsable()) {
    try {
      await dbAdmin.collection(collectionName).doc(docId).set(cleanedData, { merge });
      return true;
    } catch (e: any) {
      logSandboxWarning(`write on ${collectionName}/${docId}`, e);
      if (!shouldFallback(e)) {
        throw e;
      }
    }
  } else if (!ENABLE_SANDBOX_FALLBACK) {
    console.log(`[Storage Sandbox] dbAdmin not initialized, falling back for write on ${collectionName}/${docId}`);
  }
  return true;
}

export async function safeDeleteDoc(collectionName: string, docId: string) {
  const key = `${collectionName}_${docId}`;
  localMemoryDb.delete(key);

  if (dbAdminUsable()) {
    try {
      await dbAdmin.collection(collectionName).doc(docId).delete();
      return true;
    } catch (e: any) {
      logSandboxWarning(`delete on ${collectionName}/${docId}`, e);
      if (!shouldFallback(e)) throw e;
    }
  }
  return true;
}

export async function safeSetSubDoc(
  parentCollection: string,
  parentDocId: string,
  subCollection: string,
  subDocId: string,
  data: any
) {
  const key = `${parentCollection}_${parentDocId}_${subCollection}_${subDocId}`;
  const cleanedData = removeUndefinedFields(data);
  const existingLocal = localMemoryDb.get(key) || {};
  localMemoryDb.set(key, { ...existingLocal, ...cleanedData });

  if (dbAdminUsable()) {
    try {
      await dbAdmin
        .collection(parentCollection)
        .doc(parentDocId)
        .collection(subCollection)
        .doc(subDocId)
        .set(cleanedData, { merge: true });
      return true;
    } catch (e: any) {
      logSandboxWarning(`write subdoc on ${parentCollection}/${parentDocId}/${subCollection}/${subDocId}`, e);
    }
  }
  return true;
}

export async function safeGetSubDocs(
  parentCollection: string,
  parentDocId: string,
  subCollection: string
): Promise<any[]> {
  const results: any[] = [];
  if (dbAdminUsable()) {
    try {
      const snap = await dbAdmin
        .collection(parentCollection)
        .doc(parentDocId)
        .collection(subCollection)
        .get();
      snap.forEach((doc: any) => results.push(doc.data()));
    } catch (e: any) {
      logSandboxWarning(`get subdocs on ${parentCollection}/${parentDocId}/${subCollection}`, e);
    }
  }
  const prefix = `${parentCollection}_${parentDocId}_${subCollection}_`;
  for (const [key, value] of localMemoryDb.entries()) {
    if (key.startsWith(prefix)) {
      if (!results.some(r => r.eventId === value.eventId)) {
        results.push(value);
      }
    }
  }
  return results;
}

export async function safeAddDoc(collectionName: string, data: any) {
  const cleanedData = removeUndefinedFields(data);
  if (collectionName === "ai_sessions") {
    localAiSessionsDb.push(cleanedData);
  }
  const randomId = `local_${Math.random().toString(36).substring(2, 11)}`;
  localMemoryDb.set(`${collectionName}_${randomId}`, { ...cleanedData, id: randomId });

  if (dbAdminUsable()) {
    try {
      const ref = await dbAdmin.collection(collectionName).add(cleanedData);
      return { id: ref.id, source: "firestore" };
    } catch (e: any) {
      logSandboxWarning(`add to ${collectionName}`, e);
      if (!shouldFallback(e)) {
        throw e;
      }
    }
  } else if (!ENABLE_SANDBOX_FALLBACK) {
    console.log(`[Storage Sandbox] dbAdmin not initialized, falling back for add to ${collectionName}`);
  }

  return { id: randomId, source: "local" };
}
