export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LearningInteractionInput {
  userId: string;
  message: string;
  task?: string;
  context?: Record<string, unknown>;
}

export interface LearningInteractionResult {
  response: string;
  evaluation: { score: number; completed: boolean; wordsSubmitted: number; nextLevel: CefrLevel };
  progress: { interactions: number; xp: number; lastActivityAt: string };
  memory: { lastTask: string; lastLearnerMessage: string; lastTutorResponse: string; recentTopics: string[] };
}

export interface LearnerStateStore {
  getStudent(userId: string): Promise<Record<string, any> | null>;
  getMemory(userId: string): Promise<Record<string, any> | null>;
  saveProgress(userId: string, progress: Record<string, unknown>): Promise<void>;
  saveMemory(userId: string, memory: Record<string, unknown>): Promise<void>;
  appendInteraction(interaction: Record<string, unknown>): Promise<void>;
}

export type TutorExecutor = (input: Record<string, unknown>) => Promise<string | null>;
const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function normalizeLevel(value: unknown): CefrLevel {
  return CEFR_LEVELS.includes(value as CefrLevel) ? (value as CefrLevel) : "A1";
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function extractTopics(message: string): string[] {
  return [...new Set(message.toLocaleLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || [])].slice(0, 5);
}

export class AIEngineOrchestrator {
  constructor(
    private readonly store: LearnerStateStore,
    private readonly executeTutor: TutorExecutor,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async processInteraction(input: LearningInteractionInput): Promise<LearningInteractionResult> {
    const userId = cleanText(input.userId, 128);
    const message = cleanText(input.message, 4_000);
    const task = cleanText(input.task, 160) || "conversation-practice";
    if (!userId) throw new Error("AUTHENTICATED_USER_REQUIRED");
    if (!message) throw new Error("LEARNER_MESSAGE_REQUIRED");

    const [student, previousMemory] = await Promise.all([
      this.store.getStudent(userId),
      this.store.getMemory(userId),
    ]);
    const level = normalizeLevel(student?.level || student?.cefrLevel || previousMemory?.level);
    const response = cleanText(await this.executeTutor({
      message,
      userId,
      level,
      languageNative: student?.languageNative || student?.nativeLanguage || "Portuguese",
      languageTarget: student?.languageTarget || student?.targetLanguage || "English",
      lessonContext: task,
      userData: { xp: Number(student?.xp || previousMemory?.xp || 0), streak: Number(student?.streak || 0) },
      age: student?.age,
      learningGoal: student?.learningGoal,
      ...(input.context || {}),
    }), 8_000);
    if (!response) throw new Error("TUTOR_EMPTY_RESPONSE");

    const wordsSubmitted = message.split(/\s+/).filter(Boolean).length;
    const completed = wordsSubmitted > 0;
    const score = Math.min(100, 45 + Math.min(wordsSubmitted, 25) * 2);
    const xpEarned = completed ? Math.max(5, Math.round(score / 10)) : 0;
    const timestamp = this.now().toISOString();
    const interactions = Number(previousMemory?.interactions || 0) + 1;
    const xp = Number(student?.xp || previousMemory?.xp || 0) + xpEarned;
    const recentTopics = [...extractTopics(message), ...(previousMemory?.recentTopics || [])]
      .filter((item, index, all) => typeof item === "string" && all.indexOf(item) === index)
      .slice(0, 12);
    const progress = { interactions, xp, lastActivityAt: timestamp };
    const memory = {
      lastTask: task, lastLearnerMessage: message, lastTutorResponse: response,
      recentTopics, level, interactions, xp, updatedAt: timestamp,
    };

    await this.store.saveProgress(userId, progress);
    await this.store.saveMemory(userId, memory);
    await this.store.appendInteraction({ userId, task, message, response, score, completed, createdAt: timestamp });

    return {
      response,
      evaluation: { score, completed, wordsSubmitted, nextLevel: level },
      progress,
      memory: { lastTask: memory.lastTask, lastLearnerMessage: memory.lastLearnerMessage, lastTutorResponse: memory.lastTutorResponse, recentTopics: memory.recentTopics },
    };
  }
}
