import { GoogleGenAI } from "@google/genai";
import { IProvider, ProviderResponse, ProviderOptions } from "../interfaces/IProvider";
import { AIOrchestrationLogger } from "../utils/Logger";
import { AI_CONFIG } from "../config/AIConfig";
import { AIProviderError, normalizeProviderError } from "../errors/AIProviderError";

export class GoogleGenAIProvider implements IProvider {
  private aiClient: GoogleGenAI | null = null;
  private providerName = "google" as const;

  constructor() {
    const apiKey = AI_CONFIG.providers.google.apiKey;
    if (apiKey) this.aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
  }

  getProviderName(): "openai" | "google" | "vertex" {
    return this.providerName;
  }

  async generateContent(prompt: string, options?: ProviderOptions): Promise<ProviderResponse> {
    const start = Date.now();
    const model = options?.model || AI_CONFIG.models.basic.id;
    const temperature = options?.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options?.maxTokens;
    const systemInstruction = options?.systemInstruction?.trim();

    AIOrchestrationLogger.info(`Sending request to Google Gen AI with model: ${model}`);
    if (!AI_CONFIG.providers.google.apiKey || !this.aiClient) {
      throw new AIProviderError("AI_PROVIDER_NOT_CONFIGURED", "google", "GEMINI_API_KEY is not configured.", false);
    }
    if (!systemInstruction) {
      throw new AIProviderError("AI_POLICY_NOT_CONFIGURED", "google", "A composed system instruction is required for LingoLive AI requests.", false);
    }

    try {
      const config: any = { temperature, systemInstruction };
      if (maxTokens) config.maxOutputTokens = maxTokens;
      if (options?.responseFormat === "json") {
        config.responseMimeType = "application/json";
        if (options.schema) config.responseSchema = options.schema;
      }
      const response = await this.aiClient.models.generateContent({ model, contents: prompt, config });
      const text = response.text || "";
      const latencyMs = Date.now() - start;

      // Do not manufacture token counts from character length. Until the SDK exposes
      // reliable usage metadata here, usage remains unavailable rather than simulated.
      return { text, usage: undefined, latencyMs, providerName: this.providerName, modelName: model };
    } catch (error: any) {
      AIOrchestrationLogger.error(`Google Gen AI generation failed: ${error.message}`, error, "GoogleGenAIProvider");
      throw normalizeProviderError("google", error);
    }
  }
}
