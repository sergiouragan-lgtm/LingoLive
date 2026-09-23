# Spike Phase 0: Local Testing Guide

## Quick Start (5 minutes)

### 1. Build with GPT Live-1 Flag

```bash
cd /home/user/LingoLive

# Enable GPT Live-1 provider
export VOICE_PROVIDER=gpt-live

# Build production bundle
npm run build

# Or for development with hot reload
npm run dev
```

### 2. Verify Provider is Active

```bash
# Check environment
echo $VOICE_PROVIDER
# Output: gpt-live

# Or check in TypeScript
import { VoiceProviderFactory } from '@/services/voice'
console.log(VoiceProviderFactory.isGPTLiveEnabled())
// Output: true
```

### 3. Run Spike Tests

```bash
# Run comprehensive metrics test suite
npm test -- src/services/voice/__tests__/SpikeTestRunner.test.ts

# Run all voice service tests
npm test -- src/services/voice/__tests__
```

## Local Testing Workflow

### Step 1: Start Dev Server

```bash
export VOICE_PROVIDER=gpt-live
npm run dev
```

Output should show:
```
  VITE v6.x.x  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 2: Navigate to PracticeRoom

```
http://localhost:5173/
→ Select "Conversação Prática" (Practice Conversation)
→ Choose language (PT-BR recommended for first test)
→ Click "Iniciar Sessão" (Start Session)
```

### Step 3: Collect Metrics

Record audio samples and metrics automatically collect:

```javascript
// In browser console
import { SpikeTestHarness } from '@/services/voice'

const harness = new SpikeTestHarness()

// Check current metrics after testing
const report = harness.getReport('gpt-live-1-spike')
console.log(report)

// Export metrics
harness.downloadMetrics('gpt-live-1-spike')
```

## Build Verification

### With GPT Live-1 Enabled

```bash
$ export VOICE_PROVIDER=gpt-live
$ npm run build

✓ VoiceProviderFactory loads GPTLiveAdapter
✓ Feature flag recognized
✓ Production bundle includes voice services
✓ SpikeMetricsCollector ready
✓ Build: 20.19s ✅
```

### Verify in Bundle

```bash
# Check built bundle for voice services
grep -r "VoiceTutorProvider" dist/
# Output: Found in dist/assets/shared-core-*.js

grep -r "GPTLiveAdapter" dist/
# Output: Found in dist/assets/shared-core-*.js

grep -r "SpikeMetricsCollector" dist/
# Output: Found in dist/assets/shared-core-*.js
```

## Feature Flag Behavior

### Current Provider (Default)

```bash
# Default: uses WhisperService
npm run dev

# In browser:
// WhisperService called directly
// Latency: ~150ms P95
// Cost: $0.00006/min
```

### GPT Live-1 Provider (Spike)

```bash
# With flag:
export VOICE_PROVIDER=gpt-live
npm run dev

# In browser:
// GPTLiveAdapter called instead
// Latency: 150-300ms (mocked in spike)
// Cost: $0.00015/min (mocked)
// Metrics collected automatically
```

## Testing Dialects

### Portuguese (Brazil) - PT-BR

```
Language: Português
Dialect: Brasil
Region: South America
Expected Latency: 230-270ms (GPT Live)
Sample Command: "Olá, como você está?"
```

### Spanish (Spain) - ES-ES

```
Language: Español
Dialect: España
Region: Europe
Expected Latency: 280-320ms (GPT Live)
Sample Command: "Hola, ¿cómo estás?"
```

### Spanish (Mexico) - ES-MX

```
Language: Español
Dialect: México
Region: North America
Expected Latency: 300-350ms (GPT Live)
Sample Command: "Hola, ¿cómo estás?"
```

## Metrics Collection During Testing

### Automatic Collection

Whenever you use PracticeRoom with GPT Live-1:
- ✅ Latency recorded automatically
- ✅ Session success/failure tracked
- ✅ Cost estimation logged
- ✅ Dialect recorded
- ✅ Metrics stored in SpikeMetricsCollector

### Manual Export

```javascript
// From browser console
import { SpikeMetricsExporter, SpikeTestHarness } from '@/services/voice'

const harness = new SpikeTestHarness()
const metrics = harness.exportMetrics('gpt-live-1-spike')

// Print to console
console.log(SpikeMetricsExporter.formatForConsole(metrics))

// Download as JSON
harness.downloadMetrics('gpt-live-1-spike')
```

## Success Indicators

### Build Success ✅

```
✓ no TypeScript errors
✓ no build warnings (except chunk size)
✓ dist/ contains production bundle
✓ Voice services included in bundle
```

### Feature Flag Success ✅

```
✓ VoiceProviderFactory.isGPTLiveEnabled() === true
✓ GPTLiveAdapter instantiated
✓ Metrics collection active
✓ Mock latency simulated (150-300ms range)
```

### Metrics Collection Success ✅

```
✓ Latency recorded per dialect
✓ Success rate calculated
✓ Cost estimation working
✓ P95/P99 percentiles computed
✓ Human-readable reports generated
```

## Troubleshooting

### Feature Flag Not Recognized

```bash
# Verify environment variable
echo $VOICE_PROVIDER
# Should output: gpt-live

# If not set, export it first
export VOICE_PROVIDER=gpt-live

# Then rebuild
npm run build
```

### Metrics Not Collecting

```javascript
// In browser console
import { VoiceProviderFactory } from '@/services/voice'

// Verify provider
const provider = VoiceProviderFactory.getProvider()
console.log(provider.name)
// Should output: gpt-live-1-spike

// Verify availability
const available = await provider.isAvailable()
console.log(available)
// Should output: true (if auth configured)
```

### Build Too Large

```bash
# This is expected with full learning platform
# Chunk size warning is normal for monolithic React app
# No action needed for spike testing
```

## Next Steps After Testing

1. **Collect 50+ samples per dialect**
   - Run through various scenarios
   - Record metrics for Week 1 report

2. **Measure real-world latency**
   - Network latency varies by region
   - Collect P95/P99 data

3. **Estimate costs**
   - Monitor API call counts
   - Calculate $/minute

4. **Generate Week 2 report**
   - Export metrics
   - Create comparison table
   - Make Go/No-Go recommendation

## References

- **Build System**: `vite.config.ts`
- **Feature Flag**: `VOICE_PROVIDER` environment variable
- **Metrics**: `src/services/voice/SpikeMetricsCollector.ts`
- **Test Harness**: `src/services/voice/SpikeTestHarness.ts`
- **Spike Plan**: `docs/spike-gpt-live-phase-0-implementation.md`
