export interface ProviderUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface ProviderResponse {
  text: string;
  /** Provider-reported usage only; omitted when reliable metadata is unavailable. */
  usage?: ProviderUsage;
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
  schema?: any;
}

export interface IProvider {
  getProviderName(): "openai" | "google" | "vertex";
  generateContent(prompt: string, options?: ProviderOptions): Promise<ProviderResponse>;
  generateImage?(prompt: string, options?: ProviderOptions): Promise<string>;
}
