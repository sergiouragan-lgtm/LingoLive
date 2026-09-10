import { createHash } from "node:crypto";

export const LEARNING_EVENT_SCHEMA_VERSION = "1.0" as const;
export type LearningOutcome = "correct" | "incorrect";
export type LearningSeverity = "none" | "low" | "medium" | "high" | "critical";
export type GapStatus = "active" | "remediating" | "mastered";

export interface LearningEventV1 {
  schemaVersion: typeof LEARNING_EVENT_SCHEMA_VERSION;
  eventType: "ATTEMPT_EVALUATED" | "REASSESSMENT_EVALUATED";
  tenantId: string;
  studentId: string;
  languageCode: string;
  cefrLevel: string;
  activity: { id: string; type: string };
  response: { actual: string; expected?: string };
  target: { type: "grammar" | "vocabulary"; key: string; label: string };
  result: { outcome: LearningOutcome; score: number; confirmed: boolean };
  classification?: { category: "none" | "grammar" | "vocabulary" | "spelling" | "pronunciation" | "semantic"; reason: string; acceptedRegionalVariant?: string; classifiedBy: "server" };
  severity: LearningSeverity;
  occurredAt: string;
  idempotencyKey: string;
}

export interface LearningGapProjection {
  tenantId: string; studentId: string; languageCode: string; cefrLevel: string;
  targetType: "grammar" | "vocabulary"; targetKey: string; label: string;
  status: GapStatus; weaknessScore: number; totalFailures: number; successfulReassessments: number;
  firstObservedAt: string; lastEvidenceAt: string; sourceEventId: string; updatedAt: string;
}

const severityDelta: Record<LearningSeverity, number> = { none: 0, low: 0.1, medium: 0.2, high: 0.3, critical: 0.4 };
const boundedText = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.length <= max;

export function validateLearningEvent(value: unknown): string[] {
  const event = value as Partial<LearningEventV1> | null;
  if (!event || typeof event !== "object") return ["event must be an object"];
  const errors: string[] = [];
  if (event.schemaVersion !== LEARNING_EVENT_SCHEMA_VERSION) errors.push("unsupported schemaVersion");
  if (!event.eventType || !["ATTEMPT_EVALUATED", "REASSESSMENT_EVALUATED"].includes(event.eventType)) errors.push("invalid eventType");
  for (const [field, max] of [["tenantId", 128], ["studentId", 128], ["languageCode", 16], ["cefrLevel", 8], ["idempotencyKey", 128]] as const) if (!boundedText(event[field], max)) errors.push(`invalid ${field}`);
  if (!event.activity || !boundedText(event.activity.id, 128) || !boundedText(event.activity.type, 64)) errors.push("invalid activity");
  if (!event.response || typeof event.response.actual !== "string" || event.response.actual.length > 4000 || (event.response.expected !== undefined && (typeof event.response.expected !== "string" || event.response.expected.length > 4000))) errors.push("invalid response");
  if (!event.target || !["grammar", "vocabulary"].includes(event.target.type) || !boundedText(event.target.key, 128) || !boundedText(event.target.label, 256)) errors.push("invalid target");
  if (!event.result || !["correct", "incorrect"].includes(event.result.outcome) || typeof event.result.score !== "number" || !Number.isFinite(event.result.score) || event.result.score < 0 || event.result.score > 1 || event.result.confirmed !== true) errors.push("invalid confirmed result");
  if (event.classification && (!event.classification.category || !["none", "grammar", "vocabulary", "spelling", "pronunciation", "semantic"].includes(event.classification.category) || !boundedText(event.classification.reason, 128) || event.classification.classifiedBy !== "server" || (event.classification.acceptedRegionalVariant !== undefined && !boundedText(event.classification.acceptedRegionalVariant, 16)))) errors.push("invalid classification");
  if (!event.severity || !Object.hasOwn(severityDelta, event.severity) || (event.result?.outcome === "incorrect" && event.severity === "none")) errors.push("invalid severity");
  const occurredAt = Date.parse(String(event.occurredAt ?? ""));
  if (!Number.isFinite(occurredAt) || occurredAt > Date.now() + 5 * 60_000 || occurredAt < Date.now() - 90 * 24 * 60 * 60_000) errors.push("invalid occurredAt");
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(String(event.idempotencyKey ?? ""))) errors.push("invalid idempotencyKey format");
  return errors;
}

export function stableDocumentId(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\u001f")).digest("hex");
}

export function projectLearningGap(event: LearningEventV1, current?: LearningGapProjection): LearningGapProjection {
  const eventId = stableDocumentId(event.tenantId, event.idempotencyKey);
  const incorrect = event.result.outcome === "incorrect";
  const weaknessScore = incorrect
    ? Math.min(1, (current?.weaknessScore ?? 0) + severityDelta[event.severity])
    : Math.max(0, (current?.weaknessScore ?? 0) - Math.max(0.15, event.result.score * 0.3));
  const successfulReassessments = (current?.successfulReassessments ?? 0) + (!incorrect && event.eventType === "REASSESSMENT_EVALUATED" ? 1 : 0);
  const status: GapStatus = incorrect ? "active" : weaknessScore <= 0.15 && successfulReassessments >= 2 ? "mastered" : "remediating";
  return {
    tenantId: event.tenantId, studentId: event.studentId, languageCode: event.languageCode,
    cefrLevel: event.cefrLevel, targetType: event.target.type, targetKey: event.target.key,
    label: event.target.label, status, weaknessScore: Number(weaknessScore.toFixed(4)),
    totalFailures: (current?.totalFailures ?? 0) + (incorrect ? 1 : 0), successfulReassessments,
    firstObservedAt: current?.firstObservedAt ?? event.occurredAt, lastEvidenceAt: event.occurredAt,
    sourceEventId: eventId, updatedAt: event.occurredAt,
  };
}
