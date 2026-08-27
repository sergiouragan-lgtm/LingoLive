export type LearningActivityType =
  | "conversation"
  | "quiz"
  | "pronunciation"
  | "vocabulary"
  | "assessment"
  | "lesson";

export type LearningSkill = "speaking" | "listening" | "reading" | "writing" | "grammar" | "vocabulary";

export interface LearningActivityEvent {
  id: string;
  type: LearningActivityType;
  language: string;
  occurredAt: string;
  durationMinutes: number;
  score?: number;
  skills: LearningSkill[];
}

export interface SkillProgress {
  attempts: number;
  averageScore: number | null;
}

export interface LearningProgress {
  userId: string;
  totalActivities: number;
  totalMinutes: number;
  completedByType: Record<LearningActivityType, number>;
  skills: Record<LearningSkill, SkillProgress>;
  recentEventIds: string[];
  lastActivityAt: string | null;
  lastLanguage: string | null;
}

const ACTIVITY_TYPES: LearningActivityType[] = ["conversation", "quiz", "pronunciation", "vocabulary", "assessment", "lesson"];
const SKILLS: LearningSkill[] = ["speaking", "listening", "reading", "writing", "grammar", "vocabulary"];

const safeNumber = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : 0;

export function normalizeLearningProgress(raw: unknown, userId: string): LearningProgress {
  const data = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const rawTypes = data.completedByType && typeof data.completedByType === "object"
    ? data.completedByType as Record<string, unknown>
    : {};
  const rawSkills = data.skills && typeof data.skills === "object"
    ? data.skills as Record<string, unknown>
    : {};

  return {
    userId,
    totalActivities: Math.floor(safeNumber(data.totalActivities, 0, 1_000_000)),
    totalMinutes: Math.round(safeNumber(data.totalMinutes, 0, 10_000_000) * 10) / 10,
    completedByType: Object.fromEntries(ACTIVITY_TYPES.map((type) => [
      type,
      Math.floor(safeNumber(rawTypes[type], 0, 1_000_000)),
    ])) as Record<LearningActivityType, number>,
    skills: Object.fromEntries(SKILLS.map((skill) => {
      const value = rawSkills[skill] && typeof rawSkills[skill] === "object"
        ? rawSkills[skill] as Record<string, unknown>
        : {};
      const attempts = Math.floor(safeNumber(value.attempts, 0, 1_000_000));
      const average = value.averageScore;
      return [skill, {
        attempts,
        averageScore: typeof average === "number" && Number.isFinite(average)
          ? safeNumber(average, 0, 100)
          : null,
      }];
    })) as Record<LearningSkill, SkillProgress>,
    recentEventIds: Array.isArray(data.recentEventIds)
      ? data.recentEventIds.filter((id): id is string => typeof id === "string" && id.length <= 100).slice(-100)
      : [],
    lastActivityAt: typeof data.lastActivityAt === "string" ? data.lastActivityAt : null,
    lastLanguage: typeof data.lastLanguage === "string" ? data.lastLanguage.slice(0, 30) : null,
  };
}

export function normalizeLearningEvent(raw: unknown): LearningActivityEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (typeof data.id !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(data.id)) return null;
  if (!ACTIVITY_TYPES.includes(data.type as LearningActivityType)) return null;
  const occurredAt = typeof data.occurredAt === "string" && !Number.isNaN(Date.parse(data.occurredAt))
    ? data.occurredAt
    : new Date().toISOString();
  const language = typeof data.language === "string" && data.language.trim()
    ? data.language.trim().slice(0, 30)
    : "unknown";
  const skills = Array.isArray(data.skills)
    ? [...new Set(data.skills.filter((skill): skill is LearningSkill => SKILLS.includes(skill as LearningSkill)))]
    : [];
  const hasScore = typeof data.score === "number" && Number.isFinite(data.score);

  return {
    id: data.id,
    type: data.type as LearningActivityType,
    language,
    occurredAt,
    durationMinutes: Math.round(safeNumber(data.durationMinutes, 0, 600) * 10) / 10,
    ...(hasScore ? { score: Math.round(safeNumber(data.score, 0, 100) * 10) / 10 } : {}),
    skills,
  };
}

export function applyLearningEvent(progress: LearningProgress, event: LearningActivityEvent): LearningProgress {
  if (progress.recentEventIds.includes(event.id)) return progress;
  const skills = { ...progress.skills };
  for (const skill of event.skills) {
    const previous = skills[skill];
    const attempts = previous.attempts + 1;
    const averageScore = event.score === undefined
      ? previous.averageScore
      : previous.averageScore === null
        ? event.score
        : Math.round(((previous.averageScore * previous.attempts + event.score) / attempts) * 10) / 10;
    skills[skill] = { attempts, averageScore };
  }

  return {
    ...progress,
    totalActivities: progress.totalActivities + 1,
    totalMinutes: Math.round((progress.totalMinutes + event.durationMinutes) * 10) / 10,
    completedByType: {
      ...progress.completedByType,
      [event.type]: progress.completedByType[event.type] + 1,
    },
    skills,
    recentEventIds: [...progress.recentEventIds, event.id].slice(-100),
    lastActivityAt: event.occurredAt,
    lastLanguage: event.language,
  };
}
