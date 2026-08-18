import { describe, it, expect } from "vitest";
import {
  createEmptyAvailabilityCache,
  upsertProviderAvailability,
  getProviderAvailability,
  listProviderAvailability,
  removeProviderAvailability,
} from "./ProviderAvailabilityCache";
import { ProviderHealthSnapshot } from "./ProviderHealthMonitor";
import { ProviderCircuitSnapshot } from "./ProviderCircuitBreaker";

describe("ProviderAvailabilityCache - Pure and Immutable", () => {
  const mockHealth: ProviderHealthSnapshot = Object.freeze({
    providerId: "openai",
    status: "healthy",
    averageLatencyMs: 100,
    lastLatencyMs: 100,
    consecutiveFailures: 0,
    consecutiveSuccesses: 10,
    availabilityRatio: 1,
    lastFailureAt: null,
    lastSuccessAt: 1000,
    updatedAt: 1000,
  });

  const mockCircuit: ProviderCircuitSnapshot = Object.freeze({
    providerId: "openai",
    state: "closed",
    openedAt: null,
    nextRetryAt: null,
    failureCount: 0,
    successCount: 10,
    updatedAt: 1000,
  });

  it("1. cache vazio - deve criar corretamente o estado inicial", () => {
    const cache = createEmptyAvailabilityCache();
    expect(cache.entries.size).toBe(0);
    expect(Object.isFrozen(cache)).toBe(true);
  });

  it("2. inserção - deve inserir e retornar uma nova estrutura imutável", () => {
    const cache = createEmptyAvailabilityCache();
    const newCache = upsertProviderAvailability(cache, "openai", mockHealth, mockCircuit, 2000);
    
    expect(newCache).not.toBe(cache);
    expect(newCache.entries.size).toBe(1);
    expect(cache.entries.size).toBe(0); // Garante que o original não foi mutado
    
    const entry = newCache.entries.get("openai");
    expect(entry).toBeDefined();
    expect(entry?.providerId).toBe("openai");
    expect(entry?.updatedAt).toBe(2000);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(newCache)).toBe(true);
  });

  it("3. actualização - deve atualizar e preservar o resto", () => {
    let cache = createEmptyAvailabilityCache();
    cache = upsertProviderAvailability(cache, "gemini", { ...mockHealth, providerId: "gemini" }, { ...mockCircuit, providerId: "gemini" }, 1500);
    cache = upsertProviderAvailability(cache, "openai", mockHealth, mockCircuit, 2000);
    
    const updatedHealth: ProviderHealthSnapshot = { ...mockHealth, status: "degraded", updatedAt: 3000 };
    const nextCache = upsertProviderAvailability(cache, "openai", updatedHealth, mockCircuit, 3000);
    
    expect(nextCache.entries.size).toBe(2);
    expect(nextCache.entries.get("gemini")?.updatedAt).toBe(1500); // Preservado
    expect(nextCache.entries.get("openai")?.health.status).toBe("degraded");
    expect(nextCache.entries.get("openai")?.updatedAt).toBe(3000);
    
    // Original intacto
    expect(cache.entries.get("openai")?.health.status).toBe("healthy");
  });

  it("4. leitura - deve devolver a entry correta e preservar os dados (getProviderAvailability)", () => {
    let cache = createEmptyAvailabilityCache();
    cache = upsertProviderAvailability(cache, "openai", mockHealth, mockCircuit, 2000);
    
    const entry = getProviderAvailability(cache, "openai");
    expect(entry).toBeDefined();
    expect(entry?.providerId).toBe("openai");
    expect(entry?.health).toBe(mockHealth);
    expect(entry?.circuit).toBe(mockCircuit);
    
    const missing = getProviderAvailability(cache, "gemini");
    expect(missing).toBeUndefined();
  });

  it("5. listagem - deve listar todos num array imutável (listProviderAvailability)", () => {
    let cache = createEmptyAvailabilityCache();
    cache = upsertProviderAvailability(cache, "gemini", { ...mockHealth, providerId: "gemini" }, { ...mockCircuit, providerId: "gemini" }, 1500);
    cache = upsertProviderAvailability(cache, "openai", mockHealth, mockCircuit, 2000);
    
    const list = listProviderAvailability(cache);
    expect(list.length).toBe(2);
    expect(Object.isFrozen(list)).toBe(true);
    
    const ids = list.map(l => l.providerId).sort();
    expect(ids).toEqual(["gemini", "openai"]);
  });

  it("6. remoção - deve remover corretamente e devolver uma nova estrutura imutável", () => {
    let cache = createEmptyAvailabilityCache();
    cache = upsertProviderAvailability(cache, "gemini", { ...mockHealth, providerId: "gemini" }, { ...mockCircuit, providerId: "gemini" }, 1500);
    cache = upsertProviderAvailability(cache, "openai", mockHealth, mockCircuit, 2000);
    
    const nextCache = removeProviderAvailability(cache, "gemini");
    expect(nextCache.entries.size).toBe(1);
    expect(nextCache.entries.has("gemini")).toBe(false);
    expect(nextCache.entries.has("openai")).toBe(true);
    
    // Original intacto
    expect(cache.entries.size).toBe(2);
    expect(cache.entries.has("gemini")).toBe(true);
  });

  it("6b. remoção - de chave inexistente deve devolver o proprio cache", () => {
    let cache = createEmptyAvailabilityCache();
    cache = upsertProviderAvailability(cache, "openai", mockHealth, mockCircuit, 2000);
    
    const nextCache = removeProviderAvailability(cache, "gemini");
    expect(nextCache).toBe(cache); 
  });

  it("7. determinismo - mesmo input, mesmo output", () => {
    const cache1 = createEmptyAvailabilityCache();
    const cache2 = createEmptyAvailabilityCache();
    
    const res1 = upsertProviderAvailability(cache1, "openai", mockHealth, mockCircuit, 123);
    const res2 = upsertProviderAvailability(cache2, "openai", mockHealth, mockCircuit, 123);
    
    expect(res1.entries.get("openai")).toEqual(res2.entries.get("openai"));
  });
});
