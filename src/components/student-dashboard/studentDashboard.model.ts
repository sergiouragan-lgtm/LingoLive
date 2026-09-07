import type { Achievement, Language, Proficiency, SavedWord, StreakData } from "../../types";

export type DashboardDataState = "loading" | "empty" | "partial" | "unavailable" | "success";
type UnknownRecord = Record<string, unknown>;

export interface StudentDashboardModel {
  displayName: string;
  targetLanguage: string;
  cefrLevel: string;
  learningGoal?: string;
  dailyGoalMinutes?: number;
  dailyProgressMinutes?: number;
  studyFrequency?: number;
  learningStyle?: string;
  nextClass?: { title: string; time?: string };
  recommendations: Array<{ id: string; label: string }>;
  recentPractice: Array<{ id: string; date: string }>;
  vocabulary: SavedWord[];
  achievements: Achievement[];
  missingCoreFields: string[];
}

function record(value: unknown): UnknownRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function valueOf<T>(value: unknown): T | undefined {
  const candidate = record(value);
  return (candidate && "value" in candidate ? candidate.value : value) as T | undefined;
}

function text(value: unknown): string | undefined {
  const resolved = valueOf<unknown>(value);
  return typeof resolved === "string" && resolved.trim() ? resolved.trim() : undefined;
}

function number(value: unknown): number | undefined {
  const resolved = valueOf<unknown>(value);
  return typeof resolved === "number" && Number.isFinite(resolved) ? resolved : undefined;
}

function labels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [item.trim()];
    const data = record(item);
    const label = text(data?.grammar_or_vocab_item ?? data?.target_item ?? data?.item ?? data?.label);
    return label ? [label] : [];
  });
}

export function buildStudentDashboardModel(input: {
  studentName: string;
  selectedLanguage: Language;
  selectedProficiency: Proficiency;
  streakData: StreakData;
  savedWords: SavedWord[];
  achievements: Achievement[];
  profile?: UnknownRecord;
}): StudentDashboardModel {
  const profile = input.profile;
  const identity = record(profile?.identity);
  const learning = record(profile?.learning);
  const account = record(profile?.account);
  const legacyLanguage = record(profile?.languageProfile);
  const aiPreferences = record(profile?.aiPreferences);
  const recommendationsData = record(profile?.recommendations);
  const nextClassData = record(profile?.nextClass);
  const progress = record(profile?.progress);

  const displayName = text(identity?.preferredDisplayName) ?? text(identity?.fullName) ?? input.studentName;
  const targetLanguage = text(learning?.targetLanguage) ?? text(legacyLanguage?.targetLanguage) ?? input.selectedLanguage.name;
  const cefrLevel = text(learning?.cefrLevel) ?? text(legacyLanguage?.level) ?? input.selectedProficiency;
  const legacyGoals = valueOf<unknown>(legacyLanguage?.goals);
  const learningGoal = labels(legacyGoals)[0];
  const dailyGoalMinutes = number(account?.dailyGoal) ?? number(aiPreferences?.dailyGoal);
  const dailyProgressMinutes = number(profile?.dailyProgressMinutes) ?? number(progress?.todayMinutes);
  const studyFrequency = number(aiPreferences?.studyFrequency);
  const learningStyle = text(learning?.learningStyle) ?? text(legacyLanguage?.learningStyle);
  const nextClassTitle = text(nextClassData?.title);
  const rawGaps = profile?.learningGaps ?? profile?.learning_gaps ?? profile?.weaknesses;
  const gapLabels = labels(rawGaps);
  const learningPath = text(recommendationsData?.learningPath);
  const recommendationLabels = [...gapLabels, ...(learningPath ? [learningPath.replaceAll("_", " ")] : [])];
  const uniqueRecommendations = [...new Set(recommendationLabels)].slice(0, 3);
  const missingCoreFields = [
    displayName ? undefined : "nome",
    targetLanguage ? undefined : "idioma",
    cefrLevel ? undefined : "nível",
    dailyGoalMinutes === undefined ? "objetivo diário" : undefined,
  ].filter((field): field is string => Boolean(field));

  return {
    displayName,
    targetLanguage,
    cefrLevel,
    learningGoal,
    dailyGoalMinutes,
    dailyProgressMinutes,
    studyFrequency,
    learningStyle,
    nextClass: nextClassTitle ? { title: nextClassTitle, time: text(nextClassData?.time) } : undefined,
    recommendations: uniqueRecommendations.map((label, index) => ({ id: `${index}-${label}`, label })),
    recentPractice: (input.streakData.history ?? []).slice(-3).reverse().map((date, index) => ({ id: `${index}-${date}`, date })),
    vocabulary: input.savedWords.slice(0, 4),
    achievements: input.achievements.slice(0, 3),
    missingCoreFields,
  };
}

export function resolveDashboardDataState(requested: DashboardDataState | undefined, profile: UnknownRecord | undefined, model: StudentDashboardModel): DashboardDataState {
  if (requested) return requested;
  if (!profile) return "empty";
  return model.missingCoreFields.length ? "partial" : "success";
}
