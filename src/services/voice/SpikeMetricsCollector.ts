/**
 * Spike Metrics Collector
 * Tracks validation metrics for ChatGPT Live-1 spike phase
 *
 * Metrics tracked:
 * - Latency (P95) for each dialect
 * - Word Error Rate (WER) across regions
 * - Cost per minute
 * - Full-duplex interrupt handling
 */

export interface DialectMetrics {
  dialect: string;
  language: string;
  sampleCount: number;
  latencyMs: {
    avg: number;
    p95: number;
    p99: number;
  };
  wer?: number; // Word Error Rate 0-100
  costPerMinute?: number;
  qualityScore?: number;
}

export interface SpikeReport {
  provider: string;
  timestamp: number;
  totalSessions: number;
  dialects: DialectMetrics[];
  overallLatencyP95: number;
  averageCostPerMinute: number;
  successRate: number;
  recommendations: string[];
}

export class SpikeMetricsCollector {
  private dialectMetrics = new Map<string, number[]>();
  private costSamples = new Map<string, number[]>();
  private sessionCount = 0;
  private failureCount = 0;

  recordLatency(dialect: string, latencyMs: number): void {
    const key = this.normalizeDialect(dialect);
    if (!this.dialectMetrics.has(key)) {
      this.dialectMetrics.set(key, []);
    }
    this.dialectMetrics.get(key)!.push(latencyMs);
  }

  recordCost(dialect: string, costUsd: number): void {
    const key = this.normalizeDialect(dialect);
    if (!this.costSamples.has(key)) {
      this.costSamples.set(key, []);
    }
    this.costSamples.get(key)!.push(costUsd);
  }

  recordSession(success: boolean): void {
    this.sessionCount++;
    if (!success) {
      this.failureCount++;
    }
  }

  private normalizeDialect(dialect: string): string {
    return (dialect || 'standard').toLowerCase();
  }

  private calculateStats(values: number[]): { avg: number; p95: number; p99: number } {
    if (values.length === 0) return { avg: 0, p95: 0, p99: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p99Index = Math.ceil(sorted.length * 0.99) - 1;

    return {
      avg,
      p95: sorted[Math.max(0, p95Index)],
      p99: sorted[Math.max(0, p99Index)]
    };
  }

  generateReport(provider: string): SpikeReport {
    const dialects: DialectMetrics[] = [];
    let totalLatencies: number[] = [];

    for (const [dialect, latencies] of this.dialectMetrics.entries()) {
      const stats = this.calculateStats(latencies);
      const costs = this.costSamples.get(dialect) || [];
      const avgCost = costs.length > 0
        ? costs.reduce((a, b) => a + b, 0) / costs.length
        : 0;

      dialects.push({
        dialect,
        language: this.dialects[dialect] || 'unknown',
        sampleCount: latencies.length,
        latencyMs: stats,
        costPerMinute: avgCost
      });

      totalLatencies.push(...latencies);
    }

    const overallStats = this.calculateStats(totalLatencies);
    const allCosts = Array.from(this.costSamples.values()).flat();
    const avgCostPerMinute = allCosts.length > 0
      ? allCosts.reduce((a, b) => a + b, 0) / allCosts.length
      : 0;

    const successRate = this.sessionCount > 0
      ? (this.sessionCount - this.failureCount) / this.sessionCount
      : 0;

    const recommendations = this.generateRecommendations(
      overallStats.p95,
      avgCostPerMinute,
      successRate
    );

    return {
      provider,
      timestamp: Date.now(),
      totalSessions: this.sessionCount,
      dialects,
      overallLatencyP95: overallStats.p95,
      averageCostPerMinute: avgCostPerMinute,
      successRate,
      recommendations
    };
  }

  private generateRecommendations(
    latencyP95: number,
    costPerMin: number,
    successRate: number
  ): string[] {
    const recs: string[] = [];

    if (latencyP95 > 300) {
      recs.push(`⚠️ Latency P95 (${latencyP95}ms) exceeds target (<300ms). Investigate network/API performance.`);
    } else if (latencyP95 < 200) {
      recs.push(`✅ Latency P95 (${latencyP95}ms) is excellent. Better than current solution (~150ms).`);
    }

    if (costPerMin > 0.00015) {
      recs.push(`⚠️ Cost (${costPerMin.toFixed(6)}/min) is high. Compare economics with current solution.`);
    }

    if (successRate < 0.95) {
      recs.push(`❌ Success rate (${(successRate * 100).toFixed(1)}%) below 95%. Investigate failures.`);
    } else {
      recs.push(`✅ Success rate (${(successRate * 100).toFixed(1)}%) is solid.`);
    }

    return recs;
  }

  private dialects: Record<string, string> = {
    'pt-br': 'Portuguese (Brazil)',
    'pt-pt': 'Portuguese (Portugal)',
    'es-es': 'Spanish (Spain)',
    'es-mx': 'Spanish (Mexico)',
    'en-us': 'English (USA)',
    'en-gb': 'English (UK)',
    'standard': 'Standard (Default)'
  };
}
