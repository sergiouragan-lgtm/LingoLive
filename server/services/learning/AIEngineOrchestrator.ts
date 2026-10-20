import { appendGeoInstruction, buildGeoLinguisticTutorContext } from './geoLinguisticTutorBridge';

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export interface LearningInteractionInput { userId: string; message: string; task?: string; context?: Record<string, unknown>; }
export interface LearningInteractionResult { response: string; evaluation: { completed: boolean; wordsSubmitted: number; lexicalDiversity: number; sentenceComplete: boolean; level: CefrLevel }; progress: { interactions: number; xp: number; lastActivityAt: string }; memory: { lastTask: string; lastLearnerMessage: string; lastTutorResponse: string; recentTopics: string[] }; }
export interface LearnerStateStore { getStudent(userId: string): Promise<Record<string, any> | null>; getMemory(userId: string): Promise<Record<string, any> | null>; saveProgress(userId: string, progress: Record<string, unknown>): Promise<void>; saveMemory(userId: string, memory: Record<string, unknown>): Promise<void>; appendInteraction(interaction: Record<string, unknown>): Promise<void>; }
export type TutorExecutor = (input: Record<string, unknown>) => Promise<string | null>;
const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
function normalizeLevel(value: unknown): CefrLevel { return CEFR_LEVELS.includes(value as CefrLevel) ? (value as CefrLevel) : "A1"; }
function cleanText(value: unknown, maxLength: number): string { if (typeof value !== "string") return ""; return value.trim().replace(/\s+/g, " ").slice(0, maxLength); }
function extractTopics(message: string): string[] { return [...new Set(message.toLocaleLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || [])].slice(0, 5); }
function persistedNumber(value: unknown, field: string): number { const parsed = Number(value); if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`LEARNER_${field}_INVALID`); return parsed; }

export class AIEngineOrchestrator {
  constructor(private readonly store: LearnerStateStore, private readonly executeTutor: TutorExecutor, private readonly now: () => Date = () => new Date()) {}
  async processInteraction(input: LearningInteractionInput): Promise<LearningInteractionResult> {
    const userId = cleanText(input.userId, 128); const message = cleanText(input.message, 4_000); const task = cleanText(input.task, 160) || "conversation-practice";
    if (!userId) throw new Error("AUTHENTICATED_USER_REQUIRED"); if (!message) throw new Error("LEARNER_MESSAGE_REQUIRED");
    const [student, previousMemory] = await Promise.all([this.store.getStudent(userId), this.store.getMemory(userId)]);
    if (!student) throw new Error("LEARNER_PROFILE_NOT_FOUND");
    const level = normalizeLevel(student.level || student.cefrLevel || previousMemory?.level);
    const rawContext = (input.context || {}) as Record<string, any>;
    const languageNative = cleanText(student.languageNative || student.nativeLanguage, 80);
    const languageTarget = cleanText(student.languageTarget || student.targetLanguage || rawContext.languageTarget, 80);
    if (!languageNative || !languageTarget) throw new Error("LEARNER_LANGUAGE_PROFILE_INCOMPLETE");
    const xpSource = student.xp ?? previousMemory?.xp;
    if (xpSource === undefined || xpSource === null) throw new Error("LEARNER_XP_NOT_PERSISTED");
    const xp = persistedNumber(xpSource, "XP");
    const geoContext = buildGeoLinguisticTutorContext({ languageTarget, selectedLanguage: rawContext.selectedLanguage, explicitVariant: rawContext.explicitVariant, deviceLocale: rawContext.deviceLocale, country: rawContext.country, region: rawContext.region, targetRegion: rawContext.targetRegion, localization: rawContext.localization });
    const response = cleanText(await this.executeTutor({ message, userId, level, languageNative, languageTarget, lessonContext: appendGeoInstruction(task, geoContext.instruction), geoSystemInstructions: geoContext.instruction, geoLanguageVariant: geoContext.profile.variant, geoLanguageConfidence: geoContext.profile.confidence, userData: { xp }, age: student.age, learningGoal: student.learningGoal, ...rawContext }), 8_000);
    if (!response) throw new Error("TUTOR_EMPTY_RESPONSE");
    const submittedWords = message.split(/\s+/).filter(Boolean); const wordsSubmitted = submittedWords.length;
    const uniqueWords = new Set(submittedWords.map((word) => word.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, ""))).size;
    const lexicalDiversity = wordsSubmitted ? Math.round((uniqueWords / wordsSubmitted) * 100) : 0; const sentenceComplete = /[.!?]$/.test(message) || wordsSubmitted >= 4;
    const timestamp = this.now().toISOString(); const interactions = Number(previousMemory?.interactions || 0) + 1;
    const recentTopics = [...extractTopics(message), ...(previousMemory?.recentTopics || [])].filter((item, index, all) => typeof item === "string" && all.indexOf(item) === index).slice(0, 12);
    const progress = { interactions, xp, lastActivityAt: timestamp }; const memory = { lastTask: task, lastLearnerMessage: message, lastTutorResponse: response, recentTopics, level, interactions, xp, updatedAt: timestamp };
    await this.store.saveProgress(userId, progress); await this.store.saveMemory(userId, memory); await this.store.appendInteraction({ userId, task, message, response, completed: true, geoLanguageVariant: geoContext.profile.variant, createdAt: timestamp });
    return { response, evaluation: { completed: true, wordsSubmitted, lexicalDiversity, sentenceComplete, level }, progress, memory: { lastTask: memory.lastTask, lastLearnerMessage: memory.lastLearnerMessage, lastTutorResponse: memory.lastTutorResponse, recentTopics: memory.recentTopics } };
  }
}