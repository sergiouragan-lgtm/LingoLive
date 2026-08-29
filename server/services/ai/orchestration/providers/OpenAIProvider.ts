import OpenAI from "openai";
import { IProvider, ProviderResponse, ProviderOptions } from "../interfaces/IProvider";
import { AIOrchestrationLogger } from "../utils/Logger";
import { AI_CONFIG } from "../config/AIConfig";
import { AIProviderError, normalizeProviderError } from "../errors/AIProviderError";

export class OpenAIProvider implements IProvider {
  private openai: OpenAI | null = null;
  private providerName = "openai" as const;

  constructor() {
    const apiKey = AI_CONFIG.providers.openai.apiKey;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    }
  }

  getProviderName(): "openai" | "google" | "vertex" {
    return this.providerName;
  }

  async generateContent(prompt: string, options?: ProviderOptions): Promise<ProviderResponse> {
    const start = Date.now();
    const model = options?.model || AI_CONFIG.models.complex.id;
    const temperature = options?.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options?.maxTokens || 1000;

    AIOrchestrationLogger.info(`Sending request to OpenAI with model: ${model}`);

    if (!this.openai || !AI_CONFIG.providers.openai.apiKey) {
      throw new AIProviderError("AI_PROVIDER_NOT_CONFIGURED", "openai", "OPENAI_API_KEY is not configured.", false);
    }

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      
      if (options?.systemInstruction) {
        messages.push({ role: "system", content: options.systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const responseFormat: any = options?.responseFormat === "json" ? { type: "json_object" } : undefined;

      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        response_format: responseFormat,
      });

      const text = completion.choices[0]?.message?.content || "";
      const latencyMs = Date.now() - start;

      const promptTokens = completion.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
      const completionTokens = completion.usage?.completion_tokens || Math.ceil(text.length / 4);
      const totalTokens = promptTokens + completionTokens;

      const metadata = AI_CONFIG.models.complex;
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
      AIOrchestrationLogger.error(`OpenAI generation failed: ${error.message}`, error, "OpenAIProvider");
      throw normalizeProviderError("openai", error);
    }
  }
}
