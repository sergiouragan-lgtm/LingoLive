/**
 * Voice Provider System - Main Exports
 *
 * Usage:
 * import { VoiceService, VoiceBenchmark } from "./services/voice";
 */

export { VoiceService } from "./VoiceService";
export type { VoiceProvider, VoiceGenerationResult, VoiceOptions, VoiceMetrics } from "./VoiceProvider";
export { VoiceProviderFactory } from "./VoiceProviderFactory";
export type { VoiceProviderType, VoiceProviderConfig } from "./VoiceProviderFactory";
export { ElevenLabsProvider } from "./ElevenLabsProvider";
export { GeminiLiveProvider } from "./GeminiLiveProvider";
export { VoiceBenchmark } from "./VoiceBenchmark";
export type { BenchmarkResult, BenchmarkComparison } from "./VoiceBenchmark";
