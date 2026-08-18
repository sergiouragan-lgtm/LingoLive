import { TutorAIProvider } from "./TutorAIProvider";

export class OpenAIProvider implements TutorAIProvider {
  providerName = "OpenAI";

  async generateText(prompt: string, context: Record<string, any>, signal?: AbortSignal): Promise<string> {
    throw new Error("NOT_IMPLEMENTED");
  }

  async generateVoice(text: string, context: Record<string, any>, signal?: AbortSignal): Promise<Blob> {
    throw new Error("NOT_IMPLEMENTED");
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
