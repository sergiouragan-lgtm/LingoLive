import { TutorProviderSelection } from './TutorProviderSelectionPolicy';

export type TutorTaskKind =
  | "realtime-voice-dialogue"
  | "live-text-dialogue"
  | "memory-retrieval"
  | "grammar-feedback"
  | "pronunciation-feedback"
  | "exercise-generation"
  | "session-summary"
  | "weekly-progress-analysis";

export type TutorResponseChannel =
  | "voice"
  | "text"
  | "visual-support"
  | "background-analysis";

export interface TutorExecutionMetadata {
  readonly taskKind: TutorTaskKind;
  readonly responseChannel: TutorResponseChannel;
  readonly hasSufficientMemoryResult: boolean;
  readonly requiresRealtimeResponse: boolean;
  readonly requiresParallelSupport: boolean;
}

export type TutorFallbackMode =
  | "none"
  | "provider-failover"
  | "degraded-text"
  | "resume-from-memory";

export type TutorExecutionPriority =
  | "realtime"
  | "interactive"
  | "background";

export interface TutorExecutionPlan {
  readonly primaryProvider: string; // From selection
  readonly secondaryProvider: string | null; // From selection
  readonly taskKind: TutorTaskKind;
  readonly responseChannel: TutorResponseChannel;
  readonly priority: TutorExecutionPriority;
  readonly fallbackMode: TutorFallbackMode;
  readonly useMemoryDirectly: boolean;
  readonly executeGenerativeDialogue: boolean;
  readonly scheduleParallelSupport: boolean;
  readonly preserveTutorSessionContext: true;
  readonly preserveConversationHistory: true;
  readonly preserveCulturalInstructions: true;
  readonly collectLatencyMetric: true;
  readonly collectProviderMetric: true;
  readonly collectFallbackMetric: true;
  readonly collectCostMetric: true;
}

export function buildExecutionPlan(
  selection: TutorProviderSelection,
  metadata: TutorExecutionMetadata
): TutorExecutionPlan {
  // Consistency checks
  if (metadata.taskKind === "realtime-voice-dialogue" && metadata.responseChannel !== "voice") {
    throw new Error("Invalid configuration: realtime-voice-dialogue must use voice channel");
  }
  if (metadata.taskKind === "memory-retrieval" && !metadata.hasSufficientMemoryResult && selection.useMemoryResponseDirectly) {
     throw new Error("Invalid configuration: memory-retrieval without sufficient result cannot use memory directly");
  }
  if (metadata.taskKind === "memory-retrieval" && selection.allowGenerativeDialogue) {
     throw new Error("Invalid configuration: memory-retrieval cannot use generative dialogue");
  }

  let priority: TutorExecutionPriority = "interactive";
  let fallbackMode: TutorFallbackMode = "provider-failover";

  if (metadata.taskKind === "realtime-voice-dialogue") {
    priority = "realtime";
  } else if (metadata.taskKind === "session-summary" || metadata.taskKind === "weekly-progress-analysis" || metadata.taskKind === "exercise-generation") {
    priority = "background";
  }

  if (metadata.taskKind === "memory-retrieval") {
     fallbackMode = "resume-from-memory";
  } else if (!selection.secondaryProvider) {
     fallbackMode = "none";
  }

  return Object.freeze({
    primaryProvider: selection.primaryProvider,
    secondaryProvider: selection.secondaryProvider,
    taskKind: metadata.taskKind,
    responseChannel: metadata.responseChannel,
    priority,
    fallbackMode,
    useMemoryDirectly: selection.useMemoryResponseDirectly,
    executeGenerativeDialogue: selection.allowGenerativeDialogue,
    scheduleParallelSupport: metadata.requiresParallelSupport,
    preserveTutorSessionContext: true,
    preserveConversationHistory: true,
    preserveCulturalInstructions: true,
    collectLatencyMetric: true,
    collectProviderMetric: true,
    collectFallbackMetric: true,
    collectCostMetric: true,
  });
}
