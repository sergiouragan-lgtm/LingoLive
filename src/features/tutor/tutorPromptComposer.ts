import { TutorSessionContext, buildTutorSessionContext } from "./tutorSessionContextBuilder";
import {
  buildTutorCulturalInstructions,
  TutorCulturalInstructions,
} from "./tutorCulturalInstructionsBuilder";

export interface ComposeTutorSystemInstructionOptions {
  readonly baseInstruction: string;
  readonly culturalInstructions?: TutorCulturalInstructions | string | null;
  readonly sessionContext?: TutorSessionContext | null;
}

export const CULTURAL_SECTION_HEADER = "[LINGOLIVE CULTURAL AND PEDAGOGICAL CONTEXT]";
export const CULTURAL_SECTION_FOOTER = "[END LINGOLIVE CULTURAL AND PEDAGOGICAL CONTEXT]";

/**
 * Pure, deterministic function that composes the final system instruction for the Gemini AI Tutor.
 * Preserves the base system instruction and appends the serialized cultural/pedagogical instructions
 * within a clearly delimited section header and footer.
 */
export function composeTutorSystemInstruction(
  options: ComposeTutorSystemInstructionOptions
): string {
  if (!options || typeof options !== "object") {
    return "";
  }

  const base = typeof options.baseInstruction === "string" ? options.baseInstruction : "";
  if (!base) {
    return "";
  }

  // Prevent duplicate injection if the section is already present
  if (base.includes(CULTURAL_SECTION_HEADER)) {
    return base;
  }

  let serializedInstructions: string | null = null;

  if (options.culturalInstructions) {
    if (typeof options.culturalInstructions === "string") {
      const trimmed = options.culturalInstructions.trim();
      if (trimmed) {
        serializedInstructions = trimmed;
      }
    } else if (
      typeof options.culturalInstructions === "object" &&
      typeof options.culturalInstructions.serializedInstructions === "string"
    ) {
      const trimmed = options.culturalInstructions.serializedInstructions.trim();
      if (trimmed) {
        serializedInstructions = trimmed;
      }
    }
  } else if (options.sessionContext && typeof options.sessionContext === "object") {
    try {
      const built = buildTutorCulturalInstructions(options.sessionContext);
      if (built && typeof built.serializedInstructions === "string") {
        const trimmed = built.serializedInstructions.trim();
        if (trimmed) {
          serializedInstructions = trimmed;
        }
      }
    } catch (e) {
      serializedInstructions = null;
    }
  }

  if (!serializedInstructions) {
    return base;
  }

  return `${base}\n\n${CULTURAL_SECTION_HEADER}\n${serializedInstructions}\n${CULTURAL_SECTION_FOOTER}`;
}
