# Voice Provider Benchmark Guide

## Architecture Overview

The voice system in LingoLive now uses an **abstract provider pattern** that allows switching between TTS engines without changing application code. This enables:

1. **A/B testing** of different TTS providers
2. **Cost optimization** by comparing providers
3. **Quality evaluation** across pronunciation, naturalness, and dialect support
4. **Fallback mechanisms** if primary provider fails
5. **Gradual migration** from one provider to another

## Current Providers

### 1. ElevenLabs (Current Production)
- **Model**: `eleven_multilingual_v2`
- **Strengths**: High-quality pronunciation, excellent voice variety, stable
- **Cost**: ~$0.24/minute
- **Languages**: 15+ supported
- **Latency**: 1-3 seconds typical
- **Interruption**: Limited (requires full generation before playback)

### 2. Gemini Live (New)
- **Model**: `gemini-2.0-flash-exp`
- **Strengths**: Natural conversation, streaming with interruption, lower cost
- **Cost**: ~$0.10/minute (estimated)
- **Languages**: 20+ supported (including rare dialects)
- **Latency**: <500ms with streaming
- **Interruption**: Native streaming support for natural interruption

## Architecture

```
VoiceService (High-level API)
    ↓
VoiceProviderFactory (Provider selection & caching)
    ↓
VoiceProvider (Abstract interface)
    ├── ElevenLabsProvider
    ├── GeminiLiveProvider
    └── [Future providers]
    
VoiceBenchmark (Testing & comparison)
    ├── Latency measurement
    ├── Cost analysis
    ├── Quality scoring
    └── Detailed reporting
```

## Using the Voice Service

### Basic Usage (Active Provider)

```typescript
import { VoiceService } from "./services/voice/VoiceService";

// Generate speech using active provider (default: ElevenLabs)
const result = await VoiceService.generateSpeech("Hello, how are you?", {
  language: "en",
  voiceId: "21m00Tcm4TlvDq8ikWAM"
});

const audioBuffer = result.audio;
const provider = result.provider; // "ElevenLabs" or "Gemini Live"
```

### Switching Providers at Runtime

```typescript
// Switch to Gemini Live
VoiceService.switchProvider("gemini-live");

// Generate speech with new provider
const result = await VoiceService.generateSpeech("Test");

// Switch back to ElevenLabs
VoiceService.switchProvider("elevenlabs");
```

### Comparing Providers

```typescript
// Get cost per minute for comparison
const elevenLabsCost = await VoiceService.getCostPerMinute("elevenlabs");
const geminiCost = await VoiceService.getCostPerMinute("gemini-live");

// Check language support
const supportsPortuguese = await VoiceService.supportsLanguage("pt-BR", "gemini-live");

// Get available voices
const voices = await VoiceService.getAvailableVoices();
```

## Benchmark System

### Running Benchmarks

#### 1. Full Benchmark Suite
```bash
curl -X POST http://localhost:3000/api/voice/benchmark/run
```

Response includes:
- Latency measurements for each test case
- Audio quality scores
- Cost estimates
- Pronunciation accuracy
- Natural interruption support
- Dialect support scores

#### 2. Provider Comparison
```bash
curl -X POST http://localhost:3000/api/voice/benchmark/compare \
  -H "Content-Type: application/json" \
  -d '{"provider1": "elevenlabs", "provider2": "gemini-live"}'
```

#### 3. Test Custom Text
```bash
curl -X POST http://localhost:3000/api/voice/benchmark/test-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Olá, como você está?"}'
```

### Benchmark Mode (Automatic Metrics Logging)

Enable automatic logging of all voice generation metrics:

```bash
curl -X POST http://localhost:3000/api/voice/benchmark-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

When enabled, every speech generation logs:
- Latency (milliseconds)
- Audio size (bytes)
- Estimated cost (USD)
- Provider name
- Timestamp

## Test Cases

The benchmark suite tests each provider with diverse scenarios:

| Test Case | Purpose |
|-----------|---------|
| SHORT | Brief greeting (latency baseline) |
| MEDIUM | Pangram with all letters (pronunciation) |
| LONG | Educational paragraph (naturalness) |
| PORTUGUESE | Native language text (dialect support) |
| SPANISH | Second language (multi-language) |
| NUMBERS | Numeric pronunciation (digits/decimals) |
| PUNCTUATION | Pauses and emphasis (prosody) |

## Benchmark Metrics

### Performance
- **Latency**: Time from request to audio ready (ms)
- **Audio Size**: Compressed audio bytes (quality indicator)
- **Cost**: Estimated USD per request

### Quality (Subjective)
- **Audio Quality**: 1-10 scale (heuristic based on size/clarity)
- **Pronunciation**: 1-10 scale (how naturally words are pronounced)
- **Natural Interruption**: 1-10 scale (ability to interrupt mid-sentence)
- **Dialect Support**: 1-10 scale (accent authenticity for language)

### Winner Categories
- **Latency Winner**: Fastest response time
- **Cost Winner**: Lowest estimated cost
- **Quality Winner**: Highest quality score
- **Balanced Winner**: Best overall (33% weight each for speed, cost, quality)

## Migration Strategy

### Phase 1: Benchmarking (Current)
- Both providers running in parallel
- Benchmark mode enabled for data collection
- No user-facing changes
- Daily benchmark runs to gather metrics

### Phase 2: A/B Testing
- Percentage-based traffic splitting (e.g., 90% ElevenLabs, 10% Gemini)
- User feedback collection
- Monitor real-world quality metrics
- Cost tracking

### Phase 3: Gradual Rollout
- Increase Gemini traffic based on quality metrics
- Monitor for any issues in production
- Fallback to ElevenLabs if needed

### Phase 4: Full Migration (if successful)
- Set Gemini as primary provider
- Keep ElevenLabs as fallback
- Update monitoring and SLAs

## Configuration

### Environment Variables

```bash
# Set active provider (default: elevenlabs)
VOICE_PROVIDER=elevenlabs
# or
VOICE_PROVIDER=gemini-live

# Enable benchmark mode
VOICE_BENCHMARK_MODE=true

# API Keys
ELEVENLABS_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

### Programmatic Configuration

```typescript
import { VoiceProviderFactory } from "./services/voice/VoiceProviderFactory";

VoiceProviderFactory.configure({
  activeProvider: "gemini-live",
  benchmarkMode: true,
  fallbackProvider: "elevenlabs"
});
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/voice/generate` | Generate speech with active provider |
| GET | `/api/voice/config` | Get current configuration |
| GET | `/api/voice/health` | Health check |
| GET | `/api/voice/voices` | List available voices |
| GET | `/api/voice/cost/:provider` | Get cost per minute |
| POST | `/api/voice/switch-provider` | Switch active provider |
| POST | `/api/voice/benchmark-mode` | Enable/disable metrics logging |
| POST | `/api/voice/benchmark/run` | Run full benchmark |
| POST | `/api/voice/benchmark/compare` | Compare two providers |
| POST | `/api/voice/benchmark/test-text` | Test custom text |

## Important Notes

⚠️ **Do NOT migrate to Gemini Live in production without:**
1. ✅ Running comprehensive benchmarks
2. ✅ Collecting at least 1 week of quality metrics
3. ✅ A/B testing with real users
4. ✅ Evaluating pronunciation accuracy with native speakers
5. ✅ Verifying cost savings vs. quality trade-offs
6. ✅ Setting up monitoring and fallback mechanisms

The new provider stack is in benchmark mode only. Switching to production requires:
- Executive approval after reviewing benchmark results
- Updated SLAs reflecting new provider characteristics
- Monitoring dashboard comparing both providers
- Rollback plan if quality issues arise

## Next Steps

1. Run daily benchmarks for 1 week
2. Share benchmark results with product team
3. Plan A/B test design (traffic split %)
4. Set up user feedback collection
5. Review results after 2 weeks of A/B testing
6. Make final decision based on data, not hype
