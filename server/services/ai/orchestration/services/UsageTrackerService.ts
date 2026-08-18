import { IUsageTracker } from "../interfaces/IEngineComponents";
import { safeAddDoc } from "../../../firestoreSafe.service";
import { AIOrchestrationLogger } from "../utils/Logger";
import { AI_CONFIG } from "../config/AIConfig";

interface UserRateLimitState {
  timestamps: number[];
}

export class UsageTrackerService implements IUsageTracker {
  private inMemoryUsage: Map<string, { totalRequests: number; totalCostUsd: number }> = new Map();
  private rateLimitStates: Map<string, UserRateLimitState> = new Map();

  async logUsage(
    userId: string,
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    costUsd: number,
    latencyMs: number
  ): Promise<void> {
    AIOrchestrationLogger.info(
      `Logging AI Usage: User=${userId} | Provider=${provider} | Model=${model} | ` +
      `Tokens=[In: ${promptTokens}, Out: ${completionTokens}] | Cost=$${costUsd.toFixed(6)} | Latency=${latencyMs}ms`
    );

    // 1. Update in-memory aggregate
    if (!this.inMemoryUsage.has(userId)) {
      this.inMemoryUsage.set(userId, { totalRequests: 0, totalCostUsd: 0 });
    }
    const current = this.inMemoryUsage.get(userId)!;
    current.totalRequests += 1;
    current.totalCostUsd += costUsd;

    // 2. Save detailed log to Firestore asynchronously for compliance and analytics
    try {
      await safeAddDoc("ai_usage_logs", {
        userId,
        provider,
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        costUsd,
        latencyMs,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      AIOrchestrationLogger.warn(
        `Failed to persist detailed usage log to Firestore for user ${userId}. Logging locally. Error: ${error.message}`
      );
    }
  }

  async getAccumulatedUsage(userId: string): Promise<{ totalCostUsd: number; totalRequests: number }> {
    const usage = this.inMemoryUsage.get(userId) || { totalRequests: 0, totalCostUsd: 0 };
    return {
      totalRequests: usage.totalRequests,
      totalCostUsd: usage.totalCostUsd,
    };
  }

  async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    if (!this.rateLimitStates.has(userId)) {
      this.rateLimitStates.set(userId, { timestamps: [] });
    }

    const state = this.rateLimitStates.get(userId)!;
    // Keep only timestamps within last 60 seconds
    state.timestamps = state.timestamps.filter(ts => ts > oneMinuteAgo);

    if (state.timestamps.length >= AI_CONFIG.rateLimits.requestsPerMinute) {
      AIOrchestrationLogger.warn(`Rate limit exceeded for user ${userId}! Requests/min limit: ${AI_CONFIG.rateLimits.requestsPerMinute}`);
      return false;
    }

    // Register current request timestamp
    state.timestamps.push(now);
    return true;
  }
}
