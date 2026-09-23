# Spike Phase 0: Metrics Collection Guide

## Overview

This guide covers how to collect, analyze, and report metrics during the 2-week ChatGPT Live-1 spike phase (Weeks 1-2).

## Quick Start (5 minutes)

### 1. Enable GPT Live-1 Provider

```bash
# Development environment
export VOICE_PROVIDER=gpt-live
npm run dev

# Or set in .env
VITE_VOICE_PROVIDER=gpt-live
```

### 2. Run Spike Test Suite

```bash
# Browser console or dev environment
import { SpikeTestHarness } from '@/services/voice';

const harness = new SpikeTestHarness();
harness.printReport('gpt-live-1-spike');
harness.downloadMetrics('gpt-live-1-spike');
```

## Detailed Collection Process

### Week 1: Latency & Availability Validation

**Goal**: Validate P95 latency <300ms across 3+ dialects

#### Setup

```bash
VOICE_PROVIDER=gpt-live npm run dev
```

#### Test Dialects

| Dialect | Language | Region | Priority |
|---------|----------|--------|----------|
| `pt-br` | Portuguese | Brazil | 🔴 High |
| `pt-pt` | Portuguese | Portugal | 🟡 Medium |
| `es-es` | Spanish | Spain | 🔴 High |
| `es-mx` | Spanish | Mexico | 🔴 High |
| `en-us` | English | USA | 🟡 Medium |
| `en-gb` | English | UK | 🟢 Low |

#### Sample Collection (Manual)

1. Open PracticeRoom in browser
2. Select language/dialect from dropdown
3. Record 20+ audio samples per dialect
4. Metrics auto-collect in background
5. Export after each session

**Minimum samples per dialect**: 50 (for statistical significance)

#### Automated Collection

```typescript
import { SpikeTestHarness } from '@/services/voice';

const harness = new SpikeTestHarness();

const config = {
  provider: 'gpt-live',
  dialects: ['pt-br', 'es-es', 'es-mx', 'pt-pt', 'en-us'],
  samplesPerDialect: 50,
};

await harness.runSpikeSuite(config);
harness.printReport('gpt-live-1-spike');
```

#### Success Criteria (Week 1)

- ✅ P95 latency < 300ms on all dialects
- ✅ Success rate > 95%
- ✅ No API errors (rate limiting, auth)
- ✅ Consistent performance throughout week

### Week 2: Economics & Accuracy Validation

**Goal**: Measure WER and cost/minute across dialects

#### Word Error Rate (WER) Measurement

```typescript
// Manually during testing:
// 1. Record audio with known text
// 2. Compare transcription output to original
// 3. Calculate: WER = (S+D+I) / N * 100
//    Where: S=substitutions, D=deletions, I=insertions, N=total words

// Target: WER < 5% on primary dialects
```

#### Cost Analysis

```typescript
const metrics = harness.exportMetrics('gpt-live-1-spike');

// Extract cost data
const totalSessions = metrics.summary.totalSessions;
const totalCost = metrics.summary.averageCostPerMinute * 60; // per hour

// Compare to baseline
const currentCost = 0.00006; // Whisper baseline per minute
const gptLiveCost = metrics.summary.averageCostPerMinute;
const costRatio = gptLiveCost / currentCost;

console.log(`Current (Whisper): $${currentCost}/min`);
console.log(`GPT Live-1: $${gptLiveCost}/min`);
console.log(`Ratio: ${costRatio.toFixed(1)}x`);
```

**Target**: Cost ≤ 1.5x current solution (~$0.00009/min)

#### Metrics Export Format

```json
{
  "exportedAt": "2026-09-23T14:30:00Z",
  "provider": "gpt-live-1-spike",
  "environment": "development",
  "summary": {
    "totalSessions": 250,
    "successRate": 0.972,
    "overallLatencyP95": 285,
    "averageCostPerMinute": 0.000142
  },
  "byDialect": [
    {
      "dialect": "pt-br",
      "language": "Portuguese (Brazil)",
      "samples": 50,
      "latencyMs": {
        "avg": 220,
        "p95": 280,
        "p99": 310
      },
      "costPerMinute": 0.000138
    }
  ],
  "recommendations": [
    "✅ Latency P95 (285ms) is acceptable, slightly below target",
    "⚠️ Cost (0.000142/min) is 2.3x current solution",
    "✅ Success rate (97.2%) is solid"
  ],
  "timestamp": 1695470400000
}
```

## Decision Matrix: Go/No-Go

### Go Criteria (Advance to Internal Beta)

- ✅ P95 latency < 300ms (95%+ of samples)
- ✅ WER < 5% on primary dialects (PT-BR, ES-ES, ES-MX)
- ✅ Cost ≤ 2x current ($0.00012/min acceptable)
- ✅ Success rate ≥ 95%
- ✅ All 5+ dialects supported
- ✅ No API rate limiting issues

### No-Go Criteria (Defer or Pivot)

- ❌ P95 latency > 500ms (unacceptable UX)
- ❌ WER > 12% on any primary dialect
- ❌ Cost > 3x current (unviable economics)
- ❌ Success rate < 90% (reliability issues)
- ❌ Missing critical dialect support
- ❌ Recurring API errors (auth, quota, etc.)

## Analysis & Reporting

### Generate Week 2 Report

```typescript
import { SpikeMetricsExporter } from '@/services/voice';

const harness = new SpikeTestHarness();
const metrics = harness.exportMetrics('gpt-live-1-spike');

// Print human-readable report
console.log(SpikeMetricsExporter.formatForConsole(metrics));

// Export for spreadsheet analysis
const json = JSON.stringify(metrics, null, 2);
// Save to: spike-results-week2.json
```

### Create Comparison Table

| Metric | Current (Whisper) | GPT Live-1 | Status |
|--------|-------------------|-----------|--------|
| Latency P95 | ~150ms | 280ms | ✅ Acceptable |
| WER | <3% | 4.2% | ✅ Good |
| Cost/min | $0.00006 | $0.00014 | ⚠️ 2.3x |
| Success Rate | >99% | 97.2% | ✅ Solid |
| Dialects | 6+ | 5+ | ✅ OK |

## Output Files

Generate these during spike:

1. **spike-metrics-week1.json** — Latency & availability data
2. **spike-metrics-week2.json** — Final comprehensive metrics
3. **spike-report.md** — Written summary & recommendation
4. **spike-decision.txt** — Go/No-Go decision & rationale

## Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | Latency validation | P95 metrics by dialect |
| 2 | WER + cost analysis | Final report + decision |

## References

- **Main Plan**: `docs/spike-gpt-live-technical-inventory.md`
- **Implementation**: `docs/spike-gpt-live-phase-0-implementation.md`
- **Metrics Collector**: `src/services/voice/SpikeMetricsCollector.ts`
- **Test Harness**: `src/services/voice/SpikeTestHarness.ts`
