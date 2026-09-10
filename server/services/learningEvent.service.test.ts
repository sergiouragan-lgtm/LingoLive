import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const documents = new Map<string, unknown>();
  const transaction = {
    get: vi.fn(async (ref: { path: string }) => ({ exists: documents.has(ref.path), data: () => documents.get(ref.path) })),
    create: vi.fn(), set: vi.fn(),
  };
  const db = {
    collection: vi.fn((collection: string) => ({ doc: (id: string) => {
      const path = `${collection}/${id}`;
      return { path, get: vi.fn(async () => ({ exists: documents.has(path), data: () => documents.get(path) })) };
    } })),
    runTransaction: vi.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
  };
  return { documents, transaction, db };
});

vi.mock("../config/firebaseAdmin", () => ({ dbAdmin: mocks.db }));

import { LEARNING_EVENT_SCHEMA_VERSION, stableDocumentId, type LearningEventV1 } from "../domain/learning/learningEvent";
import { learningActivityDefinitionId, recordLearningEvent, recordRawLearningAttempt } from "./learningEvent.service";

const makeEvent = (): LearningEventV1 => ({
  schemaVersion: LEARNING_EVENT_SCHEMA_VERSION, eventType: "ATTEMPT_EVALUATED",
  tenantId: "tenant-1", studentId: "student-1", languageCode: "en", cefrLevel: "A2",
  activity: { id: "activity-1", type: "quiz" }, response: { actual: "went", expected: "gone" },
  target: { type: "grammar", key: "past-participle", label: "Past participle" },
  result: { outcome: "incorrect", score: 0, confirmed: true }, severity: "medium",
  occurredAt: new Date().toISOString(), idempotencyKey: "attempt-123:item-1",
});

describe("recordLearningEvent transaction", () => {
  beforeEach(() => { mocks.documents.clear(); vi.clearAllMocks(); });

  it("atomically creates evidence, gap, recommendation and corrective activity", async () => {
    const result = await recordLearningEvent(makeEvent());
    expect(result.duplicate).toBe(false);
    expect(mocks.transaction.create).toHaveBeenCalledOnce();
    expect(mocks.transaction.set).toHaveBeenCalledTimes(3);
  });

  it("returns an idempotent duplicate without projecting the gap again", async () => {
    const eventId = stableDocumentId("tenant-1", "attempt-123:item-1");
    mocks.documents.set(`learning_events/${eventId}`, { schemaVersion: "1.0" });
    const result = await recordLearningEvent(makeEvent());
    expect(result.duplicate).toBe(true);
    expect(mocks.transaction.create).not.toHaveBeenCalled();
    expect(mocks.transaction.set).not.toHaveBeenCalled();
  });

  it("records a successful first attempt without inventing a learning gap", async () => {
    const event = makeEvent();
    event.result = { outcome: "correct", score: 1, confirmed: true };
    event.eventType = "REASSESSMENT_EVALUATED";

    const result = await recordLearningEvent(event);

    expect(result.gap).toBeNull();
    expect(mocks.transaction.create).toHaveBeenCalledOnce();
    expect(mocks.transaction.set).not.toHaveBeenCalled();
  });

  it("classifies raw evidence using the authoritative server definition", async () => {
    const definitionId = learningActivityDefinitionId("tenant-1", "activity-1");
    mocks.documents.set(`learning_activity_definitions/${definitionId}`, {
      tenantId: "tenant-1", activityId: "activity-1", activityType: "cloze", languageCode: "pt", cefrLevel: "B1",
      target: { type: "vocabulary", key: "leave-verb", label: "Verbo sair" }, expectedAnswers: ["sair"],
      acceptedRegionalAnswers: { "pt-AO": ["bazar"] }, errorCategory: "vocabulary", errorSeverity: "medium", evaluationMode: "attempt", active: true,
    });

    await recordRawLearningAttempt({ tenantId: "tenant-1", studentId: "student-1", activityId: "activity-1", actualResponse: "bazar", occurredAt: new Date().toISOString(), idempotencyKey: "attempt-regional-1" });

    expect(mocks.transaction.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      result: expect.objectContaining({ outcome: "correct" }),
      classification: expect.objectContaining({ reason: "VALID_REGIONAL_VARIANT", classifiedBy: "server", acceptedRegionalVariant: "pt-AO" }),
    }));
    expect(mocks.transaction.set).not.toHaveBeenCalled();
  });
});
