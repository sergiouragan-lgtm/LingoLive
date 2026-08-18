import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Map legacy or non-standard model names to recommended standard gemini models
const MODEL_MAPPINGS: Record<string, string> = {
  "gemini-1.5-flash": "gemini-3.6-flash",
  "gemini-1.5-pro": "gemini-3.1-pro-preview",
  "gemini-2.0-flash": "gemini-3.6-flash",
  "gemini-2.5-flash": "gemini-3.6-flash",
  "gemini-3.5-flash": "gemini-3.6-flash",
};

/**
 * Private helper to perform structured classification of Gemini API errors.
 */
const isTransientGeminiError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    if (typeof error === "string") {
      return isTransientMessage(error);
    }
    return false;
  }

  const errObj = error as Record<string, unknown>;

  const candidates = [
    errObj.status,
    errObj.statusCode,
    errObj.code,
    (errObj.response as Record<string, unknown> | undefined)?.status,
    (errObj.response as Record<string, unknown> | undefined)?.statusCode,
    (errObj.error as Record<string, unknown> | undefined)?.code,
    (errObj.error as Record<string, unknown> | undefined)?.status,
  ];

  const TRANSIENT_NUMBERS = new Set([429, 500, 503, 504]);
  const PERMANENT_NUMBERS = new Set([400, 401, 403, 404]);

  const TRANSIENT_SYMBOLS = new Set([
    "RESOURCE_EXHAUSTED",
    "INTERNAL",
    "INTERNAL_ERROR",
    "UNAVAILABLE",
    "DEADLINE_EXCEEDED",
    "GATEWAY_TIMEOUT",
  ]);

  const PERMANENT_SYMBOLS = new Set([
    "INVALID_ARGUMENT",
    "UNAUTHENTICATED",
    "PERMISSION_DENIED",
    "NOT_FOUND",
  ]);

  // Check structured properties first
  for (const val of candidates) {
    if (val === undefined || val === null) continue;

    if (typeof val === "number") {
      if (PERMANENT_NUMBERS.has(val)) return false;
      if (TRANSIENT_NUMBERS.has(val)) return true;
    } else if (typeof val === "string") {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10);
        if (PERMANENT_NUMBERS.has(num)) return false;
        if (TRANSIENT_NUMBERS.has(num)) return true;
      }

      const lastSegment = trimmed.split(".").pop()?.toUpperCase() || trimmed.toUpperCase();
      if (PERMANENT_SYMBOLS.has(lastSegment)) return false;
      if (TRANSIENT_SYMBOLS.has(lastSegment)) return true;
    }
  }

  // Fallback to message inspection if no definitive structured code matched
  const messageVal = errObj.message;
  if (typeof messageVal === "string") {
    return isTransientMessage(messageVal);
  }

  return false;
};

function isTransientMessage(message: string): boolean {
  const msg = message.trim().toLowerCase();

  const explicitHttpPattern = /(?:http|status|error)\s*(?:code\s*)?(?::|=|\s)?\s*(503|429|500|504)\b/i;
  const codeWithReasonPattern = /\b(503\s+service unavailable|500\s+internal|504\s+gateway timeout|429\s+resource_exhausted)\b/i;

  if (explicitHttpPattern.test(msg) || codeWithReasonPattern.test(msg)) {
    return true;
  }

  const transientPhrases = [
    "service unavailable",
    "temporarily unavailable",
    "high demand",
    "resource exhausted",
    "rate limit",
    "gateway timeout",
    "deadline exceeded",
    "unavailable",
  ];

  for (const phrase of transientPhrases) {
    if (msg.includes(phrase)) {
      return true;
    }
  }

  return false;
}

const GEMINI_ATTEMPT_TIMEOUT_MS = 15_000;

/**
 * Robust wrapper around ai.models.generateContent with:
 * - Recommended model mapping (e.g. gemini-3.6-flash)
 * - Exponential backoff retry on 503 UNAVAILABLE / 429 Rate Limit / 500 Transient
 * - Secondary fallback model (gemini-flash-latest) if primary model experiences temporary outage
 * - Optional external AbortSignal support
 */
function createAbortError(message = "The operation was aborted", reason?: unknown): Error {
  if (reason instanceof Error) return reason;
  if (reason) return new Error(String(reason));
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }
  const err = new Error(message);
  err.name = "AbortError";
  return err;
}

function delayCancelable(
  ms: number,
  signal1?: AbortSignal,
  signal2?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;

    const onAbort = (e?: Event) => {
      clearTimeout(timer);
      cleanup();
      const target = e?.target as AbortSignal | undefined;
      const reason =
        target?.reason ||
        signal1?.reason ||
        signal2?.reason ||
        createAbortError("The operation was aborted");
      reject(createAbortError("The operation was aborted", reason));
    };

    const cleanup = () => {
      if (signal1) signal1.removeEventListener("abort", onAbort);
      if (signal2) signal2.removeEventListener("abort", onAbort);
    };

    timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    if (signal1) signal1.addEventListener("abort", onAbort, { once: true });
    if (signal2) signal2.addEventListener("abort", onAbort, { once: true });
  });
}

type AbortCause =
  | { type: "timeout"; reason: unknown }
  | { type: "external"; reason: unknown }
  | { type: "config"; reason: unknown }
  | null;

export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetriesOrOptions?: number | { signal?: AbortSignal },
  optionsParam?: { signal?: AbortSignal }
): Promise<GenerateContentResponse> {
  let maxRetries = 3;
  let options: { signal?: AbortSignal } | undefined = optionsParam;

  if (typeof maxRetriesOrOptions === "number") {
    maxRetries = maxRetriesOrOptions;
  } else if (typeof maxRetriesOrOptions === "object" && maxRetriesOrOptions !== null) {
    options = maxRetriesOrOptions;
  }

  const externalSignal = options?.signal;
  const configSignal = params.config?.abortSignal;

  // Pre-invocation abort check
  if (externalSignal?.aborted) {
    throw createAbortError("The operation was aborted", externalSignal.reason);
  }
  if (configSignal?.aborted) {
    throw createAbortError("The operation was aborted", configSignal.reason);
  }

  let modelName = params.model || "gemini-3.6-flash";
  if (MODEL_MAPPINGS[modelName]) {
    modelName = MODEL_MAPPINGS[modelName];
  }

  const modelsToTry = [modelName];
  if (modelName !== "gemini-flash-latest") {
    modelsToTry.push("gemini-flash-latest");
  }

  let lastError: unknown = null;

  for (const currentModel of modelsToTry) {
    let attempt = 0;
    while (attempt < maxRetries) {
      const attemptController = new AbortController();
      let abortCause: AbortCause = null;

      const registerAbortCause = (
        type: "timeout" | "external" | "config",
        reason: unknown
      ): boolean => {
        if (abortCause !== null) {
          return false;
        }
        abortCause = { type, reason };
        return true;
      };

      const timer = setTimeout(() => {
        const timeoutErr = new DOMException(
          "Gateway Timeout: Gemini request exceeded attempt limit of 15000ms",
          "TimeoutError"
        );
        if (registerAbortCause("timeout", timeoutErr)) {
          attemptController.abort(timeoutErr);
        }
      }, GEMINI_ATTEMPT_TIMEOUT_MS);

      const onExternalAbort = (e?: Event) => {
        const targetSignal = e?.target as AbortSignal | undefined;
        const reason =
          targetSignal?.reason ||
          externalSignal?.reason ||
          createAbortError("The operation was aborted");
        if (registerAbortCause("external", reason)) {
          attemptController.abort(reason);
        }
      };

      const onConfigAbort = (e?: Event) => {
        const targetSignal = e?.target as AbortSignal | undefined;
        const reason =
          targetSignal?.reason ||
          configSignal?.reason ||
          createAbortError("The operation was aborted");
        if (registerAbortCause("config", reason)) {
          attemptController.abort(reason);
        }
      };

      if (externalSignal?.aborted) {
        onExternalAbort();
      } else if (externalSignal) {
        externalSignal.addEventListener("abort", onExternalAbort, { once: true });
      }

      if (configSignal?.aborted) {
        onConfigAbort();
      } else if (configSignal) {
        configSignal.addEventListener("abort", onConfigAbort, { once: true });
      }

      try {
        const existingConfig = params.config || {};
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
          config: {
            ...existingConfig,
            abortSignal: attemptController.signal,
          },
        });
        return response;
      } catch (err: unknown) {
        if (abortCause?.type === "external" || abortCause?.type === "config") {
          throw createAbortError("The operation was aborted", abortCause.reason);
        }

        let processedErr = err;
        if (abortCause?.type === "timeout") {
          processedErr = {
            code: "DEADLINE_EXCEEDED",
            status: 504,
            message: "Gateway Timeout: Gemini request exceeded attempt limit of 15000ms",
          };
        }

        lastError = processedErr;
        const isTransient = isTransientGeminiError(processedErr);

        if (!isTransient) {
          throw processedErr;
        }

        attempt++;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 400 + Math.random() * 200;
          await delayCancelable(delay, externalSignal, configSignal);
        }
      } finally {
        clearTimeout(timer);
        if (externalSignal) {
          externalSignal.removeEventListener("abort", onExternalAbort);
        }
        if (configSignal) {
          configSignal.removeEventListener("abort", onConfigAbort);
        }
      }
    }
  }

  throw lastError;
}

