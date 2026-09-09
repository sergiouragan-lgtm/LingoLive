import { dbAdmin } from "../../config/firebaseAdmin";

export const EBOOK_DOCUMENT_SCHEMA_VERSION = "2.0";
const text = (value: unknown, max: number, required = false) => typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);

export function validateEbookDraft(value: any): boolean {
  if (!value || !text(value.title, 160, true) || !text(value.subtitle ?? "", 300) || !text(value.description ?? "", 3000) || !text(value.language, 40, true) || !Array.isArray(value.chapters) || value.chapters.length > 50) return false;
  if (JSON.stringify(value).length > 700_000) return false;
  return value.chapters.every((chapter: any) => text(chapter.id, 100, true) && text(chapter.title, 200, true) && text(chapter.content ?? "", 100_000) && (!chapter.blocks || (Array.isArray(chapter.blocks) && chapter.blocks.length <= 500 && chapter.blocks.every((block: any) => text(block.id, 100, true) && ["paragraph", "dialogue", "grammar-table", "vocab-card", "accordion", "quiz", "audio-player"].includes(block.type) && block.data && typeof block.data === "object"))));
}

export function decideVersionWrite(currentVersion: number, baseVersion: number | undefined, conflictStrategy?: "fork"): "update" | "fork" | "conflict" {
  if (baseVersion === currentVersion) return "update";
  return conflictStrategy === "fork" ? "fork" : "conflict";
}

export async function saveVersionedEbook(authorId: string, draft: any, options: { id?: string; baseVersion?: number; conflictStrategy?: "fork" } = {}) {
  if (!dbAdmin) throw Object.assign(new Error("Firestore unavailable"), { code: "FIRESTORE_UNAVAILABLE" });
  if (!validateEbookDraft(draft)) throw Object.assign(new Error("Invalid ebook draft"), { code: "INVALID_EBOOK" });
  const now = Date.now();
  const payload = { ...draft, schemaVersion: EBOOK_DOCUMENT_SCHEMA_VERSION, authorId, updatedAt: now };
  if (!options.id) {
    const ref = dbAdmin.collection("ebooks").doc();
    await ref.create({ ...payload, contentVersion: 1, createdAt: now });
    return { id: ref.id, contentVersion: 1, forked: false };
  }
  const ref = dbAdmin.collection("ebooks").doc(options.id);
  return dbAdmin.runTransaction(async (transaction: any) => {
    const currentSnapshot = await transaction.get(ref);
    if (!currentSnapshot.exists || currentSnapshot.data()?.authorId !== authorId) throw Object.assign(new Error("Ebook not found"), { code: "EBOOK_NOT_FOUND" });
    const current = currentSnapshot.data(); const currentVersion = Number(current.contentVersion || 1);
    const decision = decideVersionWrite(currentVersion, options.baseVersion, options.conflictStrategy);
    if (decision !== "update") {
      if (decision === "fork") {
        const forkRef = dbAdmin.collection("ebooks").doc();
        transaction.create(forkRef, { ...payload, title: `${draft.title} (cópia recuperada)`, contentVersion: 1, createdAt: now, forkedFrom: { ebookId: options.id, version: currentVersion } });
        return { id: forkRef.id, contentVersion: 1, forked: true };
      }
      throw Object.assign(new Error("Ebook version conflict"), { code: "EBOOK_CONFLICT", currentVersion, serverProject: { id: options.id, ...current } });
    }
    transaction.create(ref.collection("versions").doc(String(currentVersion)), { ...current, ebookId: options.id, version: currentVersion, archivedAt: now });
    transaction.set(ref, { ...payload, contentVersion: currentVersion + 1, createdAt: current.createdAt }, { merge: false });
    return { id: options.id, contentVersion: currentVersion + 1, forked: false };
  });
}

export async function listEbookVersions(authorId: string, ebookId: string) {
  if (!dbAdmin) throw Object.assign(new Error("Firestore unavailable"), { code: "FIRESTORE_UNAVAILABLE" });
  const ebook = await dbAdmin.collection("ebooks").doc(ebookId).get();
  if (!ebook.exists || ebook.data()?.authorId !== authorId) throw Object.assign(new Error("Ebook not found"), { code: "EBOOK_NOT_FOUND" });
  const versions = await ebook.ref.collection("versions").orderBy("version", "desc").limit(50).get();
  return versions.docs.map((document: any) => ({ id: document.id, ...document.data() }));
}

export async function restoreEbookVersion(authorId: string, ebookId: string, version: number, baseVersion: number) {
  if (!dbAdmin || !Number.isInteger(version) || version < 1) throw Object.assign(new Error("Invalid version"), { code: "INVALID_EBOOK" });
  const ref = dbAdmin.collection("ebooks").doc(ebookId); const versionRef = ref.collection("versions").doc(String(version)); const now = Date.now();
  return dbAdmin.runTransaction(async (transaction: any) => {
    const [currentSnapshot, versionSnapshot] = await Promise.all([transaction.get(ref), transaction.get(versionRef)]);
    if (!currentSnapshot.exists || !versionSnapshot.exists || currentSnapshot.data()?.authorId !== authorId) throw Object.assign(new Error("Ebook not found"), { code: "EBOOK_NOT_FOUND" });
    const current = currentSnapshot.data(); const currentVersion = Number(current.contentVersion || 1);
    if (baseVersion !== currentVersion) throw Object.assign(new Error("Ebook version conflict"), { code: "EBOOK_CONFLICT", currentVersion, serverProject: { id: ebookId, ...current } });
    const archived = versionSnapshot.data(); const { archivedAt: _archivedAt, ebookId: _ebookId, version: _version, ...restored } = archived;
    transaction.create(ref.collection("versions").doc(String(currentVersion)), { ...current, ebookId, version: currentVersion, archivedAt: now });
    transaction.set(ref, { ...restored, authorId, contentVersion: currentVersion + 1, updatedAt: now, createdAt: current.createdAt }, { merge: false });
    return { id: ebookId, contentVersion: currentVersion + 1, project: { id: ebookId, ...restored, contentVersion: currentVersion + 1, updatedAt: now, createdAt: current.createdAt } };
  });
}
