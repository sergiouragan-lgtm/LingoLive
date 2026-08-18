import { ISafetyModeration } from "../interfaces/IEngineComponents";
import { AI_CONFIG } from "../config/AIConfig";
import { AIOrchestrationLogger } from "../utils/Logger";

export class SafetyModeration implements ISafetyModeration {
  async isSafe(text: string): Promise<{ safe: boolean; reason?: string }> {
    if (!AI_CONFIG.safety.moderationEnabled) {
      return { safe: true };
    }

    const lowerText = text.toLowerCase();

    // 1. Scan for blocked keywords
    if (AI_CONFIG.safety.blockSensitiveKeywords) {
      for (const keyword of AI_CONFIG.safety.sensitiveKeywords) {
        if (lowerText.includes(keyword)) {
          AIOrchestrationLogger.warn(`Safety breach detected! Found sensitive keyword: '${keyword}'`);
          return {
            safe: false,
            reason: `Blocked due to restricted term: '${keyword}'`
          };
        }
      }
    }

    // 2. Scan for offensive language patterns (Regexes or dictionary can be added)
    const dangerousPatterns = [
      /\b(fuc?k|shit|bitch|bastard)\b/i, // Basic English swear words
      /\b(caralho|foder|puta|merda)\b/i, // Basic Portuguese swear words
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) {
        AIOrchestrationLogger.warn(`Safety breach detected! Swear word matched: ${pattern}`);
        return {
          safe: false,
          reason: "Blocked due to inappropriate or offensive language."
        };
      }
    }

    return { safe: true };
  }

  sanitize(text: string): string {
    let sanitized = text;

    // 1. Redact credit cards
    const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    sanitized = sanitized.replace(ccRegex, "[REDACTED_CREDIT_CARD]");

    // 2. Redact social security or general personal identity patterns if needed
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    sanitized = sanitized.replace(emailRegex, "[REDACTED_EMAIL]");

    return sanitized;
  }
}
