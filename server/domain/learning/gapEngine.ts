import type { LearningSeverity } from "./learningEvent";

export type LearningErrorCategory = "none" | "grammar" | "vocabulary" | "spelling" | "pronunciation" | "semantic";

export interface LearningActivityDefinition {
  tenantId: string;
  activityId: string;
  activityType: string;
  languageCode: string;
  cefrLevel: string;
  target: { type: "grammar" | "vocabulary"; key: string; label: string };
  expectedAnswers: string[];
  acceptedRegionalAnswers?: Record<string, string[]>;
  errorCategory: Exclude<LearningErrorCategory, "none">;
  errorSeverity: Exclude<LearningSeverity, "none">;
  evaluationMode: "attempt" | "reassessment";
  active: boolean;
}

export interface RawLearningAttempt {
  tenantId: string;
  studentId: string;
  activityId: string;
  actualResponse: string;
  occurredAt: string;
  idempotencyKey: string;
}

export interface ServerClassification {
  outcome: "correct" | "incorrect";
  score: number;
  confirmed: true;
  category: LearningErrorCategory;
  reason: "STANDARD_ANSWER" | "VALID_REGIONAL_VARIANT" | "NO_ACCEPTED_MATCH";
  acceptedRegionalVariant?: string;
  severity: LearningSeverity;
}

const normalize = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("und").replace(/[\s\u00a0]+/g, " ").replace(/[.!?]+$/g, "");
const validText = (value: unknown, max: number, allowBlank = false) => typeof value === "string" && value.length <= max && (allowBlank || value.trim().length > 0);

export function validateRawLearningAttempt(value: unknown): string[] {
  const attempt = value as Partial<RawLearningAttempt> | null;
  if (!attempt || typeof attempt !== "object") return ["attempt must be an object"];
  const errors: string[] = [];
  for (const field of ["tenantId", "studentId", "activityId"] as const) if (!validText(attempt[field], 128)) errors.push(`invalid ${field}`);
  if (!validText(attempt.actualResponse, 4000, true)) errors.push("invalid actualResponse");
  if (!validText(attempt.idempotencyKey, 128) || !/^[A-Za-z0-9._:-]{8,128}$/.test(String(attempt.idempotencyKey ?? ""))) errors.push("invalid idempotencyKey");
  const occurredAt = Date.parse(String(attempt.occurredAt ?? ""));
  if (!Number.isFinite(occurredAt) || occurredAt > Date.now() + 5 * 60_000 || occurredAt < Date.now() - 90 * 24 * 60 * 60_000) errors.push("invalid occurredAt");
  return errors;
}

export function validateActivityDefinition(value: unknown): string[] {
  const definition = value as Partial<LearningActivityDefinition> | null;
  if (!definition || typeof definition !== "object") return ["definition must be an object"];
  const errors: string[] = [];
  for (const field of ["tenantId", "activityId"] as const) if (!validText(definition[field], 128)) errors.push(`invalid ${field}`);
  if (!validText(definition.activityType, 64) || !validText(definition.languageCode, 16) || !validText(definition.cefrLevel, 8)) errors.push("invalid activity metadata");
  if (!definition.target || !["grammar", "vocabulary"].includes(definition.target.type) || !validText(definition.target.key, 128) || !validText(definition.target.label, 256)) errors.push("invalid target");
  if (!Array.isArray(definition.expectedAnswers) || definition.expectedAnswers.length === 0 || definition.expectedAnswers.length > 50 || definition.expectedAnswers.some(answer => !validText(answer, 4000))) errors.push("invalid expectedAnswers");
  if (!definition.errorCategory || !["grammar", "vocabulary", "spelling", "pronunciation", "semantic"].includes(definition.errorCategory)) errors.push("invalid errorCategory");
  if (!definition.errorSeverity || !["low", "medium", "high", "critical"].includes(definition.errorSeverity)) errors.push("invalid errorSeverity");
  if (!definition.evaluationMode || !["attempt", "reassessment"].includes(definition.evaluationMode)) errors.push("invalid evaluationMode");
  if (definition.active !== true) errors.push("inactive activity definition");
  const regional = definition.acceptedRegionalAnswers;
  if (regional !== undefined && (typeof regional !== "object" || Array.isArray(regional) || Object.keys(regional).length > 30 || Object.entries(regional).some(([variant, answers]) => !/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(variant) || !Array.isArray(answers) || answers.length > 50 || answers.some(answer => !validText(answer, 4000))))) errors.push("invalid acceptedRegionalAnswers");
  return errors;
}

export function classifyLearningAttempt(actualResponse: string, definition: LearningActivityDefinition): ServerClassification {
  const actual = normalize(actualResponse);
  if (definition.expectedAnswers.some(answer => normalize(answer) === actual)) {
    return { outcome: "correct", score: 1, confirmed: true, category: "none", reason: "STANDARD_ANSWER", severity: "none" };
  }
  for (const [variant, answers] of Object.entries(definition.acceptedRegionalAnswers ?? {})) {
    if (answers.some(answer => normalize(answer) === actual)) {
      return { outcome: "correct", score: 1, confirmed: true, category: "none", reason: "VALID_REGIONAL_VARIANT", acceptedRegionalVariant: variant, severity: "none" };
    }
  }
  return { outcome: "incorrect", score: 0, confirmed: true, category: definition.errorCategory, reason: "NO_ACCEPTED_MATCH", severity: definition.errorSeverity };
}
