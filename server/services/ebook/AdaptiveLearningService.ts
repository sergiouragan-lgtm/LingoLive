import crypto from "crypto";
import { safeSetDoc, safeGetDoc, safeQueryDocs } from "../firestoreSafe.service";
import { adaptToLevel } from "./EbookCurationService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Enrollment {
  ebookId: string;
  studentId: string;
  studentEmail: string;
  enrolledAt: number;
  currentCefrLevel: string | null;
  progress: Record<string, ChapterProgress>;
  licenseKey?: string;
  purchaseId?: string;
}

export interface ChapterProgress {
  read: boolean;
  readAt?: number;
  completedExercises: number;
  totalExercises: number;
  lastAdaptedLevel?: string;
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export async function enrollStudent(
  ebookId: string,
  studentId: string,
  studentEmail: string,
  cefrLevel: string | null = null
): Promise<Enrollment> {
  const enrollmentId = `${studentId}_${ebookId}`;
  const existing = await safeGetDoc("ebook_enrollments", enrollmentId);

  if (existing.exists) {
    return existing.data() as Enrollment;
  }

  const enrollment: Enrollment = {
    ebookId,
    studentId,
    studentEmail,
    enrolledAt: Date.now(),
    currentCefrLevel: cefrLevel,
    progress: {},
  };

  await safeSetDoc("ebook_enrollments", enrollmentId, enrollment);
  return enrollment;
}

export async function getEnrollment(
  ebookId: string,
  studentId: string
): Promise<Enrollment | null> {
  const enrollmentId = `${studentId}_${ebookId}`;
  const doc = await safeGetDoc("ebook_enrollments", enrollmentId);
  if (!doc.exists) return null;
  return doc.data() as Enrollment;
}

export async function getStudentLibrary(studentId: string): Promise<Enrollment[]> {
  const docs = await safeQueryDocs("ebook_enrollments", "studentId", studentId);
  return docs as Enrollment[];
}

// ─── Progress tracking ────────────────────────────────────────────────────────

export async function markChapterRead(
  ebookId: string,
  studentId: string,
  chapterId: string,
  exerciseStats?: { completed: number; total: number }
): Promise<void> {
  const enrollmentId = `${studentId}_${ebookId}`;
  const doc = await safeGetDoc("ebook_enrollments", enrollmentId);
  if (!doc.exists) return;

  const enrollment = doc.data() as Enrollment;
  const existing = enrollment.progress[chapterId] ?? { read: false, completedExercises: 0, totalExercises: 0 };

  await safeSetDoc("ebook_enrollments", enrollmentId, {
    ...enrollment,
    progress: {
      ...enrollment.progress,
      [chapterId]: {
        ...existing,
        read: true,
        readAt: Date.now(),
        completedExercises: exerciseStats?.completed ?? existing.completedExercises,
        totalExercises: exerciseStats?.total ?? existing.totalExercises,
      },
    },
  });
}

export async function updateStudentCefrLevel(
  ebookId: string,
  studentId: string,
  cefrLevel: string
): Promise<void> {
  const enrollmentId = `${studentId}_${ebookId}`;
  const doc = await safeGetDoc("ebook_enrollments", enrollmentId);
  if (!doc.exists) return;
  await safeSetDoc("ebook_enrollments", enrollmentId, {
    ...doc.data(),
    currentCefrLevel: cefrLevel,
  });
}

// ─── Adaptive content with cache ──────────────────────────────────────────────

export async function getAdaptedContent(
  ebookId: string,
  chapterId: string,
  blockId: string | null,
  originalText: string,
  targetLevel: string,
  language: string
): Promise<string> {
  const cacheKey = buildCacheKey(originalText, targetLevel, language);
  const cacheId = `${ebookId}_${chapterId}_${blockId ?? "full"}_${cacheKey.slice(0, 16)}`;

  // Check cache in Firestore
  const cached = await safeGetDoc("adaptive_content_cache", cacheId);
  if (cached.exists) {
    const data = cached.data() as any;
    return data.adaptedText as string;
  }

  // Call Gemini adaptation
  const adaptedText = await adaptToLevel(originalText, targetLevel, language);

  // Store in cache
  await safeSetDoc("adaptive_content_cache", cacheId, {
    ebookId,
    chapterId,
    blockId,
    originalText,
    adaptedText,
    targetLevel,
    language,
    cacheKey,
    modelUsed: "gemini-2.5-flash",
    createdAt: Date.now(),
  });

  return adaptedText;
}

function buildCacheKey(text: string, level: string, language: string): string {
  return crypto
    .createHash("sha256")
    .update(`${text}|${level}|${language}`)
    .digest("hex");
}

// ─── Completion stats ─────────────────────────────────────────────────────────

export function computeCompletionPercent(enrollment: Enrollment, totalChapters: number): number {
  if (totalChapters === 0) return 0;
  const readCount = Object.values(enrollment.progress).filter((p) => p.read).length;
  return Math.round((readCount / totalChapters) * 100);
}
