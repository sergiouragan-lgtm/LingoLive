import { GoogleGenAI, Type } from "@google/genai";
import { IProvider, ProviderResponse, ProviderOptions } from "../interfaces/IProvider";
import { AIOrchestrationLogger } from "../utils/Logger";
import { AI_CONFIG } from "../config/AIConfig";
import { AIProviderError, normalizeProviderError } from "../errors/AIProviderError";

export class GoogleGenAIProvider implements IProvider {
  private aiClient: GoogleGenAI | null = null;
  private providerName = "google" as const;

  constructor() {
    const apiKey = AI_CONFIG.providers.google.apiKey;
    if (apiKey) this.aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  getProviderName(): "openai" | "google" | "vertex" {
    return this.providerName;
  }

  async generateContent(prompt: string, options?: ProviderOptions): Promise<ProviderResponse> {
    const start = Date.now();
    const model = options?.model || AI_CONFIG.models.basic.id;
    const temperature = options?.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options?.maxTokens;

    AIOrchestrationLogger.info(`Sending request to Google Gen AI with model: ${model}`);

    if (!AI_CONFIG.providers.google.apiKey || !this.aiClient) {
      throw new AIProviderError("AI_PROVIDER_NOT_CONFIGURED", "google", "GEMINI_API_KEY is not configured.", false);
    }

    try {
      const config: any = {
        temperature,
        systemInstruction: options?.systemInstruction,
      };

      if (maxTokens) {
        config.maxOutputTokens = maxTokens;
      }

      if (options?.responseFormat === "json") {
        config.responseMimeType = "application/json";
        if (options.schema) {
          config.responseSchema = options.schema;
        }
      }

      const response = await this.aiClient.models.generateContent({
        model: model,
        contents: prompt,
        config: config
      });

      const text = response.text || "";
      const latencyMs = Date.now() - start;

      // Estimate usage token counts if metadata doesn't provide them natively
      const promptCharCount = prompt.length + (options?.systemInstruction?.length || 0);
      const completionCharCount = text.length;
      
      const promptTokens = Math.ceil(promptCharCount / 4);
      const completionTokens = Math.ceil(completionCharCount / 4);
      const totalTokens = promptTokens + completionTokens;

      const metadata = AI_CONFIG.models.basic;
      const estimatedCost = 
        ((promptTokens / 1000) * metadata.costPer1kInputTokens) +
        ((completionTokens / 1000) * metadata.costPer1kOutputTokens);

      return {
        text,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCostUsd: estimatedCost,
        },
        latencyMs,
        providerName: this.providerName,
        modelName: model,
      };
    } catch (error: any) {
      AIOrchestrationLogger.error(`Google Gen AI generation failed: ${error.message}`, error, "GoogleGenAIProvider");
      throw normalizeProviderError("google", error);
    }
  }
}
