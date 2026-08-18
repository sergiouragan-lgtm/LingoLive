import { AI_CONFIG, ModelMetadata } from "../config/AIConfig";
import { AIOrchestrationLogger } from "../utils/Logger";

export class ModelSelector {
  selectModel(taskType: "basic" | "complex" | "image", promptLength: number): ModelMetadata {
    AIOrchestrationLogger.info(`Selecting optimal model for taskType: ${taskType} | promptLength: ${promptLength} characters`);

    if (taskType === "image") {
      return AI_CONFIG.models.image;
    }

    // Dynamic downgrade for basic text requests to optimize cost, or upgrade to GPT-4o for long-context complex operations
    if (taskType === "basic" && promptLength < 8000) {
      return AI_CONFIG.models.basic;
    }

    if (taskType === "complex" || promptLength >= 8000) {
      // For complex reasoning/coding/math or heavy structures, use complex model
      return AI_CONFIG.models.complex;
    }

    return AI_CONFIG.models.basic;
  }
}
