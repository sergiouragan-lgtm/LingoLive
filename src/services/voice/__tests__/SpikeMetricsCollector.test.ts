import { describe, it, expect } from 'vitest';
import { SpikeMetricsCollector } from '../SpikeMetricsCollector';

describe('SpikeMetricsCollector', () => {
  it('should track latency metrics by dialect', () => {
    const collector = new SpikeMetricsCollector();

    // Simulate PT-BR dialect metrics
    collector.recordLatency('pt-br', 145);
    collector.recordLatency('pt-br', 152);
    collector.recordLatency('pt-br', 158);
    collector.recordLatency('pt-br', 200);

    // Simulate ES-ES dialect metrics
    collector.recordLatency('es-es', 280);
    collector.recordLatency('es-es', 290);
    collector.recordLatency('es-es', 310);

    const report = collector.generateReport('gpt-live-1-spike');

    expect(report.dialects).toHaveLength(2);
    expect(report.totalSessions).toBe(0);

    const ptBr = report.dialects.find(d => d.dialect === 'pt-br');
    expect(ptBr?.sampleCount).toBe(4);
    expect(ptBr?.latencyMs.avg).toBeGreaterThan(150);
    expect(ptBr?.latencyMs.p95).toBeLessThanOrEqual(200);
  });

  it('should calculate cost metrics per dialect', () => {
    const collector = new SpikeMetricsCollector();

    collector.recordLatency('pt-br', 150);
    collector.recordCost('pt-br', 0.00010);

    collector.recordLatency('es-mx', 280);
    collector.recordCost('es-mx', 0.00015);

    const report = collector.generateReport('gpt-live-1-spike');

    expect(report.averageCostPerMinute).toBeGreaterThan(0.00010);
    expect(report.dialects[0].costPerMinute).toBeGreaterThan(0);
  });

  it('should track session success rates', () => {
    const collector = new SpikeMetricsCollector();

    collector.recordSession(true);
    collector.recordSession(true);
    collector.recordSession(false);
    collector.recordSession(true);

    const report = collector.generateReport('test-provider');

    expect(report.totalSessions).toBe(4);
    expect(report.successRate).toBe(0.75);
  });

  it('should generate actionable recommendations', () => {
    const collector = new SpikeMetricsCollector();

    // Good latency
    for (let i = 0; i < 10; i++) {
      collector.recordLatency('test', 250 + Math.random() * 50);
    }
    // Good success rate
    for (let i = 0; i < 19; i++) {
      collector.recordSession(true);
    }
    collector.recordSession(false);

    const report = collector.generateReport('gpt-live-1-spike');

    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.overallLatencyP95).toBeLessThan(350);
    expect(report.successRate).toBeGreaterThan(0.9);
  });
});
