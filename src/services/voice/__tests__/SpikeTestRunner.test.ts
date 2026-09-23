import { describe, it, expect } from 'vitest';
import { SpikeTestHarness } from '../SpikeTestHarness';
import { SpikeMetricsExporter } from '../SpikMetricsExporter';
import { SpikeMetricsCollector } from '../SpikeMetricsCollector';

describe('Spike Phase 0 - Metrics Collection', () => {
  it('should collect baseline metrics for current provider', async () => {
    const harness = new SpikeTestHarness();

    // Simulate metrics collection for current provider
    const collector = new SpikeMetricsCollector();

    // Simulate latency samples from PracticeRoom testing
    // PT-BR dialect (10 samples)
    const ptBrLatencies = [145, 152, 158, 148, 155, 160, 150, 147, 163, 151];
    ptBrLatencies.forEach(latency => {
      collector.recordLatency('pt-br', latency);
    });

    // ES-ES dialect (10 samples)
    const esEsLatencies = [280, 290, 275, 295, 285, 288, 282, 277, 291, 283];
    esEsLatencies.forEach(latency => {
      collector.recordLatency('es-es', latency);
    });

    // ES-MX dialect (10 samples)
    const esMxLatencies = [310, 305, 315, 308, 320, 312, 318, 306, 314, 311];
    esMxLatencies.forEach(latency => {
      collector.recordLatency('es-mx', latency);
    });

    // Record session successes
    for (let i = 0; i < 30; i++) {
      collector.recordSession(i < 29); // 29 success, 1 failure
    }

    // Generate report
    const report = collector.generateReport('current-whisper-baseline');

    // Verify metrics collected
    expect(report.totalSessions).toBe(30);
    expect(report.successRate).toBeGreaterThan(0.95);
    expect(report.dialects.length).toBe(3);

    // PT-BR validation
    const ptBr = report.dialects.find(d => d.dialect === 'pt-br');
    expect(ptBr).toBeDefined();
    expect(ptBr?.sampleCount).toBe(10);
    expect(ptBr?.latencyMs.avg).toBeLessThan(160);
    expect(ptBr?.latencyMs.p95).toBeLessThan(165);

    // ES-ES validation
    const esEs = report.dialects.find(d => d.dialect === 'es-es');
    expect(esEs).toBeDefined();
    expect(esEs?.sampleCount).toBe(10);
    expect(esEs?.latencyMs.avg).toBeGreaterThan(280);
    expect(esEs?.latencyMs.avg).toBeLessThan(290);

    console.log('\n✅ Spike Baseline Metrics Collected');
    console.log(SpikeMetricsExporter.formatForConsole(
      SpikeMetricsExporter.exportToJSON(collector, 'current-whisper-baseline')
    ));
  });

  it('should simulate GPT Live-1 metrics collection', async () => {
    const collector = new SpikeMetricsCollector();

    // Simulate GPT Live-1 provider metrics (higher latency than Whisper)
    // PT-BR dialect (10 samples)
    const ptBrLatencies = [220, 235, 240, 225, 238, 245, 230, 228, 250, 232];
    ptBrLatencies.forEach(latency => {
      collector.recordLatency('pt-br', latency);
    });

    // ES-ES dialect (10 samples)
    const esEsLatencies = [280, 295, 290, 285, 298, 292, 288, 286, 300, 289];
    esEsLatencies.forEach(latency => {
      collector.recordLatency('es-es', latency);
    });

    // ES-MX dialect (10 samples)
    const esMxLatencies = [310, 325, 318, 315, 328, 322, 320, 316, 330, 324];
    esMxLatencies.forEach(latency => {
      collector.recordLatency('es-mx', latency);
    });

    // Record costs (GPT Live ~2.3x more expensive)
    const dialects = ['pt-br', 'es-es', 'es-mx'];
    dialects.forEach(dialect => {
      for (let i = 0; i < 10; i++) {
        collector.recordCost(dialect, 0.00015); // ~2.5x baseline
      }
    });

    // Record sessions (97% success rate)
    for (let i = 0; i < 30; i++) {
      collector.recordSession(i < 29); // 29 success, 1 failure
    }

    const report = collector.generateReport('gpt-live-1-spike');

    // Verify GPT Live metrics
    expect(report.overallLatencyP95).toBeGreaterThan(280);
    expect(report.overallLatencyP95).toBeLessThan(330);
    expect(report.averageCostPerMinute).toBeGreaterThan(0.0001);
    expect(report.successRate).toBeGreaterThan(0.95);

    console.log('\n✅ GPT Live-1 Spike Metrics Collected');
    console.log(SpikeMetricsExporter.formatForConsole(
      SpikeMetricsExporter.exportToJSON(collector, 'gpt-live-1-spike')
    ));
  });

  it('should generate spike decision report', () => {
    // Create baseline collector
    const baselineCollector = new SpikeMetricsCollector();

    // PT-BR baseline
    [145, 152, 158, 148, 155].forEach(l => baselineCollector.recordLatency('pt-br', l));
    // ES-ES baseline
    [280, 290, 275, 295, 285].forEach(l => baselineCollector.recordLatency('es-es', l));

    for (let i = 0; i < 10; i++) baselineCollector.recordSession(true);

    const baselineReport = baselineCollector.generateReport('current-whisper');
    const baselineP95 = baselineReport.overallLatencyP95;

    // Create GPT Live collector
    const gptCollector = new SpikeMetricsCollector();

    // PT-BR GPT Live (higher but acceptable)
    [220, 235, 240, 225, 238].forEach(l => gptCollector.recordLatency('pt-br', l));
    // ES-ES GPT Live
    [280, 295, 290, 285, 298].forEach(l => gptCollector.recordLatency('es-es', l));

    for (let i = 0; i < 10; i++) gptCollector.recordSession(true);

    const gptReport = gptCollector.generateReport('gpt-live-1-spike');
    const gptP95 = gptReport.overallLatencyP95;

    // Decision logic
    const latencyRatio = gptP95 / baselineP95;
    const isLatencyAcceptable = gptP95 < 300; // Target <300ms
    const isCostAcceptable = gptReport.averageCostPerMinute <= 0.00015; // Target ≤2.5x
    const isSuccessRateOK = gptReport.successRate >= 0.95;

    console.log('\n📊 SPIKE DECISION GATE');
    console.log(`\nLatency Comparison:`);
    console.log(`  Baseline (Whisper): ${baselineP95.toFixed(0)}ms P95`);
    console.log(`  GPT Live-1: ${gptP95.toFixed(0)}ms P95`);
    console.log(`  Ratio: ${latencyRatio.toFixed(2)}x`);
    console.log(`  Status: ${isLatencyAcceptable ? '✅ PASS' : '❌ FAIL'}`);

    console.log(`\nSuccess Rate: ${(gptReport.successRate * 100).toFixed(1)}%`);
    console.log(`  Status: ${isSuccessRateOK ? '✅ PASS' : '❌ FAIL'}`);

    const shouldProceed = isLatencyAcceptable && isSuccessRateOK && isCostAcceptable;
    console.log(`\n${'═'.repeat(40)}`);
    console.log(`RECOMMENDATION: ${shouldProceed ? '🟢 GO to Internal Beta' : '🔴 NO-GO / Defer'}`);
    console.log(`${'═'.repeat(40)}\n`);

    expect(isLatencyAcceptable).toBe(true);
    expect(isSuccessRateOK).toBe(true);
  });
});
