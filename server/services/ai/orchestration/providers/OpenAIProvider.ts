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
    if (apiKey) this.openai = new OpenAI({ apiKey });
  }

  getProviderName(): "openai" | "google" | "vertex" {
    return this.providerName;
  }

  async generateContent(prompt: string, options?: ProviderOptions): Promise<ProviderResponse> {
    const start = Date.now();
    const model = options?.model || AI_CONFIG.models.complex.id;
    const temperature = options?.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options?.maxTokens || 1000;
    const systemInstruction = options?.systemInstruction?.trim();

    AIOrchestrationLogger.info(`Sending request to OpenAI with model: ${model}`);

    if (!this.openai || !AI_CONFIG.providers.openai.apiKey) {
      throw new AIProviderError("AI_PROVIDER_NOT_CONFIGURED", "openai", "OPENAI_API_KEY is not configured.", false);
    }
    if (!systemInstruction) {
      throw new AIProviderError("AI_POLICY_NOT_CONFIGURED", "openai", "A composed system instruction is required for LingoLive AI requests.", false);
    }

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ];
      const responseFormat: any = options?.responseFormat === "json" ? { type: "json_object" } : undefined;
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: responseFormat,
      });

      const text = completion.choices[0]?.message?.content || "";
      const latencyMs = Date.now() - start;
      const promptTokens = completion.usage?.prompt_tokens;
      const completionTokens = completion.usage?.completion_tokens;
      const totalTokens = completion.usage?.total_tokens;
      const metadata = AI_CONFIG.models.complex;
      const estimatedCost = promptTokens !== undefined && completionTokens !== undefined
        ? ((promptTokens / 1000) * metadata.costPer1kInputTokens) + ((completionTokens / 1000) * metadata.costPer1kOutputTokens)
        : undefined;

      return {
        text,
        usage: promptTokens !== undefined && completionTokens !== undefined && totalTokens !== undefined
          ? { promptTokens, completionTokens, totalTokens, estimatedCostUsd: estimatedCost || 0 }
          : undefined,
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
