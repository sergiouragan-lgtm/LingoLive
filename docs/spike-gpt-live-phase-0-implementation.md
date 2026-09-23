# Spike Phase 0: ChatGPT Live-1 Implementation Guide

## Overview

This document describes the Phase 0 (2-week spike) technical implementation for ChatGPT Live-1 integration into LingoLive.

## Architecture

### Provider Abstraction Pattern

```
Application Layer (PracticeRoom, AIAssistant, etc.)
         ↓
    VoiceProviderFactory (feature flag management)
         ↓
    VoiceTutorProvider (abstract interface)
         ├── CurrentVoiceProvider (baseline: Whisper)
         └── GPTLiveAdapter (spike validation)
```

### Service Layer

| Component | Purpose | Status |
|-----------|---------|--------|
| `VoiceTutorProvider` (interface) | Contract for voice providers | ✅ Complete |
| `CurrentVoiceProvider` | Wraps WhisperService (baseline) | ✅ Complete |
| `GPTLiveAdapter` | ChatGPT Live-1 implementation | 🔨 Spike Phase |
| `VoiceProviderFactory` | Feature flag + provider selection | ✅ Complete |
| `SpikeMetricsCollector` | Metrics tracking for validation | ✅ Complete |

## Feature Flag Setup

### Environment Variables

```bash
# Select provider
VOICE_PROVIDER=current       # Default: WhisperService
VOICE_PROVIDER=gpt-live      # Spike: GPTLiveAdapter

# GPT Live authentication
OPENAI_API_KEY=sk-...        # Required for gpt-live provider
```

### Usage in Code

```typescript
import { VoiceProviderFactory } from '@/services/voice';

// Get configured provider
const provider = VoiceProviderFactory.getProvider();

// Or explicitly select
const current = VoiceProviderFactory.getProvider('current');
const gptLive = VoiceProviderFactory.getProvider('gpt-live');

// Check if GPT Live enabled
if (VoiceProviderFactory.isGPTLiveEnabled()) {
  console.log('Running GPT Live-1 spike variant');
}
```

## Spike Validation Checklist

### Phase 0a: Infrastructure (Week 1)

- [x] Design VoiceTutorProvider interface
- [x] Implement CurrentVoiceProvider wrapper
- [x] Implement GPTLiveAdapter (stub)
- [x] Create VoiceProviderFactory + feature flag
- [x] Build SpikeMetricsCollector
- [ ] Integrate into PracticeRoom component
- [ ] Integrate into AIAssistant component

### Phase 0b: Metrics Collection (Week 2)

- [ ] Collect latency baseline (current provider)
- [ ] Collect latency from GPT Live-1
- [ ] Measure WER on 3+ dialects:
  - [ ] Portuguese (PT-BR)
  - [ ] Spanish (ES-ES)
  - [ ] Spanish (ES-MX)
- [ ] Estimate cost/minute
- [ ] Document full-duplex interrupt behavior
- [ ] Generate spike report

## Success Criteria (Go/No-Go)

### Latency Validation
- **Target**: P95 < 300ms (vs current ~150ms)
- **Failure threshold**: > 700ms
- **Measurement**: 100+ samples per dialect

### Cost Analysis
- **Target**: ≤1.5x current solution
- **Current baseline**: ~$0.00006/min (Whisper)
- **GPT Live estimate**: ~$0.00015/min
- **Ratio**: ~2.5x (needs verification in spike)

### Accuracy (WER)
- **Target**: < 5% across all tested dialects
- **Floor**: < 12% (below floor = No-Go)

### Reliability
- **Success rate**: ≥ 95%
- **Failure mode**: Graceful fallback to current provider

## Integration Points

### PracticeRoom Component

```typescript
import { VoiceProviderFactory } from '@/services/voice';

export const PracticeRoom: React.FC<Props> = ({ language, dialect }) => {
  const provider = VoiceProviderFactory.getProvider();

  const handleStartSession = async () => {
    const sessionId = await provider.startSession({
      language,
      dialect,
      proficiency: level,
      userId: currentUser?.uid
    });
    setSessionId(sessionId);
  };

  const handleProcessAudio = async (audioBlob: Blob) => {
    const response = await provider.processAudio(sessionId, audioBlob);
    setTranscribedText(response.transcribedText);
  };
};
```

### Metrics Tracking

```typescript
import { SpikeMetricsCollector } from '@/services/voice';

const metricsCollector = new SpikeMetricsCollector();

// During session
metricsCollector.recordLatency(dialect, latencyMs);
metricsCollector.recordCost(dialect, costUsd);
metricsCollector.recordSession(success);

// End of spike
const report = metricsCollector.generateReport('gpt-live-1-spike');
console.log(report);
```

## Testing Strategy

### Unit Tests
- ✅ VoiceProviderFactory selection logic
- ✅ SpikeMetricsCollector calculations
- [ ] CurrentVoiceProvider audio processing
- [ ] GPTLiveAdapter mock latency simulation

### Integration Tests
- [ ] PracticeRoom with multiple providers
- [ ] AIAssistant provider integration
- [ ] Feature flag behavior
- [ ] Fallback logic

### Manual Spike Testing
1. **Latency measurement**:
   ```bash
   VOICE_PROVIDER=gpt-live npm run dev
   # Open PracticeRoom → speak → measure roundtrip latency
   ```

2. **Dialect testing** (require 20+ samples each):
   - Brazilian Portuguese (PT-BR)
   - European Spanish (ES-ES)
   - Mexican Spanish (ES-MX)
   - Additional: EN-US, EN-GB

3. **Cost tracking**:
   - Run 1-hour session
   - Log estimated costs per API call
   - Calculate cost/minute

## Expected Metrics (Baseline)

### Current Provider (Whisper)
- Latency P95: ~150ms
- Cost: ~$0.00006/min
- WER: <3% (established)
- Reliability: >99%

### GPT Live-1 Target
- Latency P95: <300ms (2x acceptable)
- Cost: ≤$0.00015/min (2.5x baseline)
- WER: <5% on supported dialects
- Reliability: >95%

## Spike Deliverables

1. **Technical report**:
   - Latency profiles by dialect
   - WER measurements
   - Cost analysis
   - Interrupt handling assessment

2. **Code**:
   - Working GPTLiveAdapter
   - Integration tests
   - Metrics collector output

3. **Decision gate**:
   - Go: Proceed to Internal Beta (4 weeks)
   - No-Go: Defer or pivot to alternative approach

## References

- **Main Spike Plan**: `docs/spike-gpt-live-technical-inventory.md`
- **OpenAI Live API**: https://platform.openai.com/docs/api-reference/realtime
- **Architecture Diagram**: Embedded in PR #52
