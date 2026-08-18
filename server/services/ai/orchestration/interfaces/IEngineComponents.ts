import { UserContext, SchoolContext } from "./IOrchestrator";
import { ProviderResponse } from "./IProvider";

export interface IPromptManager {
  getPrompt(templateName: string, variables: Record<string, any>, version?: string): string;
  registerPrompt(templateName: string, promptText: string, version: string): void;
}

export interface IContextManager {
  compileContext(user: UserContext, school?: SchoolContext, lessonContext?: string): string;
}

export interface MemoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface IConversationMemory {
  getHistory(userId: string, limit?: number): Promise<MemoryMessage[]>;
  saveMessage(userId: string, role: "user" | "assistant", content: string): Promise<void>;
  summarizeHistory(userId: string): Promise<string>;
}

export interface ISafetyModeration {
  isSafe(text: string): Promise<{ safe: boolean; reason?: string }>;
  sanitize(text: string): string;
}

export interface IResponseValidator {
  validate(text: string, schema: any): { valid: boolean; data?: any; error?: string };
}

export interface IUsageTracker {
  logUsage(userId: string, provider: string, model: string, promptTokens: number, completionTokens: number, costUsd: number, latencyMs: number): Promise<void>;
  getAccumulatedUsage(userId: string): Promise<{ totalCostUsd: number; totalRequests: number }>;
  checkRateLimit(userId: string): Promise<boolean>;
}
