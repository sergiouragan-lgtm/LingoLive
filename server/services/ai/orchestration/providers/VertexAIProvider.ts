import { IProvider, ProviderResponse, ProviderOptions } from "../interfaces/IProvider";
import { AIOrchestrationLogger } from "../utils/Logger";
import { AIProviderError } from "../errors/AIProviderError";

/**
 * Vertex AI is intentionally fail-closed until a real Vertex integration is
 * implemented and validated. Previously this adapter delegated to the Google
 * GenAI provider and then relabelled the response as Vertex, which made
 * provider/model telemetry inaccurate.
 */
export class VertexAIProvider implements IProvider {
  private providerName = "vertex" as const;

  getProviderName(): "openai" | "google" | "vertex" {
    return this.providerName;
  }

  async generateContent(_prompt: string, _options?: ProviderOptions): Promise<ProviderResponse> {
    AIOrchestrationLogger.error(
      "Vertex AI provider requested but no real Vertex integration is configured.",
      undefined,
      "VertexAIProvider"
    );

    throw new AIProviderError(
      "AI_PROVIDER_NOT_CONFIGURED",
      "vertex",
      "Vertex AI integration is not implemented/configured. Refusing to relabel another provider as Vertex.",
      false
    );
  }
}
