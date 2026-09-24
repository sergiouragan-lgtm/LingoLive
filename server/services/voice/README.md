# Voice Provider System

Advanced TTS provider abstraction for LingoLive enabling:
- **A/B Testing**: Compare ElevenLabs vs Gemini Live without code changes
- **Cost Optimization**: Identify cheapest provider matching quality standards
- **Quality Benchmarking**: 7 test cases measuring latency, pronunciation, dialect support
- **Runtime Switching**: Change providers mid-deployment for testing
- **Graceful Fallback**: Automatic failover if primary provider fails

## Files Structure

```
voice/
├── VoiceProvider.ts              # Abstract interface
├── ElevenLabsProvider.ts         # Current production provider
├── GeminiLiveProvider.ts         # Experimental Gemini provider
├── VoiceProviderFactory.ts       # Provider instantiation & config
├── VoiceService.ts               # High-level application API
├── VoiceBenchmark.ts             # Benchmark suite (7 test cases)
├── __tests__/
│   └── VoiceProvider.test.ts     # Unit & integration tests
├── index.ts                      # Main exports
├── README.md                     # This file
├── QUICK_START.md                # Quick reference guide
├── VOICE_BENCHMARK_GUIDE.md      # Detailed documentation
└── IMPLEMENTATION.md             # Architecture overview
```

## Start Using

### 1. Basic Usage
```typescript
import { VoiceService } from "./services/voice";

const result = await VoiceService.generateSpeech("Hello world");
const audioBuffer = result.audio;
```

### 2. Run Benchmarks
```bash
# Start server
npm run dev

# Run full benchmark
curl -X POST http://localhost:3000/api/voice/benchmark/run

# Compare providers
curl -X POST http://localhost:3000/api/voice/benchmark/compare \
  -d '{"provider1": "elevenlabs", "provider2": "gemini-live"}'
```

### 3. Switch Providers
```bash
# Switch to Gemini Live
curl -X POST http://localhost:3000/api/voice/switch-provider \
  -d '{"provider": "gemini-live"}'

# All subsequent requests use Gemini Live
# No code changes needed
```

## Key Metrics

| Metric | ElevenLabs | Gemini Live |
|--------|-----------|------------|
| Cost/min | $0.24 | $0.10 (-58%) |
| Latency | 1-3s | <500ms |
| Languages | 15+ | 20+ |
| Pronunciation | 9/10 | 8/10 |
| Interruption | Limited | Native |

## Decision Flowchart

```
Start Benchmark
    ↓
Quality ≥ 95%? ──NO──→ Stay with ElevenLabs
    ↓ YES
Native speaker validation ──FAIL──→ Stay with ElevenLabs
    ↓ PASS
Cost savings > 30%? ──NO──→ Evaluate ROI
    ↓ YES
A/B Test (1-2 weeks)
    ↓
User satisfaction ≥ 95%? ──NO──→ Stay with ElevenLabs
    ↓ YES
Approve Gemini Live ──→ Gradual Rollout (10% → 100%)
```

## Migration Safeguards

✅ **Before any production migration:**
1. ✅ Benchmark data proves parity (1 week)
2. ✅ Native speaker validation
3. ✅ A/B test with real users
4. ✅ Executive approval
5. ✅ Fallback mechanism tested

## Environment Setup

```bash
# .env
VOICE_PROVIDER=elevenlabs              # Current production
VOICE_BENCHMARK_MODE=false             # Enable for data collection
ELEVENLABS_API_KEY=sk-...              # Required
GOOGLE_API_KEY=AIza...                 # Required for Gemini
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/voice/generate` | Generate speech |
| POST | `/api/voice/switch-provider` | Change active provider |
| POST | `/api/voice/benchmark-mode` | Enable metrics logging |
| POST | `/api/voice/benchmark/run` | Full benchmark |
| POST | `/api/voice/benchmark/compare` | Compare two providers |
| POST | `/api/voice/benchmark/test-text` | Test custom text |
| GET | `/api/voice/config` | Get configuration |
| GET | `/api/voice/health` | Provider health check |

## Testing

```bash
# Run unit tests
npm test -- VoiceProvider.test.ts

# Test individual providers
npm test -- --grep "ElevenLabsProvider"
npm test -- --grep "GeminiLiveProvider"

# Performance tests
npm test -- --grep "Performance"
```

## Documentation

- **QUICK_START.md** - Developer quick reference
- **VOICE_BENCHMARK_GUIDE.md** - Detailed guide with all options
- **../VOICE_PROVIDER_IMPLEMENTATION.md** - Architecture & timeline
- **Test file** - Example usage patterns

## Support

For issues or questions:
1. Check QUICK_START.md for common scenarios
2. Review test file for integration examples
3. See VOICE_BENCHMARK_GUIDE.md for detailed API
4. Run `/api/voice/config` to inspect current state

---

**Remember**: This is a benchmark system, not a migration. Let data drive decisions, not hype.
