import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
} from "firebase/firestore";

export interface StudentProgress {
  studentId: string;
  studentName: string;
  age: number;
  grade: string;
  targetLanguage: string;
  progress: number;
  weeklyMinutes: number;
  xp: number;
  level: number;
  attendanceRate: number;
  coppaConsent: boolean;
  lastActive: string;
}

export interface TeacherMessage {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  replies: Array<{
    senderId: string;
    senderRole: "teacher" | "parent";
    text: string;
    timestamp: string;
  }>;
}

export interface StudentAssignment {
  id: string;
  studentId: string;
  title: string;
  description: string;
  dueDate: string;
  submittedAt?: string;
  status: "pending" | "submitted" | "graded";
  grade?: number;
  feedback?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  plan: string;
  status: "paid" | "pending" | "refunded";
  invoiceUrl?: string;
}

/**
 * Carrega todos os dependentes (estudantes) de um utilizador (pai/mãe)
 */
export async function loadStudentProgressForParent(
  parentUid: string
): Promise<StudentProgress[]> {
  try {
    const parentDoc = await getDoc(doc(db, "users", parentUid));
    const parentData = parentDoc.data();
    const dependentIds = parentData?.dependentUids || [];

    if (dependentIds.length === 0) {
      return [];
    }

    const studentProgressList: StudentProgress[] = [];

    for (const studentId of dependentIds) {
      const studentSnap = await getDoc(doc(db, "users", studentId));
      const studentData = studentSnap.data();

      if (studentData) {
        const progressSnap = await getDoc(
          doc(db, "users", studentId, "progress", "summary")
        );
        const progressData = progressSnap.data();

        studentProgressList.push({
          studentId,
          studentName: studentData.displayName || "Estudante",
          age: studentData.age || 0,
          grade: studentData.grade || "N/A",
          targetLanguage: studentData.languageLearning?.[0] || "Desconhecido",
          progress: progressData?.completionPercentage || 0,
          weeklyMinutes: progressData?.weeklyMinutes || 0,
          xp: progressData?.totalXp || 0,
          level: progressData?.level || 1,
          attendanceRate: progressData?.attendanceRate || 0,
          coppaConsent: studentData.coppaConsent || false,
          lastActive: progressData?.lastActivityDate || "Nunca",
        });
      }
    }

    return studentProgressList;
  } catch (error) {
    console.error("Erro ao carregar progresso dos estudantes:", error);
    return [];
  }
}

/**
 * Carrega mensagens de professores para um pai/mãe sobre seus filhos
 */
export async function loadTeacherMessages(
  parentUid: string,
  studentId?: string
): Promise<TeacherMessage[]> {
  try {
    let q;

    if (studentId) {
      q = query(
        collection(db, "parentMessages"),
        where("parentUid", "==", parentUid),
        where("studentId", "==", studentId),
        orderBy("timestamp", "desc"),
        limit(50)
      );
    } else {
      q = query(
        collection(db, "parentMessages"),
        where("parentUid", "==", parentUid),
        orderBy("timestamp", "desc"),
        limit(50)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        teacherId: data.teacherId || "",
        teacherName: data.teacherName || "",
        studentId: data.studentId || "",
        studentName: data.studentName || "",
        subject: data.subject || "",
        content: data.content || "",
        timestamp: data.timestamp?.toDate?.().toISOString() || "",
        isRead: data.isRead || false,
        replies: data.replies || [],
      };
    });
  } catch (error) {
    console.error("Erro ao carregar mensagens de professores:", error);
    return [];
  }
}

/**
 * Envia uma resposta a uma mensagem de professor
 */
export async function replyToTeacherMessage(
  messageId: string,
  parentUid: string,
  reply: string
): Promise<boolean> {
  try {
    const messageRef = doc(db, "parentMessages", messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      throw new Error("Mensagem não encontrada");
    }

    const currentReplies = messageSnap.data().replies || [];
    currentReplies.push({
      senderId: parentUid,
      senderRole: "parent",
      text: reply,
      timestamp: Timestamp.now(),
    });

    await updateDoc(messageRef, {
      replies: currentReplies,
      isRead: true,
    });

    return true;
  } catch (error) {
    console.error("Erro ao responder a mensagem:", error);
    return false;
  }
}

/**
 * Carrega atribuições/tarefas para um estudante
 */
export async function loadStudentAssignments(
  studentId: string
): Promise<StudentAssignment[]> {
  try {
    const q = query(
      collection(db, "users", studentId, "assignments"),
      orderBy("dueDate", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      studentId,
      title: doc.data().title,
      description: doc.data().description,
      dueDate: doc.data().dueDate?.toDate?.().toISOString() || "",
      submittedAt: doc.data().submittedAt?.toDate?.().toISOString(),
      status: doc.data().status || "pending",
      grade: doc.data().grade,
      feedback: doc.data().feedback,
    }));
  } catch (error) {
    console.error("Erro ao carregar atribuições:", error);
    return [];
  }
}

/**
 * Carrega histórico de pagamentos de um pai/mãe
 */
export async function loadPaymentHistory(
  parentUid: string
): Promise<PaymentRecord[]> {
  try {
    const q = query(
      collection(db, "payments"),
      where("userId", "==", parentUid),
      orderBy("date", "desc"),
      limit(25)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      date: doc.data().date?.toDate?.().toISOString() || "",
      amount: doc.data().amount || 0,
      currency: doc.data().currency || "EUR",
      plan: doc.data().planName || "Desconhecido",
      status: doc.data().status || "pending",
      invoiceUrl: doc.data().invoiceUrl,
    }));
  } catch (error) {
    console.error("Erro ao carregar histórico de pagamentos:", error);
    return [];
  }
}

/**
 * Verifica e valida consentimento COPPA para um estudante
 */
export async function validateCoppaConsent(
  studentId: string
): Promise<{ hasConsent: boolean; consentDate?: string }> {
  try {
    const studentSnap = await getDoc(doc(db, "users", studentId));
    const studentData = studentSnap.data();

    return {
      hasConsent: studentData?.coppaConsent || false,
      consentDate: studentData?.coppaConsentDate?.toDate?.().toISOString(),
    };
  } catch (error) {
    console.error("Erro ao validar consentimento COPPA:", error);
    return { hasConsent: false };
  }
}

/**
 * Registra consentimento COPPA (requer autenticação de pai/mãe)
 */
export async function recordCoppaConsent(
  studentId: string,
  parentUid: string
): Promise<boolean> {
  try {
    await updateDoc(doc(db, "users", studentId), {
      coppaConsent: true,
      coppaConsentDate: Timestamp.now(),
      coppaConsentParentUid: parentUid,
    });
    return true;
  } catch (error) {
    console.error("Erro ao registrar consentimento COPPA:", error);
    return false;
  }
}

/**
 * Carrega relatório de atividade semanal de um estudante
 */
export async function loadWeeklyActivityReport(
  studentId: string
): Promise<{
  weeklyMinutes: number;
  lessonsCompleted: number;
  xpEarned: number;
  streak: number;
}> {
  try {
    const reportSnap = await getDoc(
      doc(db, "users", studentId, "analytics", "weeklyReport")
    );

    if (!reportSnap.exists()) {
      return {
        weeklyMinutes: 0,
        lessonsCompleted: 0,
        xpEarned: 0,
        streak: 0,
      };
    }

    const data = reportSnap.data();
    return {
      weeklyMinutes: data.minutesSpent || 0,
      lessonsCompleted: data.lessonsCompleted || 0,
      xpEarned: data.xpEarned || 0,
      streak: data.currentStreak || 0,
    };
  } catch (error) {
    console.error("Erro ao carregar relatório semanal:", error);
    return {
      weeklyMinutes: 0,
      lessonsCompleted: 0,
      xpEarned: 0,
      streak: 0,
    };
  }
}
