import { IAIOrchestrator, OrchestrationRequest } from "../interfaces/IOrchestrator";
import { ProviderResponse, IProvider } from "../interfaces/IProvider";
import {
  IPromptManager,
  IContextManager,
  IConversationMemory,
  ISafetyModeration,
  IResponseValidator,
  IUsageTracker
} from "../interfaces/IEngineComponents";
import { ModelSelector } from "../managers/ModelSelector";
import { AIOrchestrationLogger } from "../utils/Logger";
import { AI_CONFIG } from "../config/AIConfig";
import { AIProviderError } from "../errors/AIProviderError";

export class AIOrchestratorService implements IAIOrchestrator {
  constructor(
    private providers: Map<string, IProvider>,
    private promptManager: IPromptManager,
    private contextManager: IContextManager,
    private conversationMemory: IConversationMemory,
    private safetyModeration: ISafetyModeration,
    private responseValidator: IResponseValidator,
    private usageTracker: IUsageTracker,
    private modelSelector: ModelSelector
  ) {}

  async orchestrate(request: OrchestrationRequest): Promise<ProviderResponse> {
    const start = Date.now();
    const userId = request.userContext.userId;

    // 1. Check Rate Limits
    const underLimit = await this.usageTracker.checkRateLimit(userId);
    if (!underLimit) {
      throw new Error("RATE_LIMIT_EXCEEDED: Operação temporariamente bloqueada. Limite de requisições excedido.");
    }

    // 2. Perform Safety Check on Input Prompt
    const inputSafety = await this.safetyModeration.isSafe(request.message);
    if (!inputSafety.safe) {
      throw new Error(`SAFETY_BREACH: Mensagem inadequada. Motivo: ${inputSafety.reason}`);
    }

    const sanitizedInput = this.safetyModeration.sanitize(request.message);

    // 3. Compile context and build the complete Prompt
    const compiledContext = this.contextManager.compileContext(
      request.userContext,
      request.schoolContext,
      request.lessonContext
    );

    // Fetch memory and summarize
    const memorySummary = await this.conversationMemory.summarizeHistory(userId);

    // Retrieve system instructions
    const ageGroup = request.userContext.age <= 12 ? "Infantil" : "Adulto";
    const tone = request.userContext.age <= 12 ? "Divertido" : "Profissional";
    
    const compiledPrompt = this.promptManager.getPrompt("tutor_chat", {
      nativeLanguage: request.userContext.languageNative,
      targetLanguage: request.userContext.languageTarget,
      level: request.userContext.level,
      ageGroup,
      tone,
      schoolContext: request.schoolContext?.schoolName || "LingoLIVE Enterprise",
      additionalInstructions: compiledContext + `\nHistórico Prévio (Sumarizado):\n${memorySummary}`,
      message: sanitizedInput
    });

    // 4. Select the optimal AI model based on payload and rules
    const targetModel = this.modelSelector.selectModel(
      request.options?.schema ? "complex" : "basic",
      compiledPrompt.length
    );

    // 5. Route Call to AI provider with Retries and fallback mechanisms
    let providerResponse: ProviderResponse;
    try {
      providerResponse = await this.callProviderWithRetry(
        targetModel.provider,
        compiledPrompt,
        request.options || {}
      );
    } catch (primaryProviderError: any) {
      AIOrchestrationLogger.warn(
        `Primary provider '${targetModel.provider}' failed. Deploying disaster recovery fallback plan...`
      );

      // Deploy fallback provider
      const fallbackProviderName = AI_CONFIG.providers[targetModel.provider].fallbackProvider || "google";
      try {
        providerResponse = await this.callProviderWithRetry(
          fallbackProviderName,
          compiledPrompt,
          request.options || {}
        );
        AIOrchestrationLogger.info(
          `Disaster recovery successful. Recovered with fallback provider '${fallbackProviderName}'.`
        );
      } catch (fallbackError: any) {
        AIOrchestrationLogger.error(
          `Fallback provider '${fallbackProviderName}' failed as well. No AI response will be fabricated.`,
          fallbackError,
          "AIOrchestratorService"
        );
        throw new AIProviderError(
          "AI_PROVIDERS_UNAVAILABLE",
          `${targetModel.provider},${fallbackProviderName}`,
          "Primary and fallback AI providers are unavailable.",
          true,
          503,
        );
      }
    }

    // 6. Perform Safety Checks on AI Output Response
    const outputSafety = await this.safetyModeration.isSafe(providerResponse.text);
    if (!outputSafety.safe) {
      AIOrchestrationLogger.warn(`AI model generated unsafe content! Redacting content for safety.`);
      providerResponse.text = "A resposta gerada continha termos inadequados para a faixa etária e foi removida por segurança.";
    }

    // 7. Validate Structure format (JSON/Schema)
    if (request.options?.responseFormat === "json" && request.options.schema) {
      const validation = this.responseValidator.validate(providerResponse.text, request.options.schema);
      if (!validation.valid) {
        AIOrchestrationLogger.warn(`Response validation failed! Error: ${validation.error}`);
        throw new AIProviderError("AI_RESPONSE_INVALID", providerResponse.providerName, validation.error || "Invalid structured response.", true, 502);
      }
    }

    // 8. Log Usage and Costs in background
    try {
      await this.usageTracker.logUsage(
        userId,
        providerResponse.providerName,
        providerResponse.modelName,
        providerResponse.usage.promptTokens,
        providerResponse.usage.completionTokens,
        providerResponse.usage.estimatedCostUsd,
        providerResponse.latencyMs
      );
    } catch (e) {
      AIOrchestrationLogger.error("Failed to log usage metrics", e, "AIOrchestratorService");
    }

    // 9. Save Messages into Memory
    try {
      await this.conversationMemory.saveMessage(userId, "user", request.message);
      await this.conversationMemory.saveMessage(userId, "assistant", providerResponse.text);
    } catch (e) {
      AIOrchestrationLogger.error("Failed to save session messages to memory", e, "AIOrchestratorService");
    }

    const duration = Date.now() - start;
    AIOrchestrationLogger.perf("OrchestrateRequest", duration, true);

    return providerResponse;
  }

  private async callProviderWithRetry(
    providerName: "openai" | "google" | "vertex",
    prompt: string,
    options: any
  ): Promise<ProviderResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' is not registered in the orchestrator.`);
    }

    let attempt = 0;
    const maxAttempts = AI_CONFIG.retryStrategy.maxAttempts;
    let delay = AI_CONFIG.retryStrategy.initialDelayMs;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        AIOrchestrationLogger.info(`Executing provider call to '${providerName}' (Attempt ${attempt}/${maxAttempts})...`);
        const response = await provider.generateContent(prompt, options);
        return response;
      } catch (error: any) {
        AIOrchestrationLogger.warn(`Attempt ${attempt} failed with error: ${error.message}.`);
        if (attempt >= maxAttempts) {
          throw error;
        }
        // Exponential Backoff
        AIOrchestrationLogger.info(`Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= AI_CONFIG.retryStrategy.backoffFactor;
      }
    }

    throw new Error(`Provider call failed after ${maxAttempts} attempts.`);
  }
}
