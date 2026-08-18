import { IProvider } from "../interfaces/IProvider";
import { GoogleGenAIProvider } from "../providers/GoogleGenAIProvider";
import { OpenAIProvider } from "../providers/OpenAIProvider";
import { VertexAIProvider } from "../providers/VertexAIProvider";
import { PromptManager } from "../managers/PromptManager";
import { ContextManager } from "../managers/ContextManager";
import { ConversationMemory } from "../managers/ConversationMemory";
import { SafetyModeration } from "../managers/SafetyModeration";
import { ResponseValidator } from "../managers/ResponseValidator";
import { ModelSelector } from "../managers/ModelSelector";
import { UsageTrackerService } from "../services/UsageTrackerService";
import { AIOrchestratorService } from "../services/AIOrchestratorService";
import { AIOrchestrationLogger } from "../utils/Logger";

export class AIContainer {
  private static instance: AIContainer | null = null;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.bootstrap();
  }

  public static getInstance(): AIContainer {
    if (!AIContainer.instance) {
      AIContainer.instance = new AIContainer();
    }
    return AIContainer.instance;
  }

  private bootstrap() {
    AIOrchestrationLogger.info("Bootstrapping LingoLIVE Enterprise AI Orchestration IoC Container...");

    // 1. Instantiate and Register Providers
    const providers = new Map<string, IProvider>();
    const google = new GoogleGenAIProvider();
    const openai = new OpenAIProvider();
    const vertex = new VertexAIProvider();

    providers.set("google", google);
    providers.set("openai", openai);
    providers.set("vertex", vertex);

    this.services.set("providers", providers);

    // 2. Instantiate and Register Managers
    const promptManager = new PromptManager();
    const contextManager = new ContextManager();
    const conversationMemory = new ConversationMemory();
    const safetyModeration = new SafetyModeration();
    const responseValidator = new ResponseValidator();
    const modelSelector = new ModelSelector();

    this.services.set("promptManager", promptManager);
    this.services.set("contextManager", contextManager);
    this.services.set("conversationMemory", conversationMemory);
    this.services.set("safetyModeration", safetyModeration);
    this.services.set("responseValidator", responseValidator);
    this.services.set("modelSelector", modelSelector);

    // 3. Instantiate and Register Services
    const usageTracker = new UsageTrackerService();
    this.services.set("usageTracker", usageTracker);

    const orchestrator = new AIOrchestratorService(
      providers,
      promptManager,
      contextManager,
      conversationMemory,
      safetyModeration,
      responseValidator,
      usageTracker,
      modelSelector
    );
    this.services.set("orchestrator", orchestrator);

    AIOrchestrationLogger.info("LingoLIVE Enterprise AI Container Bootstrapped Successfully!");
  }

  public get<T>(serviceName: string): T {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service '${serviceName}' is not registered in the LingoLIVE AI Container.`);
    }
    return service as T;
  }
}
export const container = AIContainer.getInstance();
