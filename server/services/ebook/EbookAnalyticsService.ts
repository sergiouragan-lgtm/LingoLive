import {
  safeQueryDocs,
  safeListDocs,
  safeGetDoc,
} from "../firestoreSafe.service";

export interface EbookOverviewStats {
  totalEbooks: number;
  totalEnrollments: number;
  totalCompletions: number;
  averageCompletionRate: number;
  topEbooks: { ebookId: string; title: string; enrollments: number; completionRate: number }[];
}

export interface EbookDetailStats {
  ebookId: string;
  title: string;
  totalEnrollments: number;
  completions: number;
  completionRate: number;
  averageProgress: number;
  chapterDropoff: { chapterId: string; order: number; dropoffRate: number }[];
  quizAverageScore: number;
  cefrBreakdown: Record<string, number>;
}

export interface StudentEbookStats {
  studentId: string;
  totalEnrolled: number;
  totalCompleted: number;
  inProgress: number;
  totalReadingTimeMin: number;
  averageQuizScore: number;
  currentCefr: string;
  recentActivity: { ebookId: string; title: string; progress: number; lastReadAt: string }[];
}

export async function getPlatformOverview(): Promise<EbookOverviewStats> {
  const ebooks = await safeListDocs("ebooks");
  const enrollments = await safeListDocs("ebook_enrollments");

  const totalEbooks = ebooks.length;
  const totalEnrollments = enrollments.length;
  let totalCompletions = 0;
  const ebookEnrollMap: Record<string, { enrollments: number; completions: number; title: string }> = {};

  for (const data of enrollments) {
    const eid = data.ebookId;
    if (!ebookEnrollMap[eid]) ebookEnrollMap[eid] = { enrollments: 0, completions: 0, title: data.ebookTitle ?? eid };
    ebookEnrollMap[eid].enrollments++;
    if ((data.completionPercent ?? 0) >= 100) {
      ebookEnrollMap[eid].completions++;
      totalCompletions++;
    }
  }

  const averageCompletionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

  const topEbooks = Object.entries(ebookEnrollMap)
    .map(([ebookId, stats]) => ({
      ebookId,
      title: stats.title,
      enrollments: stats.enrollments,
      completionRate: stats.enrollments > 0 ? (stats.completions / stats.enrollments) * 100 : 0,
    }))
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 10);

  return { totalEbooks, totalEnrollments, totalCompletions, averageCompletionRate, topEbooks };
}

export async function getEbookDetailStats(ebookId: string): Promise<EbookDetailStats> {
  const ebookDoc = await safeGetDoc("ebooks", ebookId);
  const ebookData = ebookDoc.exists ? (ebookDoc.data() as any) : null;
  const title = ebookData?.title ?? ebookId;
  const chapters: any[] = ebookData?.chapters ?? [];

  const enrollments = await safeQueryDocs("ebook_enrollments", "ebookId", ebookId);

  const totalEnrollments = enrollments.length;
  let completions = 0;
  let progressSum = 0;
  let quizScoreSum = 0;
  let quizCount = 0;
  const cefrBreakdown: Record<string, number> = {};
  const chapterReachCount: Record<string, number> = {};

  for (const data of enrollments) {
    const progress = data.completionPercent ?? 0;
    progressSum += progress;
    if (progress >= 100) completions++;

    const cefr = data.cefrLevel ?? "unknown";
    cefrBreakdown[cefr] = (cefrBreakdown[cefr] ?? 0) + 1;

    const completedChapters: string[] = data.completedChapters ?? [];
    for (const cid of completedChapters) {
      chapterReachCount[cid] = (chapterReachCount[cid] ?? 0) + 1;
    }

    const scores: number[] = data.quizScores ?? [];
    for (const s of scores) { quizScoreSum += s; quizCount++; }
  }

  const averageProgress = totalEnrollments > 0 ? progressSum / totalEnrollments : 0;
  const completionRate = totalEnrollments > 0 ? (completions / totalEnrollments) * 100 : 0;
  const quizAverageScore = quizCount > 0 ? quizScoreSum / quizCount : 0;

  const chapterDropoff = chapters.map((ch: any) => {
    const reached = chapterReachCount[ch.id] ?? 0;
    return {
      chapterId: ch.id,
      order: ch.order ?? 0,
      dropoffRate: totalEnrollments > 0 ? 100 - (reached / totalEnrollments) * 100 : 100,
    };
  }).sort((a, b) => a.order - b.order);

  return { ebookId, title, totalEnrollments, completions, completionRate, averageProgress, chapterDropoff, quizAverageScore, cefrBreakdown };
}

export async function getStudentStats(studentId: string): Promise<StudentEbookStats> {
  const enrollments = await safeQueryDocs("ebook_enrollments", "studentId", studentId);

  let totalCompleted = 0;
  let inProgress = 0;
  let totalReadingTimeMin = 0;
  let quizScoreSum = 0;
  let quizCount = 0;
  let currentCefr = "A1";
  const recentActivity: StudentEbookStats["recentActivity"] = [];

  for (const data of enrollments) {
    const progress = data.completionPercent ?? 0;
    if (progress >= 100) totalCompleted++;
    else if (progress > 0) inProgress++;

    totalReadingTimeMin += data.totalReadingTimeMin ?? 0;
    const scores: number[] = data.quizScores ?? [];
    for (const s of scores) { quizScoreSum += s; quizCount++; }
    if (data.cefrLevel) currentCefr = data.cefrLevel;

    recentActivity.push({
      ebookId: data.ebookId,
      title: data.ebookTitle ?? data.ebookId,
      progress,
      lastReadAt: data.lastReadAt ?? "",
    });
  }

  recentActivity.sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt));

  return {
    studentId,
    totalEnrolled: enrollments.length,
    totalCompleted,
    inProgress,
    totalReadingTimeMin,
    averageQuizScore: quizCount > 0 ? quizScoreSum / quizCount : 0,
    currentCefr,
    recentActivity: recentActivity.slice(0, 10),
  };
}

export async function getSchoolStats(schoolId: string): Promise<{ schoolId: string; students: StudentEbookStats[]; aggregated: Omit<EbookOverviewStats, "topEbooks"> }> {
  const schoolDoc = await safeGetDoc("schools", schoolId);
  const studentIds: string[] = (schoolDoc.exists ? (schoolDoc.data() as any)?.studentIds : null) ?? [];

  const studentStats = await Promise.all(studentIds.slice(0, 200).map(getStudentStats));

  const totalEnrolled = studentStats.reduce((s, st) => s + st.totalEnrolled, 0);
  const totalCompleted = studentStats.reduce((s, st) => s + st.totalCompleted, 0);
  const averageCompletionRate = totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0;

  return {
    schoolId,
    students: studentStats,
    aggregated: {
      totalEbooks: 0,
      totalEnrollments: totalEnrolled,
      totalCompletions: totalCompleted,
      averageCompletionRate,
    },
  };
}
