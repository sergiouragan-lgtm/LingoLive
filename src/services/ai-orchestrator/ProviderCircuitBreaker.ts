import { TutorProviderId } from "./TutorProviderSelectionPolicy";

export type CircuitState = "closed" | "open" | "half-open";

export interface ProviderCircuitSnapshot {
  readonly providerId: TutorProviderId;
  readonly state: CircuitState;
  readonly openedAt: number | null;
  readonly nextRetryAt: number | null;
  readonly failureCount: number;
  readonly successCount: number;
  readonly updatedAt: number;
}

export interface CircuitBreakerThresholds {
  readonly maxFailures: number;
  readonly retryAfterMs: number;
  readonly successesToClose: number;
}

export function createInitialCircuit(
  providerId: TutorProviderId,
  timestamp: number
): ProviderCircuitSnapshot {
  return Object.freeze({
    providerId,
    state: "closed",
    openedAt: null,
    nextRetryAt: null,
    failureCount: 0,
    successCount: 0,
    updatedAt: timestamp,
  });
}

export function shouldOpenCircuit(
  snapshot: ProviderCircuitSnapshot,
  thresholds: CircuitBreakerThresholds
): boolean {
  return snapshot.state === "closed" && snapshot.failureCount >= thresholds.maxFailures;
}

export function shouldHalfOpenCircuit(
  snapshot: ProviderCircuitSnapshot,
  timestamp: number
): boolean {
  return (
    snapshot.state === "open" &&
    snapshot.nextRetryAt !== null &&
    timestamp >= snapshot.nextRetryAt
  );
}

export function shouldCloseCircuit(
  snapshot: ProviderCircuitSnapshot,
  thresholds: CircuitBreakerThresholds
): boolean {
  return snapshot.state === "half-open" && snapshot.successCount >= thresholds.successesToClose;
}

export function evaluateCircuit(
  snapshot: ProviderCircuitSnapshot,
  thresholds: CircuitBreakerThresholds,
  isSuccess: boolean,
  timestamp: number
): ProviderCircuitSnapshot {
  let { state, openedAt, nextRetryAt, failureCount, successCount } = snapshot;

  if (shouldHalfOpenCircuit(snapshot, timestamp)) {
    state = "half-open";
  }

  if (isSuccess) {
    if (state === "closed") {
      failureCount = 0;
    } else if (state === "half-open") {
      successCount += 1;
      const tempSnapshot = { ...snapshot, state, successCount };
      if (shouldCloseCircuit(tempSnapshot as ProviderCircuitSnapshot, thresholds)) {
        state = "closed";
        openedAt = null;
        nextRetryAt = null;
        failureCount = 0;
        successCount = 0;
      }
    }
  } else {
    if (state === "closed") {
      failureCount += 1;
      const tempSnapshot = { ...snapshot, state, failureCount };
      if (shouldOpenCircuit(tempSnapshot as ProviderCircuitSnapshot, thresholds)) {
        state = "open";
        openedAt = timestamp;
        nextRetryAt = timestamp + thresholds.retryAfterMs;
        successCount = 0;
      }
    } else if (state === "half-open") {
      state = "open";
      openedAt = timestamp;
      nextRetryAt = timestamp + thresholds.retryAfterMs;
      failureCount += 1;
      successCount = 0;
    } else if (state === "open") {
      failureCount += 1;
    }
  }

  return Object.freeze({
    providerId: snapshot.providerId,
    state,
    openedAt,
    nextRetryAt,
    failureCount,
    successCount,
    updatedAt: timestamp,
  });
}
