import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { safeGetDoc, safeListDocs, safeQueryDocs } from "../services/firestoreSafe.service";

const router = Router();
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const average = (items: any[], field: string) => items.length
  ? Math.round(items.reduce((sum, item) => sum + number(item[field]), 0) / items.length) : 0;

router.get("/learning", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.uid;
    const userSnapshot = await safeGetDoc("users", userId);
    const user = userSnapshot.exists ? userSnapshot.data() : {};
    const role = String(req.user.role || user.role || "LEARNER").toUpperCase();
    let students: any[] = [];
    if (["SUPER_ADMIN", "PLATFORM_ADMIN", "ORG_ADMIN", "SCHOOL_ADMIN"].includes(role)) {
      students = await safeListDocs("students");
    } else if (["TEACHER", "NATIVE_TEACHER"].includes(role)) {
      students = await safeQueryDocs("students", "teacherUid", userId);
    } else if (["PARENT", "PARENT_GUARDIAN"].includes(role)) {
      students = await safeQueryDocs("students", "parentUid", userId);
    } else {
      const studentSnapshot = await safeGetDoc("students", userId);
      students = [{ id: userId, ...(studentSnapshot.exists ? studentSnapshot.data() : user) }];
    }

    const metrics = [];
    for (const student of students) {
      const studentId = student.id;
      const [sessions, completions, attempts, pronunciation] = await Promise.all([
        safeQueryDocs("users_practice_sessions", "userId", studentId),
        safeQueryDocs("lesson_completions", "userId", studentId),
        safeQueryDocs("assessment_attempts", "userId", studentId),
        safeQueryDocs("pronunciation_results", "userId", studentId),
      ]);
      const profileSnapshot = await safeGetDoc("adaptive_profiles", studentId);
      const profile = profileSnapshot.exists ? profileSnapshot.data() : {};
      const totalStudySeconds = sessions.reduce((sum, item) => sum + number(item.durationSeconds || item.studyTimeSeconds), 0);
      const assignedLessons = number(student.assignedLessons || student.totalLessons);
      const completedLessons = completions.length || number(student.completedLessons);
      const lastActive = profile.lastUpdated || student.lastActive || student.lastActivityAt || null;
      const parsedLastActive = lastActive ? Date.parse(lastActive) : NaN;
      const inactiveDays = Number.isFinite(parsedLastActive) ? Math.floor((Date.now() - parsedLastActive) / 86400000) : null;
      const performanceScore = average(attempts, "scorePercent");
      const speakingProgress = average(pronunciation, "overallScore");
      metrics.push({
        id: studentId,
        name: student.name || student.nome || user.displayName || "Aluno",
        email: student.email || "",
        learningLanguage: student.targetLanguage || student.learningLanguage || "",
        targetCefr: student.targetCefr || "",
        currentCefr: profile.estimatedCefr || student.level || "A1",
        streak: number(profile.learningStreak || student.streak),
        studyTime: Math.round((totalStudySeconds / 3600) * 10) / 10,
        completionRate: assignedLessons ? Math.min(100, Math.round((completedLessons / assignedLessons) * 100)) : 0,
        attendanceRate: number(profile.attendanceRate),
        performanceScore,
        motivationIndex: profile.motivationLevel === "high" ? 100 : profile.motivationLevel === "medium" ? 50 : 0,
        speakingProgress,
        writingProgress: number(profile.writingQualityScore),
        listeningProgress: number(profile.listeningScore),
        readingProgress: number(profile.readingScore),
        dropoutRisk: inactiveDays === null || inactiveDays >= 14 ? "High" : inactiveDays >= 7 ? "Medium" : "Low",
        lastActive,
        evidence: { sessions: sessions.length, completions: completedLessons, attempts: attempts.length, pronunciation: pronunciation.length },
      });
    }

    const exportHistory = (await safeListDocs("analytics_export_events"))
      .filter((event) => event.status && event.timestamp)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    const now = new Date().toISOString();
    const aggregateLogs = [
      { id: `students-${now}`, collection: "students", documentId: "real_student_scope", operation: "COUNT", timestamp: now, status: "SUCCESS", sizeBytes: 0, count: metrics.length },
      { id: `exports-${now}`, collection: "analytics_export_events", documentId: "persisted_exports", operation: "COUNT", timestamp: now, status: "SUCCESS", sizeBytes: 0, count: exportHistory.length },
    ];
    return res.json({ students: metrics, aggregateLogs, exportHistory, generatedAt: now });
  } catch (error: any) {
    console.error("Learning analytics aggregation failed:", error);
    return res.status(503).json({ error: "LEARNING_ANALYTICS_UNAVAILABLE", message: "Não foi possível agregar os dados reais neste momento." });
  }
});

export default router;
