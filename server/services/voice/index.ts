/**
 * Voice Provider System - Main Exports
 *
 * Usage:
 * import { VoiceService, VoiceBenchmark } from "./services/voice";
 */

export { VoiceService } from "./VoiceService";
export { VoiceProvider, VoiceGenerationResult, VoiceOptions, VoiceMetrics } from "./VoiceProvider";
export { VoiceProviderFactory, VoiceProviderType, VoiceProviderConfig } from "./VoiceProviderFactory";
export { ElevenLabsProvider } from "./ElevenLabsProvider";
export { GeminiLiveProvider } from "./GeminiLiveProvider";
export { VoiceBenchmark, BenchmarkResult, BenchmarkComparison } from "./VoiceBenchmark";
