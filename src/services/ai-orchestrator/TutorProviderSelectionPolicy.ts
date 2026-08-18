export type TutorInteractionModality = "voice" | "text";
export type TutorInteractionSource = "memory" | "live-dialogue";
export type TutorPedagogicalComplexity = "simple" | "adaptive" | "reasoning";

export interface TutorProviderSelectionInput {
  readonly modality: TutorInteractionModality;
  readonly source: TutorInteractionSource;
  readonly complexity: TutorPedagogicalComplexity;
  readonly requiresPedagogicalDialogue: boolean;
}

export type TutorProviderId = "openai" | "gemini";
export type TutorSelectionReason =
  | "voice-pedagogical-dialogue"
  | "simple-memory-response"
  | "adaptive-text-dialogue"
  | "reasoning-text-dialogue";

export interface TutorProviderSelection {
  readonly primaryProvider: TutorProviderId;
  readonly secondaryProvider: TutorProviderId | null;
  readonly reason: TutorSelectionReason;
  readonly allowGenerativeDialogue: boolean;
  readonly useMemoryResponseDirectly: boolean;
}

export function selectTutorProvider(input: TutorProviderSelectionInput): TutorProviderSelection {
  // 1. voice
  if (input.modality === "voice") {
    return Object.freeze({
      primaryProvider: "openai",
      secondaryProvider: "gemini",
      reason: "voice-pedagogical-dialogue",
      allowGenerativeDialogue: true,
      useMemoryResponseDirectly: false,
    });
  }

  // 2. requiresPedagogicalDialogue
  if (input.requiresPedagogicalDialogue) {
    return Object.freeze({
      primaryProvider: "openai",
      secondaryProvider: "gemini",
      reason: "adaptive-text-dialogue",
      allowGenerativeDialogue: true,
      useMemoryResponseDirectly: false,
    });
  }

  // 3. reasoning
  if (input.complexity === "reasoning") {
    return Object.freeze({
      primaryProvider: "openai",
      secondaryProvider: "gemini",
      reason: "reasoning-text-dialogue",
      allowGenerativeDialogue: true,
      useMemoryResponseDirectly: false,
    });
  }

  // 4. adaptive
  if (input.complexity === "adaptive") {
    return Object.freeze({
      primaryProvider: "openai",
      secondaryProvider: "gemini",
      reason: "adaptive-text-dialogue",
      allowGenerativeDialogue: true,
      useMemoryResponseDirectly: false,
    });
  }

  // 5. simple memory
  if (
    input.source === "memory" &&
    input.complexity === "simple" &&
    !input.requiresPedagogicalDialogue
  ) {
    return Object.freeze({
      primaryProvider: "gemini",
      secondaryProvider: null,
      reason: "simple-memory-response",
      allowGenerativeDialogue: false,
      useMemoryResponseDirectly: true,
    });
  }

  // 6. Fallback (safe)
  return Object.freeze({
    primaryProvider: "openai",
    secondaryProvider: "gemini",
    reason: "adaptive-text-dialogue",
    allowGenerativeDialogue: true,
    useMemoryResponseDirectly: false,
  });
}
