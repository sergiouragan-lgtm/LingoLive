import {
  safeGetDoc,
  safeSetDoc,
  safeAddDoc,
  safeListDocs,
  safeQueryDocs,
} from "../firestoreSafe.service";

export interface EbookAssignment {
  id: string;
  teacherId: string;
  ebookId: string;
  ebookTitle: string;
  title: string;
  description: string;
  dueDate: string | null; // ISO date string
  studentIds: string[];
  createdAt: string;
}

export interface AssignmentProgress {
  studentId: string;
  ebookId: string;
  completionPercent: number;
  lastReadAt: string | null;
  status: "not_started" | "in_progress" | "completed";
}

export interface AssignmentWithProgress extends EbookAssignment {
  progress: AssignmentProgress[];
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
}

export interface StudentAssignment {
  assignment: EbookAssignment;
  completionPercent: number;
  status: "not_started" | "in_progress" | "completed";
  overdue: boolean;
}

function deriveStatus(pct: number): AssignmentProgress["status"] {
  if (pct >= 100) return "completed";
  if (pct > 0) return "in_progress";
  return "not_started";
}

export async function createAssignment(
  teacherId: string,
  data: {
    ebookId: string;
    title: string;
    description?: string;
    dueDate?: string | null;
    studentIds: string[];
  }
): Promise<EbookAssignment> {
  const ebookDoc = await safeGetDoc("ebooks", data.ebookId);
  const ebookTitle = (ebookDoc.exists ? (ebookDoc.data() as any).title : null) ?? "E-book";

  const assignment: Omit<EbookAssignment, "id"> = {
    teacherId,
    ebookId: data.ebookId,
    ebookTitle,
    title: data.title,
    description: data.description ?? "",
    dueDate: data.dueDate ?? null,
    studentIds: data.studentIds,
    createdAt: new Date().toISOString(),
  };

  const result = await safeAddDoc("ebook_assignments", assignment);
  const docId = typeof result === "string" ? result : (result as any).id;
  return { id: docId, ...assignment };
}

export async function getAssignment(assignmentId: string): Promise<EbookAssignment | null> {
  const doc = await safeGetDoc("ebook_assignments", assignmentId);
  if (!doc.exists) return null;
  return { id: assignmentId, ...(doc.data() as any) };
}

export async function listTeacherAssignments(teacherId: string): Promise<EbookAssignment[]> {
  const docs = await safeQueryDocs("ebook_assignments", "teacherId", teacherId);
  return docs.map((d: any) => ({ id: d.id, ...d }));
}

export async function getAssignmentWithProgress(
  assignmentId: string
): Promise<AssignmentWithProgress | null> {
  const assignment = await getAssignment(assignmentId);
  if (!assignment) return null;

  const progress: AssignmentProgress[] = [];
  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;

  for (const studentId of assignment.studentIds) {
    const enrollments = await safeQueryDocs("ebook_enrollments", "studentId", studentId);
    const enroll = (enrollments as any[]).find((e) => e.ebookId === assignment.ebookId);
    const pct = enroll?.completionPercent ?? 0;
    const status = deriveStatus(pct);

    progress.push({
      studentId,
      ebookId: assignment.ebookId,
      completionPercent: pct,
      lastReadAt: enroll?.lastReadAt ?? null,
      status,
    });

    if (status === "completed") completedCount++;
    else if (status === "in_progress") inProgressCount++;
    else notStartedCount++;
  }

  return { ...assignment, progress, completedCount, inProgressCount, notStartedCount };
}

export async function listStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
  const allAssignments = await safeListDocs("ebook_assignments");
  const mine = (allAssignments as any[]).filter((a) =>
    (a.studentIds ?? []).includes(studentId)
  );

  const enrollments = await safeQueryDocs("ebook_enrollments", "studentId", studentId);
  const enrollMap: Record<string, number> = {};
  for (const e of enrollments as any[]) {
    enrollMap[e.ebookId] = e.completionPercent ?? 0;
  }

  const now = new Date();
  return mine.map((a) => {
    const pct = enrollMap[a.ebookId] ?? 0;
    const status = deriveStatus(pct);
    const overdue =
      !!a.dueDate && status !== "completed" && new Date(a.dueDate) < now;
    return {
      assignment: { id: a.id, ...a },
      completionPercent: pct,
      status,
      overdue,
    };
  });
}

export async function updateAssignment(
  assignmentId: string,
  updates: Partial<Pick<EbookAssignment, "title" | "description" | "dueDate" | "studentIds">>
): Promise<EbookAssignment | null> {
  const existing = await getAssignment(assignmentId);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  await safeSetDoc("ebook_assignments", assignmentId, updated);
  return updated;
}
