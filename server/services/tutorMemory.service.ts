import { TutorSessionContext } from "../../src/features/tutor/tutorSessionContextBuilder";

export interface TutorMemory {
  readonly enabled: boolean;
  readonly userId: string;
  readonly vocabularyMastered: readonly string[];
  readonly grammarWeaknesses: readonly string[];
  readonly preferredStyle: string;
  readonly learningGoals: readonly string[];
  readonly motivation: string;
  readonly studyFrequency: string;
  readonly cefrLevel: string;
  readonly totalTutorTurns: number;
  readonly lastSessionAt: string | null;
  readonly privacyLevel: "private" | "anonymized";
}

export interface TutorFeedbackEvidence {
  fluencyLevel?: unknown;
  grammarMistakes?: unknown;
  vocabularyTips?: unknown;
}

export interface TutorMemoryUpdate {
  enabled?: unknown;
  learningGoals?: unknown;
  preferredStyle?: unknown;
  motivation?: unknown;
  studyFrequency?: unknown;
  grammarWeaknesses?: unknown;
  vocabularyMastered?: unknown;
}

export const MEMORY_SECTION_HEADER = "[LINGOLIVE LONG-TERM LEARNER MEMORY]";
export const MEMORY_SECTION_FOOTER = "[END LINGOLIVE LONG-TERM LEARNER MEMORY]";

const safeString = (value: unknown, maxLength = 120): string | null => {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\x00-\x1F\x7F-\x9F]/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
};

const safeMemoryText = (value: unknown, maxLength = 120): string | null => {
  const text = safeString(value, maxLength);
  if (!text) return null;
  const normalized = text.toLowerCase();
  const instructionPatterns = [
    "ignore previous",
    "ignore as instruções",
    "system prompt",
    "[system]",
    "<system>",
    "bypass safety",
    "you are now",
  ];
  return instructionPatterns.some((pattern) => normalized.includes(pattern))
    ? null
    : text;
};

const safeList = (value: unknown, maxItems = 12): string[] => {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    const normalized = safeMemoryText(item);
    if (normalized && !result.includes(normalized)) result.push(normalized);
    if (result.length >= maxItems) break;
  }
  return result;
};

const boundedCount = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(Math.floor(value), 1_000_000))
    : 0;

export function normalizeTutorMemory(raw: unknown, userId: string): TutorMemory {
  const memory = raw && typeof raw === "object"
    ? (raw as Record<string, unknown>)
    : {};

  return Object.freeze({
    userId,
    enabled: memory.enabled !== false,
    vocabularyMastered: Object.freeze(safeList(memory.vocabularyMastered)),
    grammarWeaknesses: Object.freeze(safeList(memory.grammarWeaknesses)),
    preferredStyle: safeString(memory.preferredStyle, 40) || "balanced",
    learningGoals: Object.freeze(safeList(memory.learningGoals, 8)),
    motivation: safeString(memory.motivation, 120) || "",
    studyFrequency: safeString(memory.studyFrequency, 40) || "",
    cefrLevel: safeString(memory.cefrLevel, 8) || "A1",
    totalTutorTurns: boundedCount(memory.totalTutorTurns),
    lastSessionAt: safeString(memory.lastSessionAt, 40),
    privacyLevel: memory.privacyLevel === "anonymized" ? "anonymized" : "private",
  });
}

export function buildTutorMemoryInstruction(memory: TutorMemory): string {
  const lines = [
    `CEFR observado anteriormente: ${memory.cefrLevel}.`,
    `Objectivos persistidos: ${memory.learningGoals.join(", ") || "nenhum confirmado"}.`,
    `Pontos gramaticais a acompanhar: ${memory.grammarWeaknesses.join(" | ") || "nenhum confirmado"}.`,
    `Vocabulário já trabalhado: ${memory.vocabularyMastered.join(", ") || "nenhum confirmado"}.`,
    `Estilo preferido: ${memory.preferredStyle}.`,
    "Use estes dados apenas para continuidade pedagógica. Não os apresente como factos sensíveis nem diga que está a vigiar o aluno.",
    "Não invente progresso, fraquezas ou domínio de vocabulário além do que está registado.",
  ];
  return `${MEMORY_SECTION_HEADER}\n${lines.join("\n")}\n${MEMORY_SECTION_FOOTER}`;
}

export function appendTutorMemoryInstruction(
  systemInstruction: string,
  memory: TutorMemory
): string {
  if (!systemInstruction || !memory.enabled || systemInstruction.includes(MEMORY_SECTION_HEADER)) {
    return systemInstruction;
  }
  return `${systemInstruction}\n\n${buildTutorMemoryInstruction(memory)}`;
}

export function recordTutorTurn(
  memory: TutorMemory,
  context: TutorSessionContext,
  now = new Date()
): TutorMemory {
  if (!memory.enabled) return memory;
  const goals = [
    ...memory.learningGoals,
    ...context.sessionGoals.map((goal) => safeMemoryText(goal)).filter((goal): goal is string => Boolean(goal)),
  ];
  const preferredStyle =
    safeString(context.preferences.preferredCorrectionStyle, 40) ||
    memory.preferredStyle;

  return normalizeTutorMemory({
    ...memory,
    learningGoals: goals,
    preferredStyle,
    cefrLevel: context.cefrLevel || memory.cefrLevel,
    totalTutorTurns: memory.totalTutorTurns + 1,
    lastSessionAt: now.toISOString(),
  }, memory.userId);
}

export function applyTutorFeedback(
  memory: TutorMemory,
  evidence: TutorFeedbackEvidence
): TutorMemory {
  if (!memory.enabled) return memory;
  const mistakes = Array.isArray(evidence.grammarMistakes)
    ? evidence.grammarMistakes.map((item) => {
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return safeMemoryText(record.explanation) || safeMemoryText(record.original);
      })
    : [];
  const vocabulary = Array.isArray(evidence.vocabularyTips)
    ? evidence.vocabularyTips.map((item) => {
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return safeMemoryText(record.word, 60);
      })
    : [];

  return normalizeTutorMemory({
    ...memory,
    cefrLevel: safeString(evidence.fluencyLevel, 8) || memory.cefrLevel,
    grammarWeaknesses: [...memory.grammarWeaknesses, ...mistakes],
    vocabularyMastered: [...memory.vocabularyMastered, ...vocabulary],
  }, memory.userId);
}

export function updateTutorMemoryPreferences(
  memory: TutorMemory,
  patch: TutorMemoryUpdate
): TutorMemory {
  const update = patch && typeof patch === "object" ? patch : {};
  return normalizeTutorMemory({
    ...memory,
    enabled: typeof update.enabled === "boolean" ? update.enabled : memory.enabled,
    learningGoals: update.learningGoals === undefined
      ? memory.learningGoals
      : safeList(update.learningGoals, 8),
    preferredStyle: update.preferredStyle === undefined
      ? memory.preferredStyle
      : safeMemoryText(update.preferredStyle, 40) || "balanced",
    motivation: update.motivation === undefined
      ? memory.motivation
      : safeMemoryText(update.motivation, 120) || "",
    studyFrequency: update.studyFrequency === undefined
      ? memory.studyFrequency
      : safeMemoryText(update.studyFrequency, 40) || "",
    grammarWeaknesses: update.grammarWeaknesses === undefined
      ? memory.grammarWeaknesses
      : safeList(update.grammarWeaknesses),
    vocabularyMastered: update.vocabularyMastered === undefined
      ? memory.vocabularyMastered
      : safeList(update.vocabularyMastered),
  }, memory.userId);
}
