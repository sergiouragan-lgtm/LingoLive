export class AIProviderError extends Error {
  constructor(
    public readonly code: string,
    public readonly provider: string,
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export function normalizeProviderError(provider: string, error: any): AIProviderError {
  if (error instanceof AIProviderError) return error;
  const status = Number(error?.status || error?.statusCode) || undefined;
  const rawCode = String(error?.code || error?.error?.code || "").toLowerCase();
  const message = String(error?.message || "AI provider request failed");
  if (status === 401 || rawCode.includes("invalid_api_key")) return new AIProviderError("AI_PROVIDER_AUTHENTICATION_FAILED", provider, message, false, status);
  if (rawCode.includes("insufficient_quota") || message.toLowerCase().includes("quota")) return new AIProviderError("AI_PROVIDER_QUOTA_EXHAUSTED", provider, message, false, status);
  if (status === 429 || rawCode.includes("rate_limit")) return new AIProviderError("AI_PROVIDER_RATE_LIMITED", provider, message, true, status);
  if (status === 403 || rawCode.includes("model_not_found")) return new AIProviderError("AI_PROVIDER_ACCESS_DENIED", provider, message, false, status);
  return new AIProviderError("AI_PROVIDER_UNAVAILABLE", provider, message, true, status);
}
