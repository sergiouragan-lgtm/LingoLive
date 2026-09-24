# Quick Start: Voice Provider System

## For Developers

### Using the Voice Service in Your Code

```typescript
import { VoiceService } from "./services/voice";

// Generate speech with active provider (default: ElevenLabs)
const result = await VoiceService.generateSpeech(
  "Olá, como você está?",
  { language: "pt-BR" }
);

// result.audio is a Buffer containing the audio
// result.provider tells you which provider was used
```

### Switching Providers at Runtime

```typescript
// Switch to Gemini Live
VoiceService.switchProvider("gemini-live");

// Generate speech with new provider
const result = await VoiceService.generateSpeech("Test");

// Switch back
VoiceService.switchProvider("elevenlabs");
```

### Enabling Metrics Collection

```typescript
// Start logging metrics for all voice generation
VoiceService.setBenchmarkMode(true);

// All subsequent generateSpeech calls will log:
// - Latency (ms)
// - Audio size (bytes)
// - Estimated cost (USD)
// - Provider name
// - Timestamp
```

### Getting Provider Information

```typescript
// Get configuration
const config = await VoiceService.getConfiguration();
// {
//   activeProvider: "elevenlabs",
//   benchmarkMode: false,
//   providers: [
//     { name: "ElevenLabs", model: "...", healthy: true },
//     { name: "Gemini Live", model: "...", healthy: false }
//   ]
// }

// Check if provider is healthy
const health = await VoiceService.healthCheck();
// { healthy: true, provider: "ElevenLabs" }

// Get available voices
const voices = await VoiceService.getAvailableVoices();
// Array of { id, name, language, gender, accents }

// Get cost per minute
const cost = await VoiceService.getCostPerMinute();
// 0.24 (dollars per minute)
```

## For QA / Product Team

### Running Benchmarks

**Start the server:**
```bash
npm run dev
```

**Run full benchmark suite:**
```bash
curl -X POST http://localhost:3000/api/voice/benchmark/run | jq
```

Expected output:
```json
{
  "results": {
    "summary": {
      "providers": [
        {
          "name": "ElevenLabs",
          "avgLatencyMs": 1250,
          "avgCost": 0.000042,
          "avgQualityScore": 8.5,
          "healthStatus": true
        },
        {
          "name": "Gemini Live",
          "avgLatencyMs": 800,
          "avgCost": 0.000020,
          "avgQualityScore": 8.0,
          "healthStatus": true
        }
      ],
      "winner": {
        "latency": "Gemini Live",
        "cost": "Gemini Live",
        "quality": "ElevenLabs",
        "balanced": "Gemini Live"
      }
    }
  }
}
```

**Compare two providers directly:**
```bash
curl -X POST http://localhost:3000/api/voice/benchmark/compare \
  -H "Content-Type: application/json" \
  -d '{"provider1": "elevenlabs", "provider2": "gemini-live"}' | jq
```

**Test a specific sentence:**
```bash
curl -X POST http://localhost:3000/api/voice/benchmark/test-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Olá, como você está? Aprender português é divertido."}' | jq
```

**Switch provider and test:**
```bash
# Switch to Gemini
curl -X POST http://localhost:3000/api/voice/switch-provider \
  -H "Content-Type: application/json" \
  -d '{"provider": "gemini-live"}'

# Generate audio
curl -X POST http://localhost:3000/api/voice/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Test", "language": "pt-BR"}' \
  --output test_audio.mp3

# Check response headers for metrics
curl -v -X POST http://localhost:3000/api/voice/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Test"}' 2>&1 | grep "X-Voice"

# Output:
# X-Voice-Provider: Gemini Live
# X-Voice-Latency-Ms: 450
# X-Voice-Cost-Usd: 0.000020
```

## For Data Analysis

### Collecting Benchmark Data

**Enable continuous metrics collection:**
```bash
curl -X POST http://localhost:3000/api/voice/benchmark-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

**Run hourly benchmarks (shell script):**
```bash
#!/bin/bash

for i in {1..24}; do
  echo "Run $i at $(date)"
  curl -X POST http://localhost:3000/api/voice/benchmark/run > "benchmark_run_$i.json"
  sleep 3600  # 1 hour
done
```

**Parse metrics from logs:**
```bash
# Get all latency measurements
grep "latencyMs" logs/*.log | awk -F: '{sum+=$2; count++} END {print "Avg latency: " sum/count "ms"}'

# Get cost distribution
grep "estimatedCostUSD" logs/*.log | awk -F: '{print $2}' | sort -n
```

## Configuration

### Environment Variables

```bash
# Which provider to use (default: elevenlabs)
VOICE_PROVIDER=elevenlabs

# Enable benchmark metrics logging (default: false)
VOICE_BENCHMARK_MODE=true

# API Keys
ELEVENLABS_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

### Programmatic Configuration

```typescript
import { VoiceProviderFactory } from "./services/voice";

VoiceProviderFactory.configure({
  activeProvider: "gemini-live",
  benchmarkMode: true,
  fallbackProvider: "elevenlabs"
});
```

## Troubleshooting

### "ELEVENLABS_API_KEY is required"
```bash
# Set the API key
export ELEVENLABS_API_KEY=your_key_here
```

### "GOOGLE_API_KEY is required" (for Gemini)
```bash
# Set the API key
export GOOGLE_API_KEY=your_key_here
```

### Health check failing
```bash
# Check which provider is active
curl http://localhost:3000/api/voice/config | jq '.activeProvider'

# Check health of all providers
curl http://localhost:3000/api/voice/health
```

### Benchmark taking too long
Benchmarks run 7 test cases × N providers. Expected time:
- 2 providers: 30-60 seconds
- Slow network: up to 2 minutes

To test fewer cases, use `/benchmark/test-text` instead.

## Integration Checklist

- [ ] VoiceService imported in your module
- [ ] Error handling added for API calls
- [ ] Benchmark mode enabled in dev/staging
- [ ] Metrics collected for 1 week baseline
- [ ] Team reviewed benchmark results
- [ ] Decision made: Keep, Migrate, or Hybrid
- [ ] Monitoring dashboard set up
- [ ] Fallback mechanism tested
- [ ] Documentation updated

## Performance Expectations

| Operation | Typical Time |
|-----------|-------------|
| Single speech generation | 1-3 seconds |
| Full benchmark (2 providers) | 30-60 seconds |
| Provider switch | <10ms |
| Health check | 100-500ms |

## Next Steps

1. **This week**: Run benchmarks, collect data
2. **Next week**: Quality evaluation with native speakers
3. **Week 3**: A/B test with real users (10% Gemini)
4. **Week 4**: Decision and rollout plan

See `VOICE_BENCHMARK_GUIDE.md` for detailed information.
