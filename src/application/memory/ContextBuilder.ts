import { UserMemory } from "../../domain/memory/UserMemory";

export class ContextBuilder {
  static buildPromptContext(memory: UserMemory): string {
    return `
      User Profile:
      - Goal: ${memory.learningGoals.join(', ')}
      - Weaknesses: ${memory.grammarWeaknesses.join(', ')}
      - Style: ${memory.preferredStyle}
      - Motivation: ${memory.motivation}
    `;
  }
}
