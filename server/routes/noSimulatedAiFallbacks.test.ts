import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("AI core without simulated fallbacks", () => {
  it("throws when providers are not configured and after both providers fail", () => {
    const openai = read("server/services/ai/orchestration/providers/OpenAIProvider.ts");
    const google = read("server/services/ai/orchestration/providers/GoogleGenAIProvider.ts");
    const orchestrator = read("server/services/ai/orchestration/services/AIOrchestratorService.ts");
    expect(openai).toContain("AI_PROVIDER_NOT_CONFIGURED");
    expect(google).toContain("AI_PROVIDER_NOT_CONFIGURED");
    expect(orchestrator).toContain("AI_PROVIDERS_UNAVAILABLE");
    expect(openai).not.toContain("generateMockResponse");
    expect(google).not.toContain("generateMockResponse");
    expect(orchestrator).not.toContain("mock-emergency-model");
  });

  it("never fabricates multilingual, phrase, feedback or Kamba responses", () => {
    const multilingual = read("server/services/ai/MultilingualConversationEngine.ts");
    const routes = read("server/routes/ai.routes.ts");
    expect(multilingual).not.toContain("fallbackResponses");
    expect(multilingual).not.toContain("MOCK_KEY");
    expect(routes).toContain("PHRASE_EXPLANATION_UNAVAILABLE");
    expect(routes).toContain("CONVERSATION_FEEDBACK_UNAVAILABLE");
    expect(routes).toContain("KAMBA_AI_UNAVAILABLE");
    expect(routes).not.toContain("getLocalPhraseExplanation");
    expect(routes).not.toContain("getLocalAngolanResponse");
  });
});
