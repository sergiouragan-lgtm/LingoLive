import { GoogleGenAI, Type } from "@google/genai";
import { IProvider, ProviderResponse, ProviderOptions } from "../interfaces/IProvider";
import { AIOrchestrationLogger } from "../utils/Logger";
import { AI_CONFIG } from "../config/AIConfig";

export class GoogleGenAIProvider implements IProvider {
  private aiClient: GoogleGenAI;
  private providerName = "google" as const;

  constructor() {
    const apiKey = AI_CONFIG.providers.google.apiKey;
    this.aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY", // Fallback for loading without crash
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

    if (!AI_CONFIG.providers.google.apiKey) {
      AIOrchestrationLogger.warn("Google Gen AI API key is missing. Using local mock response for sandbox simulation.");
      return this.generateMockResponse(prompt, model, start);
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
      throw error;
    }
  }

  private generateMockResponse(prompt: string, model: string, start: Date | number): ProviderResponse {
    const latencyMs = Date.now() - Number(start);
    const mockText = `[Simulado - Google Gemini Flash Lite] Obrigado pelo seu prompt: "${prompt.substring(0, 40)}...". Este é um fallback de alta disponibilidade porque não foi configurado um GEMINI_API_KEY no servidor de desenvolvimento.`;
    return {
      text: mockText,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(mockText.length / 4),
        totalTokens: Math.ceil((prompt.length + mockText.length) / 4),
        estimatedCostUsd: 0,
      },
      latencyMs,
      providerName: this.providerName,
      modelName: model,
    };
  }
}
