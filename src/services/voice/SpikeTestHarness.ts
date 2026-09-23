/**
 * Spike Test Harness
 * Automated testing framework for ChatGPT Live-1 spike phase
 * Runs metrics collection across multiple dialects
 */

import { VoiceProviderFactory } from './VoiceProviderFactory';
import { SpikeMetricsCollector } from './SpikeMetricsCollector';
import { SpikeMetricsExporter } from './SpikMetricsExporter';

export interface SpikeTestConfig {
  provider: 'current' | 'gpt-live';
  dialects: string[];
  samplesPerDialect: number;
  audioLengthMs?: number; // Mock audio length in ms
}

export interface SpikeTestResult {
  dialect: string;
  samples: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  successCount: number;
  failureCount: number;
}

export class SpikeTestHarness {
  private collector = new SpikeMetricsCollector();
  private provider = VoiceProviderFactory.getProvider();

  /**
   * Run spike test suite across multiple dialects
   * Used for Week 1-2 validation phase
   */
  async runSpikeSuite(config: SpikeTestConfig): Promise<SpikeTestResult[]> {
    const results: SpikeTestResult[] = [];

    console.log(`\n🚀 Starting Spike Test Suite (${config.provider})`);
    console.log(`📍 Dialects: ${config.dialects.join(', ')}`);
    console.log(`📊 Samples per dialect: ${config.samplesPerDialect}\n`);

    for (const dialect of config.dialects) {
      const result = await this.testDialect(dialect, config.samplesPerDialect);
      results.push(result);
      console.log(`✅ ${result.dialect}: ${result.successCount}/${result.samples} successful`);
    }

    return results;
  }

  /**
   * Test a single dialect with multiple samples
   */
  private async testDialect(
    dialect: string,
    sampleCount: number
  ): Promise<SpikeTestResult> {
    let successCount = 0;
    let failureCount = 0;
    const latencies: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
      try {
        const startTime = Date.now();

        // Simulate audio processing
        const mockAudio = new Blob(
          [new ArrayBuffer(16000)], // ~1 second of audio
          { type: 'audio/webm' }
        );

        // Start session (once per dialect)
        const sessionId = await this.provider.startSession({
          language: this.dialectToLanguage(dialect),
          dialect,
        });

        // Process audio
        await this.provider.processAudio(sessionId, mockAudio);
        const latencyMs = Date.now() - startTime;

        latencies.push(latencyMs);
        this.collector.recordLatency(dialect, latencyMs);
        this.collector.recordSession(true);

        successCount++;

        // End session
        await this.provider.endSession(sessionId);
      } catch (error) {
        failureCount++;
        this.collector.recordSession(false);
        console.warn(`  ⚠️ Sample ${i + 1}/${sampleCount} failed for ${dialect}`);
      }
    }

    latencies.sort((a, b) => a - b);
    const p95Index = Math.ceil(latencies.length * 0.95) - 1;

    return {
      dialect,
      samples: sampleCount,
      avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95LatencyMs: latencies[Math.max(0, p95Index)],
      successCount,
      failureCount,
    };
  }

  /**
   * Get current metrics report
   */
  getReport(provider: string) {
    return this.collector.generateReport(provider);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(provider: string) {
    return SpikeMetricsExporter.exportToJSON(this.collector, provider);
  }

  /**
   * Print formatted report to console
   */
  printReport(provider: string): void {
    const metrics = this.exportMetrics(provider);
    console.log(SpikeMetricsExporter.formatForConsole(metrics));
  }

  /**
   * Download metrics as JSON file
   */
  downloadMetrics(provider: string): void {
    const metrics = this.exportMetrics(provider);
    SpikeMetricsExporter.downloadAsJSON(metrics);
  }

  private dialectToLanguage(dialect: string): string {
    const map: Record<string, string> = {
      'pt-br': 'Portuguese',
      'pt-pt': 'Portuguese',
      'es-es': 'Spanish',
      'es-mx': 'Spanish',
      'en-us': 'English',
      'en-gb': 'English',
    };
    return map[dialect] || 'English';
  }
}

/**
 * Quick-start spike test runner (for development)
 * Usage: SpikeTestHarness.quickStart()
 */
export async function quickStartSpikeTest() {
  const harness = new SpikeTestHarness();

  const config: SpikeTestConfig = {
    provider: VoiceProviderFactory.isGPTLiveEnabled() ? 'gpt-live' : 'current',
    dialects: ['pt-br', 'es-es', 'es-mx'],
    samplesPerDialect: 10,
  };

  try {
    await harness.runSpikeSuite(config);
    harness.printReport(config.provider);
    harness.downloadMetrics(config.provider);
  } catch (error) {
    console.error('[SpikeTestHarness] Error running spike test:', error);
  }
}
