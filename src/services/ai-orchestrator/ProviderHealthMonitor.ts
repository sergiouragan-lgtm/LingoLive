import { TutorProviderId } from './TutorProviderSelectionPolicy';

export type ProviderHealthStatus =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "unknown";

export interface ProviderHealthSnapshot {
  readonly providerId: TutorProviderId;
  readonly status: ProviderHealthStatus;
  readonly averageLatencyMs: number;
  readonly lastLatencyMs: number;
  readonly consecutiveFailures: number;
  readonly consecutiveSuccesses: number;
  readonly availabilityRatio: number;
  readonly lastFailureAt: number | null;
  readonly lastSuccessAt: number | null;
  readonly updatedAt: number;
  readonly totalAttempts?: number;
  readonly totalSuccesses?: number;
}

export interface ProviderHealthThresholds {
  readonly latencyWarningMs: number;
  readonly latencyCriticalMs: number;
  readonly maxFailures: number;
  readonly degradedAvailability: number;
  readonly healthyAvailability: number;
}

export interface ProviderMeasurementInput {
  readonly success: boolean;
  readonly latencyMs: number;
  readonly timestamp: number;
}

export const DEFAULT_HEALTH_THRESHOLDS: ProviderHealthThresholds = Object.freeze({
  latencyWarningMs: 1000,
  latencyCriticalMs: 3000,
  maxFailures: 3,
  degradedAvailability: 0.90,
  healthyAvailability: 0.99,
});

export function createInitialHealth(
  providerId: TutorProviderId,
  nowTimestamp: number
): ProviderHealthSnapshot {
  return Object.freeze({
    providerId,
    status: "unknown",
    averageLatencyMs: 0,
    lastLatencyMs: 0,
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    availabilityRatio: 1.0,
    lastFailureAt: null,
    lastSuccessAt: null,
    updatedAt: nowTimestamp,
    totalAttempts: 0,
    totalSuccesses: 0,
  });
}

export function calculateAvailability(totalSuccesses: number, totalAttempts: number): number {
  if (totalAttempts <= 0) {
    return 1.0;
  }
  return totalSuccesses / totalAttempts;
}

export function calculateAverageLatency(
  currentAvgLatencyMs: number,
  totalSuccesses: number,
  newLatencyMs: number
): number {
  if (totalSuccesses <= 0) {
    return newLatencyMs;
  }
  return (currentAvgLatencyMs * totalSuccesses + newLatencyMs) / (totalSuccesses + 1);
}

export function classifyHealth(
  snapshot: Omit<ProviderHealthSnapshot, "status">,
  thresholds: ProviderHealthThresholds = DEFAULT_HEALTH_THRESHOLDS
): ProviderHealthStatus {
  const attempts = snapshot.totalAttempts ?? 0;
  if (attempts === 0 && snapshot.lastSuccessAt === null && snapshot.lastFailureAt === null) {
    return "unknown";
  }

  // Unavailable conditions:
  // - consecutive failures > maxFailures
  // - availability < degradedAvailability
  // - last latency >= latencyCriticalMs
  if (
    snapshot.consecutiveFailures > thresholds.maxFailures ||
    snapshot.availabilityRatio < thresholds.degradedAvailability ||
    snapshot.lastLatencyMs >= thresholds.latencyCriticalMs
  ) {
    return "unavailable";
  }

  // Healthy conditions:
  // - availability >= healthyAvailability
  // - consecutiveFailures == 0
  // - last latency < latencyWarningMs
  // - average latency < latencyWarningMs
  if (
    snapshot.availabilityRatio >= thresholds.healthyAvailability &&
    snapshot.consecutiveFailures === 0 &&
    snapshot.lastLatencyMs < thresholds.latencyWarningMs &&
    snapshot.averageLatencyMs < thresholds.latencyWarningMs
  ) {
    return "healthy";
  }

  // Degraded: otherwise (elevated latency, partial availability, or low consecutive failures)
  return "degraded";
}

export function updateProviderHealth(
  currentSnapshot: ProviderHealthSnapshot,
  measurementOrSuccess: ProviderMeasurementInput | boolean,
  latencyMsOrThresholds?: number | ProviderHealthThresholds,
  timestampOrUndefined?: number,
  thresholdsParam?: ProviderHealthThresholds
): ProviderHealthSnapshot {
  let success: boolean;
  let latencyMs: number;
  let timestamp: number;
  let thresholds: ProviderHealthThresholds;

  if (typeof measurementOrSuccess === "boolean") {
    success = measurementOrSuccess;
    latencyMs = typeof latencyMsOrThresholds === "number" ? latencyMsOrThresholds : 0;
    timestamp = timestampOrUndefined ?? 0;
    thresholds = thresholdsParam ?? DEFAULT_HEALTH_THRESHOLDS;
  } else {
    success = measurementOrSuccess.success;
    latencyMs = measurementOrSuccess.latencyMs;
    timestamp = measurementOrSuccess.timestamp;
    thresholds = (latencyMsOrThresholds as ProviderHealthThresholds) ?? DEFAULT_HEALTH_THRESHOLDS;
  }

  const prevAttempts = currentSnapshot.totalAttempts ?? 0;
  const prevSuccesses = currentSnapshot.totalSuccesses ?? 0;

  const newAttempts = prevAttempts + 1;
  const newSuccesses = success ? prevSuccesses + 1 : prevSuccesses;

  const newConsecutiveSuccesses = success ? currentSnapshot.consecutiveSuccesses + 1 : 0;
  const newConsecutiveFailures = success ? 0 : currentSnapshot.consecutiveFailures + 1;

  const newLastSuccessAt = success ? timestamp : currentSnapshot.lastSuccessAt;
  const newLastFailureAt = success ? currentSnapshot.lastFailureAt : timestamp;

  const newAvailability = calculateAvailability(newSuccesses, newAttempts);

  const newAvgLatency = success
    ? calculateAverageLatency(currentSnapshot.averageLatencyMs, prevSuccesses, latencyMs)
    : currentSnapshot.averageLatencyMs;

  const unclassifiedSnapshot = {
    providerId: currentSnapshot.providerId,
    averageLatencyMs: newAvgLatency,
    lastLatencyMs: latencyMs,
    consecutiveFailures: newConsecutiveFailures,
    consecutiveSuccesses: newConsecutiveSuccesses,
    availabilityRatio: newAvailability,
    lastFailureAt: newLastFailureAt,
    lastSuccessAt: newLastSuccessAt,
    updatedAt: timestamp,
    totalAttempts: newAttempts,
    totalSuccesses: newSuccesses,
  };

  const status = classifyHealth(unclassifiedSnapshot, thresholds);

  return Object.freeze({
    ...unclassifiedSnapshot,
    status,
  });
}
