/**
 * Spike Metrics Exporter
 * Exports collected metrics to JSON for analysis
 * Used for spike phase reporting (Week 1-2)
 */

import { SpikeMetricsCollector } from './SpikeMetricsCollector';

export interface ExportedMetrics {
  exportedAt: string;
  provider: string;
  environment: string;
  summary: {
    totalSessions: number;
    successRate: number;
    overallLatencyP95: number;
    averageCostPerMinute: number;
  };
  byDialect: Array<{
    dialect: string;
    language: string;
    samples: number;
    latencyMs: {
      avg: number;
      p95: number;
      p99: number;
    };
    costPerMinute?: number;
  }>;
  recommendations: string[];
  timestamp: number;
}

export class SpikeMetricsExporter {
  /**
   * Export metrics from collector to JSON format
   */
  static exportToJSON(
    collector: SpikeMetricsCollector,
    provider: string,
    environment: string = 'development'
  ): ExportedMetrics {
    const report = collector.generateReport(provider);

    return {
      exportedAt: new Date().toISOString(),
      provider,
      environment,
      summary: {
        totalSessions: report.totalSessions,
        successRate: report.successRate,
        overallLatencyP95: report.overallLatencyP95,
        averageCostPerMinute: report.averageCostPerMinute,
      },
      byDialect: report.dialects.map(d => ({
        dialect: d.dialect,
        language: d.language,
        samples: d.sampleCount,
        latencyMs: d.latencyMs,
        costPerMinute: d.costPerMinute,
      })),
      recommendations: report.recommendations,
      timestamp: report.timestamp,
    };
  }

  /**
   * Download metrics as JSON file (browser only)
   */
  static downloadAsJSON(
    metrics: ExportedMetrics,
    filename: string = `spike-metrics-${Date.now()}.json`
  ): void {
    if (typeof window === 'undefined') {
      console.warn('[SpikeMetricsExporter] Download only works in browser');
      return;
    }

    const dataStr = JSON.stringify(metrics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[SpikeMetricsExporter] Downloaded: ${filename}`);
  }

  /**
   * Format metrics for console output (human readable)
   */
  static formatForConsole(metrics: ExportedMetrics): string {
    const lines: string[] = [
      '\n╔════════════════════════════════════════════════════════════╗',
      '║         SPIKE METRICS REPORT - PHASE 0                      ║',
      '╚════════════════════════════════════════════════════════════╝',
      `\nExported: ${metrics.exportedAt}`,
      `Provider: ${metrics.provider}`,
      `Environment: ${metrics.environment}`,
      '\n📊 SUMMARY',
      `  Total Sessions: ${metrics.summary.totalSessions}`,
      `  Success Rate:   ${(metrics.summary.successRate * 100).toFixed(1)}%`,
      `  Latency P95:    ${metrics.summary.overallLatencyP95.toFixed(0)}ms`,
      `  Avg Cost/Min:   $${metrics.summary.averageCostPerMinute.toFixed(6)}`,
      '\n📍 BY DIALECT',
    ];

    metrics.byDialect.forEach(d => {
      lines.push(`\n  ${d.dialect.toUpperCase()} (${d.language})`);
      lines.push(`    Samples:  ${d.samples}`);
      lines.push(`    Avg:      ${d.latencyMs.avg.toFixed(0)}ms`);
      lines.push(`    P95:      ${d.latencyMs.p95.toFixed(0)}ms`);
      lines.push(`    P99:      ${d.latencyMs.p99.toFixed(0)}ms`);
      if (d.costPerMinute) {
        lines.push(`    Cost/min: $${d.costPerMinute.toFixed(6)}`);
      }
    });

    lines.push('\n💡 RECOMMENDATIONS');
    metrics.recommendations.forEach(rec => {
      lines.push(`  ${rec}`);
    });

    lines.push('\n╔════════════════════════════════════════════════════════════╗\n');

    return lines.join('\n');
  }
}
