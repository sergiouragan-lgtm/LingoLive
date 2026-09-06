import { safeGetDoc, safeSetDoc, safeListDocs, safeQueryDocs } from "../firestoreSafe.service";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  awardedAt?: string;
}

export interface StudentGamification {
  studentId: string;
  xp: number;
  level: number;
  streakDays: number;
  lastReadDate: string | null;
  badges: Badge[];
  totalChaptersRead: number;
  totalEbooksCompleted: number;
}

export interface LeaderboardEntry {
  studentId: string;
  displayName: string;
  xp: number;
  level: number;
  badges: number;
}

const XP_PER_CHAPTER = 10;
const XP_PER_COMPLETION = 100;
const XP_PER_STREAK_DAY = 5;

function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

const ALL_BADGES: Omit<Badge, "awardedAt">[] = [
  { id: "first_read", name: "Primeira Leitura", description: "Completou o primeiro capítulo", icon: "📖" },
  { id: "bookworm", name: "Rato de Biblioteca", description: "Completou 10 capítulos", icon: "🐛" },
  { id: "centurion", name: "Centurião", description: "Completou 100 capítulos", icon: "🏛️" },
  { id: "finisher", name: "Finalizador", description: "Concluiu o primeiro e-book", icon: "🎯" },
  { id: "scholar", name: "Académico", description: "Concluiu 5 e-books", icon: "🎓" },
  { id: "polyglot", name: "Políglota", description: "Leu e-books em 3 idiomas diferentes", icon: "🌐" },
  { id: "streak_7", name: "Semana Dedicada", description: "7 dias consecutivos de leitura", icon: "🔥" },
  { id: "streak_30", name: "Mês Imparável", description: "30 dias consecutivos de leitura", icon: "⚡" },
  { id: "speed_reader", name: "Leitor Veloz", description: "Concluiu um e-book em menos de 7 dias", icon: "💨" },
];

async function getGamificationDoc(studentId: string): Promise<StudentGamification> {
  const doc = await safeGetDoc("ebook_gamification", studentId);
  if (doc.exists) return doc.data() as StudentGamification;
  return {
    studentId,
    xp: 0,
    level: 1,
    streakDays: 0,
    lastReadDate: null,
    badges: [],
    totalChaptersRead: 0,
    totalEbooksCompleted: 0,
  };
}

async function computeBadges(
  current: StudentGamification,
  enrollments: any[]
): Promise<Badge[]> {
  const existingIds = new Set(current.badges.map((b) => b.id));
  const newBadges: Badge[] = [...current.badges];
  const now = new Date().toISOString();

  const completedEnrollments = enrollments.filter((e) => (e.completionPercent ?? 0) >= 100);
  const languages = new Set(completedEnrollments.map((e) => e.language).filter(Boolean));

  const shouldAward = (id: string) => !existingIds.has(id);
  const award = (id: string) => {
    if (!shouldAward(id)) return;
    const def = ALL_BADGES.find((b) => b.id === id);
    if (def) {
      newBadges.push({ ...def, awardedAt: now });
      existingIds.add(id);
    }
  };

  if (current.totalChaptersRead >= 1) award("first_read");
  if (current.totalChaptersRead >= 10) award("bookworm");
  if (current.totalChaptersRead >= 100) award("centurion");
  if (current.totalEbooksCompleted >= 1) award("finisher");
  if (current.totalEbooksCompleted >= 5) award("scholar");
  if (languages.size >= 3) award("polyglot");
  if (current.streakDays >= 7) award("streak_7");
  if (current.streakDays >= 30) award("streak_30");

  // Speed reader: any ebook completed within 7 days of enrollment
  for (const e of completedEnrollments) {
    if (e.enrolledAt && e.completedAt) {
      const enrolled = new Date(e.enrolledAt).getTime();
      const completed = new Date(e.completedAt).getTime();
      if ((completed - enrolled) / (1000 * 60 * 60 * 24) <= 7) {
        award("speed_reader");
        break;
      }
    }
  }

  return newBadges;
}

export async function getStudentGamification(studentId: string): Promise<StudentGamification> {
  return getGamificationDoc(studentId);
}

export async function recordChapterRead(
  studentId: string,
  ebookId: string,
  completionPercent: number
): Promise<StudentGamification> {
  const current = await getGamificationDoc(studentId);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Streak update
  let streakDays = current.streakDays;
  if (current.lastReadDate !== todayStr) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    streakDays = current.lastReadDate === yesterdayStr ? streakDays + 1 : 1;
  }

  const totalChaptersRead = current.totalChaptersRead + 1;
  const totalEbooksCompleted =
    completionPercent >= 100
      ? current.totalEbooksCompleted + 1
      : current.totalEbooksCompleted;

  const xpGained =
    XP_PER_CHAPTER +
    (completionPercent >= 100 ? XP_PER_COMPLETION : 0) +
    (current.lastReadDate !== todayStr ? XP_PER_STREAK_DAY : 0);

  const xp = current.xp + xpGained;
  const level = levelFromXp(xp);

  const enrollments = await safeQueryDocs("ebook_enrollments", "studentId", studentId);
  const updated: StudentGamification = {
    ...current,
    xp,
    level,
    streakDays,
    lastReadDate: todayStr,
    totalChaptersRead,
    totalEbooksCompleted,
    badges: [],
  };
  updated.badges = await computeBadges(updated, enrollments);

  await safeSetDoc("ebook_gamification", studentId, updated);
  return updated;
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const allDocs = await safeListDocs("ebook_gamification");
  const sorted = (allDocs as StudentGamification[])
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);

  return sorted.map((g) => ({
    studentId: g.studentId,
    displayName: `Estudante ${g.studentId.slice(0, 6)}`,
    xp: g.xp,
    level: g.level,
    badges: g.badges.length,
  }));
}
