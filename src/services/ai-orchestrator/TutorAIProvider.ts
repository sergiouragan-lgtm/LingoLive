export interface TutorAIProvider {
  generateText(prompt: string, context: Record<string, any>, signal?: AbortSignal): Promise<string>;
  generateVoice(text: string, context: Record<string, any>, signal?: AbortSignal): Promise<Blob>;
  healthCheck(): Promise<boolean>;
  providerName: string;
}
