import { describe, it, expect } from "vitest";
import {
  createInitialCircuit,
  evaluateCircuit,
  shouldOpenCircuit,
  shouldHalfOpenCircuit,
  shouldCloseCircuit,
  ProviderCircuitSnapshot,
  CircuitBreakerThresholds,
} from "./ProviderCircuitBreaker";

describe("ProviderCircuitBreaker - Pure and Deterministic", () => {
  const thresholds: CircuitBreakerThresholds = {
    maxFailures: 3,
    retryAfterMs: 60000,
    successesToClose: 2,
  };

  it("1. deve criar o estado inicial corretamente (fechado)", () => {
    const snapshot = createInitialCircuit("openai", 1000);
    expect(snapshot.providerId).toBe("openai");
    expect(snapshot.state).toBe("closed");
    expect(snapshot.failureCount).toBe(0);
    expect(snapshot.successCount).toBe(0);
    expect(snapshot.updatedAt).toBe(1000);
  });

  it("2. circuito fechado - falhas incrementam mas não abrem abaixo do limite", () => {
    const initial = createInitialCircuit("openai", 1000);
    const step1 = evaluateCircuit(initial, thresholds, false, 1100);
    expect(step1.state).toBe("closed");
    expect(step1.failureCount).toBe(1);

    const step2 = evaluateCircuit(step1, thresholds, false, 1200);
    expect(step2.state).toBe("closed");
    expect(step2.failureCount).toBe(2);
  });

  it("3. circuito deve abrir ao atingir maxFailures", () => {
    let snapshot = createInitialCircuit("openai", 1000);
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1100);
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1200);
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1300);

    expect(snapshot.state).toBe("open");
    expect(snapshot.openedAt).toBe(1300);
    expect(snapshot.nextRetryAt).toBe(1300 + 60000);
    expect(snapshot.failureCount).toBe(3);
  });

  it("4. deve transitar para half-open após retryAfter", () => {
    let snapshot = createInitialCircuit("openai", 1000);
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1100); // 1
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1200); // 2
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1300); // 3 (aberto)

    expect(snapshot.state).toBe("open");
    
    // Sucesso ou falha antes do tempo não deve mudar para half-open (apenas conta falha ou ignora sucesso)
    let earlyCheck = evaluateCircuit(snapshot, thresholds, true, 2000);
    expect(earlyCheck.state).toBe("open");

    // No tempo exato do nextRetryAt
    let halfOpenCheck = evaluateCircuit(snapshot, thresholds, true, 1300 + 60000);
    expect(halfOpenCheck.state).toBe("half-open");
    expect(halfOpenCheck.successCount).toBe(1);
  });

  it("5. deve fechar corretamente após numero necessário de sucessos", () => {
    let snapshot = createInitialCircuit("openai", 1000);
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1100); // 1
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1200); // 2
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1300); // 3 (aberto)
    
    // Tenta e tem sucesso (conta 1)
    snapshot = evaluateCircuit(snapshot, thresholds, true, 1300 + 60000);
    expect(snapshot.state).toBe("half-open");
    expect(snapshot.successCount).toBe(1);

    // Tenta e tem sucesso (conta 2 -> fecha)
    snapshot = evaluateCircuit(snapshot, thresholds, true, 1300 + 60000 + 1000);
    expect(snapshot.state).toBe("closed");
    expect(snapshot.successCount).toBe(0);
    expect(snapshot.failureCount).toBe(0);
    expect(snapshot.openedAt).toBeNull();
    expect(snapshot.nextRetryAt).toBeNull();
  });

  it("5b. deve voltar para open se falhar enquanto half-open", () => {
    let snapshot = createInitialCircuit("gemini", 1000);
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1100); // 1
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1200); // 2
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1300); // 3 (aberto)
    
    // Primeiro em half-open é um sucesso
    snapshot = evaluateCircuit(snapshot, thresholds, true, 1300 + 60000);
    expect(snapshot.state).toBe("half-open");
    expect(snapshot.successCount).toBe(1);

    // Segundo em half-open falha!
    snapshot = evaluateCircuit(snapshot, thresholds, false, 1300 + 60000 + 1000);
    expect(snapshot.state).toBe("open");
    expect(snapshot.failureCount).toBe(4);
    expect(snapshot.openedAt).toBe(62300);
    expect(snapshot.nextRetryAt).toBe(62300 + 60000);
  });

  it("6. thresholds são respeitados (não há numeros magicos)", () => {
    const customThresholds: CircuitBreakerThresholds = {
      maxFailures: 1,
      retryAfterMs: 1000,
      successesToClose: 1,
    };

    let snapshot = createInitialCircuit("openai", 1000);
    snapshot = evaluateCircuit(snapshot, customThresholds, false, 1100);
    expect(snapshot.state).toBe("open");
    expect(snapshot.nextRetryAt).toBe(2100);

    snapshot = evaluateCircuit(snapshot, customThresholds, true, 2100);
    expect(snapshot.state).toBe("closed");
  });

  it("7. Object.freeze garante imutabilidade", () => {
    const snapshot = createInitialCircuit("openai", 1000);
    expect(Object.isFrozen(snapshot)).toBe(true);

    const nextSnapshot = evaluateCircuit(snapshot, thresholds, false, 1100);
    expect(Object.isFrozen(nextSnapshot)).toBe(true);

    expect(() => {
      // @ts-ignore
      snapshot.failureCount = 99;
    }).toThrow();
  });

  it("8. determinismo (mesmo input, mesmo output)", () => {
    const snapshot1 = createInitialCircuit("gemini", 1000);
    const snapshot2 = createInitialCircuit("gemini", 1000);
    expect(snapshot1).toEqual(snapshot2);

    const next1 = evaluateCircuit(snapshot1, thresholds, false, 1500);
    const next2 = evaluateCircuit(snapshot2, thresholds, false, 1500);
    expect(next1).toEqual(next2);
  });

  it("9. should functions respond correctly", () => {
    let snapshot = createInitialCircuit("openai", 1000);
    expect(shouldOpenCircuit(snapshot, thresholds)).toBe(false);
    expect(shouldHalfOpenCircuit(snapshot, 2000)).toBe(false);
    expect(shouldCloseCircuit(snapshot, thresholds)).toBe(false);

    snapshot = { ...snapshot, failureCount: 3 };
    expect(shouldOpenCircuit(snapshot as ProviderCircuitSnapshot, thresholds)).toBe(true);

    snapshot = { ...snapshot, state: "open", nextRetryAt: 5000 };
    expect(shouldHalfOpenCircuit(snapshot as ProviderCircuitSnapshot, 4000)).toBe(false);
    expect(shouldHalfOpenCircuit(snapshot as ProviderCircuitSnapshot, 5000)).toBe(true);

    snapshot = { ...snapshot, state: "half-open", successCount: 2 };
    expect(shouldCloseCircuit(snapshot as ProviderCircuitSnapshot, thresholds)).toBe(true);
  });
});
