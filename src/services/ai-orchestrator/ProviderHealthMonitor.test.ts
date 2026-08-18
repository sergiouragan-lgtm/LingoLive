import { describe, it, expect } from 'vitest';
import {
  createInitialHealth,
  updateProviderHealth,
  calculateAvailability,
  calculateAverageLatency,
  classifyHealth,
  DEFAULT_HEALTH_THRESHOLDS,
  ProviderHealthSnapshot,
  ProviderHealthThresholds,
} from './ProviderHealthMonitor';

describe('ProviderHealthMonitor', () => {
  it('1. should create correct initial health snapshot in unknown status', () => {
    const initial = createInitialHealth('openai', 1000);
    expect(initial.providerId).toBe('openai');
    expect(initial.status).toBe('unknown');
    expect(initial.averageLatencyMs).toBe(0);
    expect(initial.lastLatencyMs).toBe(0);
    expect(initial.consecutiveFailures).toBe(0);
    expect(initial.consecutiveSuccesses).toBe(0);
    expect(initial.availabilityRatio).toBe(1.0);
    expect(initial.lastFailureAt).toBeNull();
    expect(initial.lastSuccessAt).toBeNull();
    expect(initial.updatedAt).toBe(1000);
    expect(Object.isFrozen(initial)).toBe(true);
  });

  it('2. should classify health as healthy when measurement meets all healthy criteria', () => {
    const initial = createInitialHealth('gemini', 1000);
    const updated = updateProviderHealth(initial, {
      success: true,
      latencyMs: 150,
      timestamp: 2000,
    });

    expect(updated.status).toBe('healthy');
    expect(updated.consecutiveSuccesses).toBe(1);
    expect(updated.consecutiveFailures).toBe(0);
    expect(updated.availabilityRatio).toBe(1.0);
    expect(updated.averageLatencyMs).toBe(150);
    expect(updated.lastLatencyMs).toBe(150);
    expect(updated.lastSuccessAt).toBe(2000);
    expect(Object.isFrozen(updated)).toBe(true);
  });

  it('3. should classify health as degraded when latency is elevated', () => {
    const initial = createInitialHealth('openai', 1000);
    // Warning latency is 1000ms, critical is 3000ms
    const updated = updateProviderHealth(initial, {
      success: true,
      latencyMs: 1500,
      timestamp: 2000,
    });

    expect(updated.status).toBe('degraded');
    expect(updated.lastLatencyMs).toBe(1500);
  });

  it('4. should classify health as degraded when availability is between degraded and healthy thresholds', () => {
    let snapshot = createInitialHealth('openai', 1000);
    // 9 successes, 1 failure => availability 0.90 (which is <= 0.90 degraded threshold or < 0.99 healthy)
    for (let i = 0; i < 9; i++) {
      snapshot = updateProviderHealth(snapshot, true, 200, 1000 + i * 10);
    }
    // 1 failure
    snapshot = updateProviderHealth(snapshot, false, 200, 2000);
    // 1 success to clear consecutive failure
    snapshot = updateProviderHealth(snapshot, true, 200, 2010);

    // 10 successes out of 11 attempts => 90.9% availability (degraded because < 99%)
    expect(snapshot.availabilityRatio).toBeGreaterThanOrEqual(0.90);
    expect(snapshot.availabilityRatio).toBeLessThan(0.99);
    expect(snapshot.consecutiveFailures).toBe(0);
    expect(snapshot.status).toBe('degraded');
  });

  it('5. should classify health as unavailable when consecutive failures exceed maxFailures', () => {
    let snapshot = createInitialHealth('gemini', 1000);
    // Max failures default is 3. Exceeding maxFailures means > 3 (4 failures).
    for (let i = 0; i < 4; i++) {
      snapshot = updateProviderHealth(snapshot, false, 500, 2000 + i * 10);
    }

    expect(snapshot.consecutiveFailures).toBe(4);
    expect(snapshot.status).toBe('unavailable');
  });

  it('6. should correctly calculate average latency across multiple successful calls', () => {
    let snapshot = createInitialHealth('openai', 1000);
    snapshot = updateProviderHealth(snapshot, true, 100, 1100);
    snapshot = updateProviderHealth(snapshot, true, 200, 1200);
    snapshot = updateProviderHealth(snapshot, true, 300, 1300);

    expect(snapshot.averageLatencyMs).toBe(200); // (100 + 200 + 300) / 3
  });

  it('7. should correctly calculate availability ratio', () => {
    const ratioZero = calculateAvailability(0, 0);
    expect(ratioZero).toBe(1.0);

    const ratioHalf = calculateAvailability(5, 10);
    expect(ratioHalf).toBe(0.5);

    const ratioFull = calculateAvailability(10, 10);
    expect(ratioFull).toBe(1.0);
  });

  it('8. should be strictly immutable and return Object.freeze snapshots', () => {
    const initial = createInitialHealth('gemini', 1000);
    expect(Object.isFrozen(initial)).toBe(true);

    const updated = updateProviderHealth(initial, true, 120, 2000);
    expect(Object.isFrozen(updated)).toBe(true);
    expect(initial.consecutiveSuccesses).toBe(0); // initial is untouched
    expect(updated.consecutiveSuccesses).toBe(1);
  });

  it('9. should be deterministic and produce identical output for identical input', () => {
    const initial = createInitialHealth('openai', 1000);
    const snap1 = updateProviderHealth(initial, { success: true, latencyMs: 250, timestamp: 2000 });
    const snap2 = updateProviderHealth(initial, { success: true, latencyMs: 250, timestamp: 2000 });

    expect(snap1).toEqual(snap2);
  });

  it('10. should not modify input arguments', () => {
    const initial = createInitialHealth('gemini', 1000);
    const initialCopy = { ...initial };

    updateProviderHealth(initial, true, 100, 2000);

    expect(initial.status).toBe(initialCopy.status);
    expect(initial.updatedAt).toBe(initialCopy.updatedAt);
    expect(initial.consecutiveSuccesses).toBe(initialCopy.consecutiveSuccesses);
  });

  it('11. should respect custom thresholds', () => {
    const customThresholds: ProviderHealthThresholds = Object.freeze({
      latencyWarningMs: 500,
      latencyCriticalMs: 1000,
      maxFailures: 1,
      degradedAvailability: 0.95,
      healthyAvailability: 0.99,
    });

    const initial = createInitialHealth('openai', 1000);

    // Latency 600ms is healthy under default (1000ms), but degraded under custom (500ms)
    const snapDefault = updateProviderHealth(initial, { success: true, latencyMs: 600, timestamp: 2000 });
    expect(snapDefault.status).toBe('healthy');

    const snapCustom = updateProviderHealth(
      initial,
      { success: true, latencyMs: 600, timestamp: 2000 },
      customThresholds
    );
    expect(snapCustom.status).toBe('degraded');
  });

  it('12. should mark unavailable if latency reaches critical threshold', () => {
    const initial = createInitialHealth('gemini', 1000);
    const updated = updateProviderHealth(initial, {
      success: true,
      latencyMs: 3500, // Critical threshold is 3000ms
      timestamp: 2000,
    });

    expect(updated.status).toBe('unavailable');
  });

  it('13. should handle failure without resetting average latency', () => {
    let snapshot = createInitialHealth('openai', 1000);
    snapshot = updateProviderHealth(snapshot, true, 200, 1100);
    expect(snapshot.averageLatencyMs).toBe(200);

    // Record a failure
    snapshot = updateProviderHealth(snapshot, false, 5000, 1200);
    expect(snapshot.consecutiveFailures).toBe(1);
    expect(snapshot.consecutiveSuccesses).toBe(0);
    expect(snapshot.averageLatencyMs).toBe(200); // average latency remains unchanged on failure
    expect(snapshot.lastFailureAt).toBe(1200);
  });

  it('14. should work pure without global state or side effects', () => {
    const avgLatency = calculateAverageLatency(200, 2, 500);
    expect(avgLatency).toBe(300); // (200 * 2 + 500) / 3 = 900 / 3 = 300
  });
});
