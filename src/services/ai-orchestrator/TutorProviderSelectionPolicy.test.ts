import { describe, it, expect } from 'vitest';
import { selectTutorProvider, TutorProviderSelectionInput } from './TutorProviderSelectionPolicy';

describe('TutorProviderSelectionPolicy', () => {
  it('should select OpenAI for voice', () => {
    const input: TutorProviderSelectionInput = Object.freeze({
      modality: "voice",
      source: "live-dialogue",
      complexity: "adaptive",
      requiresPedagogicalDialogue: true
    });
    const result = selectTutorProvider(input);
    expect(result.primaryProvider).toBe("openai");
    expect(result.secondaryProvider).toBe("gemini");
    expect(result.reason).toBe("voice-pedagogical-dialogue");
  });

  it('should select Gemini for simple memory response', () => {
    const input: TutorProviderSelectionInput = Object.freeze({
      modality: "text",
      source: "memory",
      complexity: "simple",
      requiresPedagogicalDialogue: false
    });
    const result = selectTutorProvider(input);
    expect(result.primaryProvider).toBe("gemini");
    expect(result.secondaryProvider).toBeNull();
    expect(result.reason).toBe("simple-memory-response");
    expect(result.useMemoryResponseDirectly).toBe(true);
  });

  it('should prioritize pedagogical dialogue over simple memory', () => {
    const input: TutorProviderSelectionInput = Object.freeze({
      modality: "text",
      source: "memory",
      complexity: "simple",
      requiresPedagogicalDialogue: true
    });
    const result = selectTutorProvider(input);
    expect(result.primaryProvider).toBe("openai");
    expect(result.useMemoryResponseDirectly).toBe(false);
  });

  it('should be deterministic', () => {
    const input: TutorProviderSelectionInput = Object.freeze({
      modality: "text",
      source: "live-dialogue",
      complexity: "reasoning",
      requiresPedagogicalDialogue: false
    });
    const result1 = selectTutorProvider(input);
    const result2 = selectTutorProvider(input);
    expect(result1).toEqual(result2);
    expect(result1).toEqual(result2); // check deep equality for frozen objects
  });

  it('should be immutable', () => {
    const input: TutorProviderSelectionInput = Object.freeze({
      modality: "text",
      source: "live-dialogue",
      complexity: "adaptive",
      requiresPedagogicalDialogue: false
    });
    const result = selectTutorProvider(input);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(input)).toBe(true);
  });
});
