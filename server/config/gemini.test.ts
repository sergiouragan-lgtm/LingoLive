import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ai, generateContentWithRetry } from "./gemini";

describe("generateContentWithRetry - Unit Tests for Gemini Resilience & Structured Error Classification", () => {
  let generateContentSpy: any;
  let randomSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();
    generateContentSpy = vi.spyOn(ai.models, "generateContent");
    randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // TESTE 1 — SUCESSO IMEDIATO
  it("TESTE 1: Sucesso imediato no modelo primário", async () => {
    const mockResponse = { text: "Success response" } as any;
    generateContentSpy.mockResolvedValueOnce(mockResponse);

    const inputParams = {
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    };

    const promise = generateContentWithRetry(inputParams);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(generateContentSpy).toHaveBeenCalledWith({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
      config: {
        abortSignal: expect.any(AbortSignal),
      },
    });
    expect(result).toBe(mockResponse);
  });

  // TESTE 2 — UM 503 E DEPOIS SUCESSO
  it("TESTE 2: Um erro 503 e depois sucesso no modelo primário", async () => {
    const mockResponse = { text: "Recovered response" } as any;
    generateContentSpy
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce(mockResponse);

    const inputParams = {
      model: "gemini-3.6-flash",
      contents: "Test prompt",
    };

    const promise = generateContentWithRetry(inputParams);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(generateContentSpy.mock.calls[0][0].model).toBe("gemini-3.6-flash");
    expect(generateContentSpy.mock.calls[1][0].model).toBe("gemini-3.6-flash");
    expect(result).toBe(mockResponse);
  });

  // TESTE 3 — PRIMÁRIO ESGOTA E FALLBACK FUNCIONA
  it("TESTE 3: Primário esgota 3 tentativas com 503 e fallback funciona na 4ª chamada", async () => {
    const mockResponse = { text: "Fallback response" } as any;
    generateContentSpy
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce(mockResponse);

    const inputParams = {
      model: "gemini-3.6-flash",
      contents: "Test prompt for fallback",
    };

    const promise = generateContentWithRetry(inputParams);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(4);
    expect(generateContentSpy.mock.calls[0][0].model).toBe("gemini-3.6-flash");
    expect(generateContentSpy.mock.calls[1][0].model).toBe("gemini-3.6-flash");
    expect(generateContentSpy.mock.calls[2][0].model).toBe("gemini-3.6-flash");
    expect(generateContentSpy.mock.calls[3][0].model).toBe("gemini-flash-latest");
    expect(result).toBe(mockResponse);
  });

  // TESTE 4 — PRIMÁRIO E FALLBACK ESGOTAM
  it("TESTE 4: Primário e fallback esgotam todas as 6 tentativas com 503", async () => {
    generateContentSpy.mockRejectedValue(new Error("503 Service Unavailable"));

    const inputParams = {
      model: "gemini-3.6-flash",
      contents: "Prompt that keeps failing",
    };

    let caughtError: any = null;
    const promise = generateContentWithRetry(inputParams).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(6);
    expect(generateContentSpy.mock.calls[0][0].model).toBe("gemini-3.6-flash");
    expect(generateContentSpy.mock.calls[1][0].model).toBe("gemini-3.6-flash");
    expect(generateContentSpy.mock.calls[2][0].model).toBe("gemini-3.6-flash");
    expect(generateContentSpy.mock.calls[3][0].model).toBe("gemini-flash-latest");
    expect(generateContentSpy.mock.calls[4][0].model).toBe("gemini-flash-latest");
    expect(generateContentSpy.mock.calls[5][0].model).toBe("gemini-flash-latest");
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain("503 Service Unavailable");
  });

  // TESTE 5 — ERRO 400
  it("TESTE 5: Erro 400 INVALID_ARGUMENT lança imediatamente sem retry", async () => {
    const error400 = new Error("400 INVALID_ARGUMENT: Bad parameter");
    generateContentSpy.mockRejectedValueOnce(error400);

    const inputParams = { model: "gemini-3.6-flash", contents: "Invalid payload" };

    let caughtError: any = null;
    const promise = generateContentWithRetry(inputParams).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(error400);
  });

  // TESTE 6 — ERRO 401
  it("TESTE 6: Erro 401 UNAUTHENTICATED lança imediatamente sem retry", async () => {
    const error401 = new Error("401 UNAUTHENTICATED: Invalid API key");
    generateContentSpy.mockRejectedValueOnce(error401);

    let caughtError: any = null;
    const promise = generateContentWithRetry({ model: "gemini-3.6-flash", contents: "Test" }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(error401);
  });

  // TESTE 7 — ERRO 403
  it("TESTE 7: Erro 403 PERMISSION_DENIED lança imediatamente sem retry", async () => {
    const error403 = new Error("403 PERMISSION_DENIED: Access forbidden");
    generateContentSpy.mockRejectedValueOnce(error403);

    let caughtError: any = null;
    const promise = generateContentWithRetry({ model: "gemini-3.6-flash", contents: "Test" }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(error403);
  });

  // TESTE 8 — ERRO 404
  it("TESTE 8: Erro 404 NOT_FOUND lança imediatamente sem retry", async () => {
    const error404 = new Error("404 NOT_FOUND: Model not found");
    generateContentSpy.mockRejectedValueOnce(error404);

    let caughtError: any = null;
    const promise = generateContentWithRetry({ model: "gemini-3.6-flash", contents: "Test" }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(error404);
  });

  // TESTE 9 — ERRO 429
  it("TESTE 9: Erro 429 RESOURCE_EXHAUSTED aciona retry", async () => {
    const mockResponse = { text: "Recovered from 429" } as any;
    generateContentSpy
      .mockRejectedValueOnce(new Error("429 RESOURCE_EXHAUSTED: Rate limit exceeded"))
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({ model: "gemini-3.6-flash", contents: "Test 429" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 10 — ERRO 500
  it("TESTE 10: Erro 500 Internal Error aciona retry", async () => {
    const mockResponse = { text: "Recovered from 500" } as any;
    generateContentSpy
      .mockRejectedValueOnce(new Error("500 Internal Server Error"))
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({ model: "gemini-3.6-flash", contents: "Test 500" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 11 — ERRO 504
  it("TESTE 11: Erro 504 Gateway Timeout aciona retry", async () => {
    const mockResponse = { text: "Recovered from 504" } as any;
    generateContentSpy
      .mockRejectedValueOnce(new Error("504 Gateway Timeout"))
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({ model: "gemini-3.6-flash", contents: "Test 504" });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 12 — ERRO NÃO TRANSITÓRIO GENÉRICO
  it("TESTE 12: Erro genérico de validação lança imediatamente sem retry", async () => {
    const genericError = new Error("schema validation failed");
    generateContentSpy.mockRejectedValueOnce(genericError);

    let caughtError: any = null;
    const promise = generateContentWithRetry({ model: "gemini-3.6-flash", contents: "Test schema" }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(genericError);
  });

  // TESTE 13 — PRESERVAÇÃO COMPLETA DO PAYLOAD
  it("TESTE 13: Preservação completa do payload ao transitar para o modelo de fallback", async () => {
    const mockResponse = { text: "Fallback result" } as any;
    generateContentSpy
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce(mockResponse);

    const complexParams = {
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: "Explain quantum mechanics" }] }],
      config: {
        systemInstruction: "You are a quantum physics teacher.",
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const promise = generateContentWithRetry(complexParams as any);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(4);

    const fallbackCallPayload = generateContentSpy.mock.calls[3][0];
    expect(fallbackCallPayload.model).toBe("gemini-flash-latest");
    expect(fallbackCallPayload.contents).toEqual(complexParams.contents);
    expect(fallbackCallPayload.config).toEqual({
      ...complexParams.config,
      abortSignal: expect.any(AbortSignal),
    });
    expect(result).toBe(mockResponse);
  });

  // TESTE 14 — BACKOFF E JITTER
  it("TESTE 14: Cálculo exato dos atrasos de exponential backoff e jitter", async () => {
    generateContentSpy
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce({ text: "Success" });

    const promise = generateContentWithRetry({ model: "gemini-3.6-flash", contents: "Test delays" });

    await vi.advanceTimersByTimeAsync(899);
    expect(generateContentSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(generateContentSpy).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1699);
    expect(generateContentSpy).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(generateContentSpy).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toEqual({ text: "Success" });
  });

  // TESTE 15 — MODELO JÁ É O FALLBACK
  it("TESTE 15: Quando o modelo inicial já é gemini-flash-latest, executa apenas 3 tentativas", async () => {
    generateContentSpy.mockRejectedValue(new Error("503 Service Unavailable"));

    let caughtError: any = null;
    const promise = generateContentWithRetry({
      model: "gemini-flash-latest",
      contents: "Already fallback",
    }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(3);
    expect(generateContentSpy.mock.calls[0][0].model).toBe("gemini-flash-latest");
    expect(generateContentSpy.mock.calls[1][0].model).toBe("gemini-flash-latest");
    expect(generateContentSpy.mock.calls[2][0].model).toBe("gemini-flash-latest");
    expect(caughtError).toBeDefined();
  });

  // TESTE 16 — Mensagem com número incidental 500 não aciona retry (corrigido)
  it("TESTE 16: Mensagem com número incidental 500 não aciona retry", async () => {
    const falsePositiveError = new Error("Validation rule 500 failed");
    generateContentSpy.mockRejectedValueOnce(falsePositiveError);

    let caughtError: any = null;
    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "False positive test",
    }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(falsePositiveError);
  });

  // TESTE 17 — Status estruturado 503 aciona retry mesmo sem código na mensagem (corrigido)
  it("TESTE 17: Status estruturado 503 aciona retry mesmo sem código na mensagem", async () => {
    const structuredError = { status: 503, message: "Service Error" };
    const mockResponse = { text: "Success after structured 503" } as any;

    generateContentSpy
      .mockRejectedValueOnce(structuredError)
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Structured error test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 18 — IMUTABILIDADE DOS PARAMS
  it("TESTE 18: Imutabilidade do objeto de parâmetros original", async () => {
    generateContentSpy
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce({ text: "Success" });

    const originalParams = Object.freeze({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: "Immutable test" }] }],
    });

    const promise = generateContentWithRetry(originalParams as any);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ text: "Success" });
    expect(originalParams.model).toBe("gemini-3.5-flash");
    expect(originalParams.contents).toEqual([{ role: "user", parts: [{ text: "Immutable test" }] }]);
  });

  // TESTE 19 — STATUSCODE NUMÉRICO
  it("TESTE 19: Objeto com statusCode numérico 429 aciona retry", async () => {
    const structured429 = { statusCode: 429, message: "Quota temporarily exceeded" };
    const mockResponse = { text: "Recovered from statusCode 429" } as any;

    generateContentSpy
      .mockRejectedValueOnce(structured429)
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "StatusCode 429 test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 20 — CODE NUMÉRICO COMO STRING
  it("TESTE 20: Objeto com code '504' como string aciona retry", async () => {
    const stringCode504 = { code: "504", message: "Gateway issue" };
    const mockResponse = { text: "Recovered from string code 504" } as any;

    generateContentSpy
      .mockRejectedValueOnce(stringCode504)
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Code string 504 test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 21 — CÓDIGO SIMBÓLICO
  it("TESTE 21: Objeto com código simbólico 'UNAVAILABLE' aciona retry", async () => {
    const symbolicError = { code: "UNAVAILABLE", message: "Service Error" };
    const mockResponse = { text: "Recovered from UNAVAILABLE symbol" } as any;

    generateContentSpy
      .mockRejectedValueOnce(symbolicError)
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Symbolic code test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 22 — CÓDIGO PERMANENTE VENCE MENSAGEM
  it("TESTE 22: Código permanente estruturado (400) vence mensagem que cita 503", async () => {
    const ambigousError = { status: 400, message: "Upstream mentioned HTTP 503" };
    generateContentSpy.mockRejectedValueOnce(ambigousError);

    let caughtError: any = null;
    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Precedence test",
    }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(ambigousError);
  });

  // TESTE 23 — RESPONSE.STATUS
  it("TESTE 23: Objeto com response.status aninhado (503) aciona retry", async () => {
    const nestedResponseError = {
      response: { status: 503 },
      message: "Request failed",
    };
    const mockResponse = { text: "Recovered from response.status 503" } as any;

    generateContentSpy
      .mockRejectedValueOnce(nestedResponseError)
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Nested response.status test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 24 — ERROR.CODE ANINHADO
  it("TESTE 24: Objeto com error.code aninhado (429) aciona retry", async () => {
    const nestedErrorObj = {
      error: { code: 429 },
      message: "Quota issue",
    };
    const mockResponse = { text: "Recovered from error.code 429" } as any;

    generateContentSpy
      .mockRejectedValueOnce(nestedErrorObj)
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Nested error.code test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 25 — ERRO DESCONHECIDO
  it("TESTE 25: Erro com mensagem genérica não reconhecida lança sem retry", async () => {
    const unknownError = { message: "Unexpected SDK failure" };
    generateContentSpy.mockRejectedValueOnce(unknownError);

    let caughtError: any = null;
    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Unknown error test",
    }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(unknownError);
  });

  // TESTE 26 — TEXTO HTTP EXPLÍCITO
  it("TESTE 26: Mensagem com texto HTTP 503 explícito aciona retry", async () => {
    const explicitHttpError = new Error("HTTP 503 Service Unavailable");
    const mockResponse = { text: "Recovered from explicit HTTP 503 text" } as any;

    generateContentSpy
      .mockRejectedValueOnce(explicitHttpError)
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Explicit HTTP 503 test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 27 — NÚMERO INCIDENTAL 503
  it("TESTE 27: Mensagem com número incidental 'Lesson 503 not found' lança sem retry", async () => {
    const incidental503Error = new Error("Lesson 503 not found in curriculum");
    generateContentSpy.mockRejectedValueOnce(incidental503Error);

    let caughtError: any = null;
    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Incidental 503 test",
    }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBe(incidental503Error);
  });

  // TESTE 28 — STRING HIGH DEMAND
  it("TESTE 28: Mensagem com frase 'high demand' aciona retry", async () => {
    const highDemandError = new Error("The model is experiencing high demand");
    const mockResponse = { text: "Recovered from high demand" } as any;

    generateContentSpy
      .mockRejectedValueOnce(highDemandError)
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "High demand phrase test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 29 — SUCESSO ANTES DO TIMEOUT
  it("TESTE 29: Sucesso antes do timeout de 15s resolve normalmente sem abort", async () => {
    const mockResponse = { text: "Fast response" } as any;
    generateContentSpy.mockImplementationOnce(async () => {
      return mockResponse;
    });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Fast test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockResponse);
  });

  // TESTE 30 — TIMEOUT ACIONA ABORT
  it("TESTE 30: Timeout de 15s aciona abort no AbortController e inicia retry", async () => {
    const mockResponse = { text: "Success after timeout" } as any;
    let signalCaptured: AbortSignal | undefined;

    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        signalCaptured = args.config?.abortSignal;
        return new Promise((_, reject) => {
          signalCaptured?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Timeout test",
    });

    await vi.advanceTimersByTimeAsync(15000);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(signalCaptured).toBeDefined();
    expect(signalCaptured?.aborted).toBe(true);
    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 31 — NOVO CONTROLLER POR RETRY
  it("TESTE 31: Novo AbortController e signal criado em cada tentativa de retry", async () => {
    const mockResponse = { text: "Success on attempt 3" } as any;
    const capturedSignals: AbortSignal[] = [];

    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        const signal = args.config?.abortSignal;
        capturedSignals.push(signal);
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
      .mockImplementationOnce(async (args: any) => {
        const signal = args.config?.abortSignal;
        capturedSignals.push(signal);
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
      .mockImplementationOnce(async (args: any) => {
        capturedSignals.push(args.config?.abortSignal);
        return mockResponse;
      });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Multi timeout test",
    });

    await vi.advanceTimersByTimeAsync(15000);
    await vi.advanceTimersByTimeAsync(1000);

    await vi.advanceTimersByTimeAsync(15000);
    await vi.advanceTimersByTimeAsync(2000);

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(capturedSignals.length).toBe(3);
    expect(capturedSignals[0]).not.toBe(capturedSignals[1]);
    expect(capturedSignals[1]).not.toBe(capturedSignals[2]);
    expect(capturedSignals[0].aborted).toBe(true);
    expect(capturedSignals[1].aborted).toBe(true);
    expect(capturedSignals[2].aborted).toBe(false);
    expect(generateContentSpy).toHaveBeenCalledTimes(3);
    expect(result).toBe(mockResponse);
  });

  // TESTE 32 — TIMEOUTS NO PRIMÁRIO ACTIVAM FALLBACK
  it("TESTE 32: Três timeouts no modelo primário ativam modelo de fallback com novo abortSignal", async () => {
    const mockResponse = { text: "Success on fallback model" } as any;
    const capturedModels: string[] = [];
    const capturedSignals: AbortSignal[] = [];

    generateContentSpy.mockImplementation(async (args: any) => {
      capturedModels.push(args.model);
      const signal = args.config?.abortSignal;
      capturedSignals.push(signal);

      if (capturedModels.length <= 3) {
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      }
      return mockResponse;
    });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Primary timeout to fallback test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(4);
    expect(capturedModels).toEqual([
      "gemini-3.6-flash",
      "gemini-3.6-flash",
      "gemini-3.6-flash",
      "gemini-flash-latest",
    ]);
    expect(capturedSignals.slice(0, 3).every((s) => s.aborted)).toBe(true);
    expect(capturedSignals[3].aborted).toBe(false);
    expect(result).toBe(mockResponse);
  });

  // TESTE 33 — TIMEOUTS NOS DOIS MODELOS TERMINAM
  it("TESTE 33: Timeouts em todas as 6 tentativas encerram com erro e 6 aborts sem loop infinito", async () => {
    const capturedSignals: AbortSignal[] = [];

    generateContentSpy.mockImplementation(async (args: any) => {
      const signal = args.config?.abortSignal;
      capturedSignals.push(signal);

      return new Promise((_, reject) => {
        signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "All timeouts test",
    }).catch((err) => {
      caughtError = err;
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(6);
    expect(capturedSignals.length).toBe(6);
    expect(capturedSignals.every((s) => s.aborted)).toBe(true);
    expect(caughtError).toBeDefined();
    expect(caughtError.code).toBe("DEADLINE_EXCEEDED");
  });

  // TESTE 34 — TIMER LIMPO EM SUCESSO
  it("TESTE 34: Timer de timeout é limpo após resposta de sucesso sem disparar abort tardio", async () => {
    let capturedSignal: AbortSignal | undefined;

    generateContentSpy.mockImplementationOnce(async (args: any) => {
      capturedSignal = args.config?.abortSignal;
      return { text: "Fast success" };
    });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Clean timer success test",
    });

    const result = await promise;
    expect(result).toEqual({ text: "Fast success" });

    await vi.advanceTimersByTimeAsync(30000);

    expect(capturedSignal?.aborted).toBe(false);
    expect(generateContentSpy).toHaveBeenCalledTimes(1);
  });

  // TESTE 35 — TIMER LIMPO EM ERRO PERMANENTE
  it("TESTE 35: Timer de timeout é limpo após erro permanente 400 sem disparar abort tardio", async () => {
    let capturedSignal: AbortSignal | undefined;
    const err400 = new Error("400 INVALID_ARGUMENT");

    generateContentSpy.mockImplementationOnce(async (args: any) => {
      capturedSignal = args.config?.abortSignal;
      throw err400;
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Clean timer 400 test",
    }).catch((err) => {
      caughtError = err;
    });

    await promise;
    expect(caughtError).toBe(err400);

    await vi.advanceTimersByTimeAsync(30000);

    expect(capturedSignal?.aborted).toBe(false);
    expect(generateContentSpy).toHaveBeenCalledTimes(1);
  });

  // TESTE 36 — TIMER LIMPO EM ERRO TRANSITÓRIO IMEDIATO
  it("TESTE 36: Timer é limpo ao ocorrer erro 503 imediato antes de iniciar novo timer para retry", async () => {
    const capturedSignals: AbortSignal[] = [];

    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        capturedSignals.push(args.config?.abortSignal);
        throw new Error("503 Service Unavailable");
      })
      .mockImplementationOnce(async (args: any) => {
        capturedSignals.push(args.config?.abortSignal);
        return { text: "Success on attempt 2" };
      });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Clean timer 503 test",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ text: "Success on attempt 2" });
    expect(capturedSignals.length).toBe(2);

    await vi.advanceTimersByTimeAsync(30000);

    expect(capturedSignals[0].aborted).toBe(false);
    expect(capturedSignals[1].aborted).toBe(false);
  });

  // TESTE 37 — PARAMS ORIGINAIS NÃO MUTADOS
  it("TESTE 37: Objeto params original não é mutado com a inclusão de abortSignal", async () => {
    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        const signal = args.config?.abortSignal;
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
      .mockResolvedValueOnce({ text: "Success" });

    const originalConfig = Object.freeze({ temperature: 0.7 });
    const originalParams = Object.freeze({
      model: "gemini-3.6-flash",
      contents: "Immutable params test",
      config: originalConfig,
    });

    const promise = generateContentWithRetry(originalParams as any);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ text: "Success" });
    expect(originalParams.config).toBe(originalConfig);
    expect((originalParams.config as any).abortSignal).toBeUndefined();
  });

  // TESTE 38 — CANCELAMENTO REAL DA PROMISE MOCKADA
  it("TESTE 38: Mock escuta abortSignal e rejeita com AbortError sem pendências no runtime", async () => {
    let abortedLocally = false;

    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        const signal: AbortSignal = args.config?.abortSignal;
        return new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            abortedLocally = true;
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
      .mockResolvedValueOnce({ text: "Success" });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Real signal listener test",
    });

    await vi.advanceTimersByTimeAsync(15000);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(abortedLocally).toBe(true);
    expect(result).toEqual({ text: "Success" });
  });

  // TESTE 39 — LIMITE EXACTO
  it("TESTE 39: Abort não é disparado aos 14999ms, mas é disparado exatamente aos 15000ms", async () => {
    let signalCaptured: AbortSignal | undefined;

    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        signalCaptured = args.config?.abortSignal;
        return new Promise((_, reject) => {
          signalCaptured?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
      .mockResolvedValueOnce({ text: "Success" });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Exact 15000ms boundary test",
    });

    await vi.advanceTimersByTimeAsync(14999);
    expect(signalCaptured?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(signalCaptured?.aborted).toBe(true);

    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toEqual({ text: "Success" });
  });

  // TESTE 40 — BACKOFF CONTINUA INTACTO
  it("TESTE 40: Retry após timeout respeita fórmula exata de exponential backoff e jitter", async () => {
    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        const signal = args.config?.abortSignal;
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
      .mockResolvedValueOnce({ text: "Success after backoff" });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Timeout with backoff test",
    });

    await vi.advanceTimersByTimeAsync(15000);
    expect(generateContentSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(899);
    expect(generateContentSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(generateContentSpy).toHaveBeenCalledTimes(2);

    const result = await promise;
    expect(result).toEqual({ text: "Success after backoff" });
  });

  // TESTE 41 — SEM SIGNAL EXTERNO
  it("TESTE 41: Execução sem signal externo preserva comportamento anterior", async () => {
    const mockResponse = { text: "No signal response" } as any;
    generateContentSpy.mockResolvedValueOnce(mockResponse);

    const result = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Test 41",
    });

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockResponse);
  });

  // TESTE 42 — SIGNAL JÁ ABORTADO
  it("TESTE 42: Signal externo já abortado antes da chamada produz zero chamadas e erro imediato", async () => {
    const controller = new AbortController();
    controller.abort(new Error("Pre-aborted signal"));

    let caughtError: any = null;
    try {
      await generateContentWithRetry(
        { model: "gemini-3.6-flash", contents: "Test 42" },
        { signal: controller.signal }
      );
    } catch (err) {
      caughtError = err;
    }

    expect(generateContentSpy).toHaveBeenCalledTimes(0);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("Pre-aborted signal");
  });

  // TESTE 43 — CANCELAMENTO DURANTE PRIMEIRA TENTATIVA
  it("TESTE 43: Cancelamento do signal externo durante a primeira tentativa interrompe sem retry", async () => {
    const controller = new AbortController();
    let capturedSignal: AbortSignal | undefined;

    generateContentSpy.mockImplementationOnce(async (args: any) => {
      capturedSignal = args.config?.abortSignal;
      return new Promise((_, reject) => {
        capturedSignal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(
      { model: "gemini-3.6-flash", contents: "Test 43" },
      { signal: controller.signal }
    ).catch((err) => {
      caughtError = err;
    });

    await vi.advanceTimersByTimeAsync(5000);
    controller.abort(new Error("External abort at 5s"));

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(capturedSignal?.aborted).toBe(true);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("External abort at 5s");
  });

  // TESTE 44 — CANCELAMENTO DURANTE BACKOFF
  it("TESTE 44: Cancelamento durante o backoff de retry impede a segunda tentativa e limpa o timer", async () => {
    const controller = new AbortController();

    generateContentSpy.mockImplementationOnce(async () => {
      throw new Error("503 Service Unavailable");
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(
      { model: "gemini-3.6-flash", contents: "Test 44" },
      { signal: controller.signal }
    ).catch((err) => {
      caughtError = err;
    });

    // Run until 503 is thrown and backoff starts
    await vi.advanceTimersByTimeAsync(1);
    expect(generateContentSpy).toHaveBeenCalledTimes(1);

    // Abort during backoff
    controller.abort(new Error("Aborted during backoff"));

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("Aborted during backoff");
  });

  // TESTE 45 — TIMEOUT INTERNO CONTINUA TRANSITÓRIO
  it("TESTE 45: Timeout interno de 15s continua transitório e executa retry com sucesso", async () => {
    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        const signal = args.config?.abortSignal;
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
      .mockResolvedValueOnce({ text: "Success on attempt 2 after 15s timeout" });

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Test 45",
    });

    await vi.advanceTimersByTimeAsync(15000);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ text: "Success on attempt 2 after 15s timeout" });
  });

  // TESTE 46 — CANCELAMENTO EXTERNO VENCE TIMEOUT POSTERIOR
  it("TESTE 46: Cancelamento externo aos 10s vence timeout de 15s e não gera retry nem abort tardio", async () => {
    const controller = new AbortController();
    let capturedSignal: AbortSignal | undefined;

    generateContentSpy.mockImplementationOnce(async (args: any) => {
      capturedSignal = args.config?.abortSignal;
      return new Promise((_, reject) => {
        capturedSignal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(
      { model: "gemini-3.6-flash", contents: "Test 46" },
      { signal: controller.signal }
    ).catch((err) => {
      caughtError = err;
    });

    await vi.advanceTimersByTimeAsync(10000);
    controller.abort(new Error("External abort at 10s"));

    await promise;

    // Advance to 15s and beyond to verify no internal timeout or retry occurs
    await vi.advanceTimersByTimeAsync(20000);

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("External abort at 10s");
  });

  // TESTE 47 — TIMEOUT VENCE CANCELAMENTO POSTERIOR
  it("TESTE 47: Timeout de 15s ocorre primeiro, e cancelamento externo durante backoff encerra a operação", async () => {
    const controller = new AbortController();

    generateContentSpy.mockImplementationOnce(async (args: any) => {
      const signal = args.config?.abortSignal;
      return new Promise((_, reject) => {
        signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(
      { model: "gemini-3.6-flash", contents: "Test 47" },
      { signal: controller.signal }
    ).catch((err) => {
      caughtError = err;
    });

    // Advance 15s to trigger internal timeout
    await vi.advanceTimersByTimeAsync(15000);

    // Abort external signal during backoff
    controller.abort(new Error("Aborted after 15s timeout during backoff"));

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("Aborted after 15s timeout during backoff");
  });

  // TESTE 48 — SIGNAL ORIGINAL EM PARAMS.CONFIG
  it("TESTE 48: abortSignal original em params.config é respeitado e params original não é mutado", async () => {
    const configController = new AbortController();
    const originalConfig = Object.freeze({
      temperature: 0.5,
      abortSignal: configController.signal,
    });
    const originalParams = Object.freeze({
      model: "gemini-3.6-flash",
      contents: "Test 48",
      config: originalConfig,
    });

    let capturedSignal: AbortSignal | undefined;
    generateContentSpy.mockImplementationOnce(async (args: any) => {
      capturedSignal = args.config?.abortSignal;
      return new Promise((_, reject) => {
        capturedSignal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(originalParams as any).catch(
      (err) => {
        caughtError = err;
      }
    );

    await vi.advanceTimersByTimeAsync(2000);
    configController.abort(new Error("Config signal aborted"));

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("Config signal aborted");
    expect(originalParams.config).toBe(originalConfig);
    expect(originalParams.config.abortSignal).toBe(configController.signal);
  });

  // TESTE 49 — DOIS SINAIS EXTERNOS
  it("TESTE 49: Suporta opções com signal e params.config.abortSignal simultâneos", async () => {
    const optionsController = new AbortController();
    const configController = new AbortController();

    let capturedSignal: AbortSignal | undefined;
    generateContentSpy.mockImplementationOnce(async (args: any) => {
      capturedSignal = args.config?.abortSignal;
      return new Promise((_, reject) => {
        capturedSignal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(
      {
        model: "gemini-3.6-flash",
        contents: "Test 49",
        config: { abortSignal: configController.signal },
      },
      { signal: optionsController.signal }
    ).catch((err) => {
      caughtError = err;
    });

    await vi.advanceTimersByTimeAsync(1000);
    optionsController.abort(new Error("Options signal aborted"));

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("Options signal aborted");
  });

  // TESTE 50 — SEM LISTENERS ACUMULADOS
  it("TESTE 50: Listeners do signal externo são removidos em cada tentativa sem acumulação", async () => {
    const controller = new AbortController();
    const addListenerSpy = vi.spyOn(controller.signal, "addEventListener");
    const removeListenerSpy = vi.spyOn(controller.signal, "removeEventListener");

    generateContentSpy
      .mockImplementationOnce(async () => {
        throw new Error("503 Service Unavailable");
      })
      .mockResolvedValueOnce({ text: "Success on attempt 2" });

    const promise = generateContentWithRetry(
      { model: "gemini-3.6-flash", contents: "Test 50" },
      { signal: controller.signal }
    );

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ text: "Success on attempt 2" });
    expect(generateContentSpy).toHaveBeenCalledTimes(2);

    // Verify listeners were added and removed symmetrically for both attempts
    expect(addListenerSpy).toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalled();
    expect(addListenerSpy.mock.calls.length).toBe(removeListenerSpy.mock.calls.length);

    addListenerSpy.mockRestore();
    removeListenerSpy.mockRestore();
  });

  // TESTE 51 — TIMEOUT PRIMEIRO, EXTERNAL ABORT ANTES DA REJEIÇÃO
  it("TESTE 51: Timeout ocorre primeiro e externalSignal aborta depois antes da rejeição da Promise", async () => {
    const controller = new AbortController();
    const mockResponse = { text: "Success after timeout with race condition" } as any;
    let rejectAttempt1: (reason?: any) => void;

    generateContentSpy
      .mockImplementationOnce(async (args: any) => {
        const signal = args.config?.abortSignal;
        return new Promise((_, reject) => {
          rejectAttempt1 = reject;
          signal?.addEventListener("abort", () => {
            // Signal aborted, but delay calling rejectAttempt1
          });
        });
      })
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry(
      { model: "gemini-3.6-flash", contents: "Race test 51" },
      { signal: controller.signal }
    );

    // 1. Advance to 15000ms (timeout occurs first)
    await vi.advanceTimersByTimeAsync(15000);

    // 2. Abort externalSignal AFTER timeout, while Promise is still pending
    controller.abort(new Error("External abort after timeout"));

    // 3. Reject attempt 1 with AbortError
    rejectAttempt1!(new Error("The operation was aborted"));

    // 4. Run remaining timers for backoff and attempt 2
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 52 — EXTERNAL ABORT PRIMEIRO, TIMEOUT POSTERIOR
  it("TESTE 52: External abort ocorre aos 10s e timeout de 15s dispara depois antes da rejeição da Promise", async () => {
    const controller = new AbortController();
    let rejectAttempt: (reason?: any) => void;

    generateContentSpy.mockImplementationOnce(async () => {
      return new Promise((_, reject) => {
        rejectAttempt = reject;
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(
      { model: "gemini-3.6-flash", contents: "Race test 52" },
      { signal: controller.signal }
    ).catch((err) => {
      caughtError = err;
    });

    // 1. Advance to 10s and abort externalSignal
    await vi.advanceTimersByTimeAsync(10000);
    controller.abort(new Error("External abort at 10s"));

    // 2. Advance time past 15s to trigger internal timeout timer
    await vi.advanceTimersByTimeAsync(6000);

    // 3. Reject promise
    rejectAttempt!(new Error("The operation was aborted"));

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("External abort at 10s");
  });

  // TESTE 53 — CONFIG SIGNAL PRIMEIRO, EXTERNAL SIGNAL DEPOIS
  it("TESTE 53: params.config.abortSignal aborta primeiro e options.signal aborta depois", async () => {
    const configController = new AbortController();
    const optionsController = new AbortController();
    let rejectAttempt: (reason?: any) => void;

    generateContentSpy.mockImplementationOnce(async () => {
      return new Promise((_, reject) => {
        rejectAttempt = reject;
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(
      {
        model: "gemini-3.6-flash",
        contents: "Race test 53",
        config: { abortSignal: configController.signal },
      },
      { signal: optionsController.signal }
    ).catch((err) => {
      caughtError = err;
    });

    // 1. Abort config signal first
    configController.abort(new Error("Config signal first"));

    // 2. Abort options signal second
    optionsController.abort(new Error("Options signal second"));

    // 3. Reject mock promise
    rejectAttempt!(new Error("The operation was aborted"));

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("Config signal first");
  });

  // TESTE 54 — EXTERNAL SIGNAL PRIMEIRO, CONFIG SIGNAL DEPOIS
  it("TESTE 54: options.signal aborta primeiro e params.config.abortSignal aborta depois", async () => {
    const optionsController = new AbortController();
    const configController = new AbortController();
    let rejectAttempt: (reason?: any) => void;

    generateContentSpy.mockImplementationOnce(async () => {
      return new Promise((_, reject) => {
        rejectAttempt = reject;
      });
    });

    let caughtError: any = null;
    const promise = generateContentWithRetry(
      {
        model: "gemini-3.6-flash",
        contents: "Race test 54",
        config: { abortSignal: configController.signal },
      },
      { signal: optionsController.signal }
    ).catch((err) => {
      caughtError = err;
    });

    // 1. Abort options signal first
    optionsController.abort(new Error("Options signal first"));

    // 2. Abort config signal second
    configController.abort(new Error("Config signal second"));

    // 3. Reject mock promise
    rejectAttempt!(new Error("The operation was aborted"));

    await vi.runAllTimersAsync();
    await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("Options signal first");
  });

  // TESTE 55 — TIMEOUT PRIMEIRO E DOIS SINAIS ABORTAM DEPOIS
  it("TESTE 55: Timeout interno ocorre primeiro, depois ambos os sinais externos abortam", async () => {
    const optionsController = new AbortController();
    const configController = new AbortController();
    const mockResponse = { text: "Success after multi-abort race condition" } as any;
    let rejectAttempt1: (reason?: any) => void;

    generateContentSpy
      .mockImplementationOnce(async () => {
        return new Promise((_, reject) => {
          rejectAttempt1 = reject;
        });
      })
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry(
      {
        model: "gemini-3.6-flash",
        contents: "Race test 55",
        config: { abortSignal: configController.signal },
      },
      { signal: optionsController.signal }
    );

    // 1. Timeout occurs at 15000ms
    await vi.advanceTimersByTimeAsync(15000);

    // 2. Both signals abort afterwards
    optionsController.abort(new Error("Options abort after timeout"));
    configController.abort(new Error("Config abort after timeout"));

    // 3. Reject mock promise
    rejectAttempt1!(new Error("The operation was aborted"));

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  // TESTE 56 — ERRO NORMAL SEM ABORTCAUSE
  it("TESTE 56: Erro 503 imediato sem nenhum abort mantém abortCause null e aciona retry", async () => {
    const mockResponse = { text: "Recovered from immediate 503" } as any;
    generateContentSpy
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
      .mockResolvedValueOnce(mockResponse);

    const promise = generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: "Test 56",
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(generateContentSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });
});
