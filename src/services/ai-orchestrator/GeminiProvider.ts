import { TutorAIProvider } from "./TutorAIProvider";

export class GeminiProvider implements TutorAIProvider {
  providerName = "Gemini";

  async generateText(prompt: string, context: Record<string, any>, signal?: AbortSignal): Promise<string> {
    // Wrap existing Gemini call here. For now, a placeholder that simulates it.
    return "Gemini response placeholder";
  }

  async generateVoice(text: string, context: Record<string, any>, signal?: AbortSignal): Promise<Blob> {
    throw new Error("NOT_IMPLEMENTED");
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
