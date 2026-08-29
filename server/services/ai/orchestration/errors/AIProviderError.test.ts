import { describe, expect, it } from "vitest";
import { normalizeProviderError } from "./AIProviderError";

describe("AI provider error classification", () => {
  it("distinguishes authentication, quota and rate limits", () => {
    expect(normalizeProviderError("openai", { status: 401 }).code).toBe("AI_PROVIDER_AUTHENTICATION_FAILED");
    expect(normalizeProviderError("openai", { status: 429, code: "insufficient_quota" }).code).toBe("AI_PROVIDER_QUOTA_EXHAUSTED");
    expect(normalizeProviderError("openai", { status: 429, code: "rate_limit_exceeded" }).code).toBe("AI_PROVIDER_RATE_LIMITED");
  });

  it("classifies access and transport failures without creating content", () => {
    expect(normalizeProviderError("google", { status: 403 }).code).toBe("AI_PROVIDER_ACCESS_DENIED");
    expect(normalizeProviderError("google", new Error("ECONNRESET")).code).toBe("AI_PROVIDER_UNAVAILABLE");
  });
});
