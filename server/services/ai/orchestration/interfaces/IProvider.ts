export interface ProviderUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface ProviderResponse {
  text: string;
  usage: ProviderUsage;
  latencyMs: number;
  providerName: "openai" | "google" | "vertex";
  modelName: string;
}

export interface ProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  responseFormat?: "text" | "json";
  schema?: any; // responseSchema definition
}

export interface IProvider {
  getProviderName(): "openai" | "google" | "vertex";
  generateContent(prompt: string, options?: ProviderOptions): Promise<ProviderResponse>;
  generateImage?(prompt: string, options?: ProviderOptions): Promise<string>; // returns base64 image URL or URI
}
