import { TutorAIProvider } from "./TutorAIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenAIProvider } from "./OpenAIProvider";

export class AIProviderRouter {
  private providers: Record<string, TutorAIProvider> = {
    gemini: new GeminiProvider(),
    openai: new OpenAIProvider(),
  };

  private primaryProvider = "gemini";

  async generateText(prompt: string, context: Record<string, any>, signal?: AbortSignal): Promise<string> {
    const primary = await this.getPrimaryProvider();
    try {
      return await primary.generateText(prompt, context, signal);
    } catch (error) {
      if (this.isRecoverable(error)) {
        const secondary = this.getProvider('openai');
        if (secondary) {
          try {
            return await secondary.generateText(prompt, context, signal);
          } catch (secondaryError) {
            throw new Error(`Both providers failed. Primary: ${primary.providerName}, Secondary: ${secondary.providerName}`);
          }
        }
      }
      throw error;
    }
  }

  private isRecoverable(error: any): boolean {
    if (error.name === 'AbortError') return false;
    const message = error.message?.toLowerCase() || "";
    return message.includes('timeout') || message.includes('network') || message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504');
  }

  getProvider(name: string): TutorAIProvider | undefined {
    return this.providers[name];
  }

  async getPrimaryProvider(): Promise<TutorAIProvider> {
    return this.providers[this.primaryProvider];
  }
}

export const aiProviderRouter = new AIProviderRouter();
