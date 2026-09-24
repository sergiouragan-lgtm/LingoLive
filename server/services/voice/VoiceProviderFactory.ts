import { VoiceProvider } from "./VoiceProvider";
import { ElevenLabsProvider } from "./ElevenLabsProvider";
import { GeminiLiveProvider } from "./GeminiLiveProvider";

export type VoiceProviderType = "elevenlabs" | "gemini-live";

/**
 * Configuration for voice provider selection
 * Can be set via environment variables or explicitly in factory
 */
export interface VoiceProviderConfig {
  activeProvider: VoiceProviderType;
  benchmarkMode: boolean; // If true, logs metrics for all requests
  fallbackProvider?: VoiceProviderType;
}

// Default config - can be overridden
let globalConfig: VoiceProviderConfig = {
  activeProvider: (process.env.VOICE_PROVIDER as VoiceProviderType) || "elevenlabs",
  benchmarkMode: process.env.VOICE_BENCHMARK_MODE === "true",
  fallbackProvider: "elevenlabs",
};

const providers = new Map<VoiceProviderType, VoiceProvider>();

/**
 * Factory for creating and managing voice providers
 * Implements provider caching and fallback logic
 */
export class VoiceProviderFactory {
  static configure(config: Partial<VoiceProviderConfig>) {
    globalConfig = { ...globalConfig, ...config };
  }

  static getActiveProvider(): VoiceProvider {
    if (!providers.has(globalConfig.activeProvider)) {
      this._initializeProvider(globalConfig.activeProvider);
    }
    return providers.get(globalConfig.activeProvider)!;
  }

  static getProvider(type: VoiceProviderType): VoiceProvider {
    if (!providers.has(type)) {
      this._initializeProvider(type);
    }
    return providers.get(type)!;
  }

  static getAllProviders(): Map<VoiceProviderType, VoiceProvider> {
    return new Map(providers);
  }

  static setActiveProvider(type: VoiceProviderType) {
    if (!providers.has(type)) {
      this._initializeProvider(type);
    }
    globalConfig.activeProvider = type;
    console.log(`[VoiceProvider] Active provider switched to: ${type}`);
  }

  static enableBenchmarkMode(enabled: boolean = true) {
    globalConfig.benchmarkMode = enabled;
  }

  static isBenchmarkModeEnabled(): boolean {
    return globalConfig.benchmarkMode;
  }

  private static _initializeProvider(type: VoiceProviderType) {
    let provider: VoiceProvider;

    switch (type) {
      case "elevenlabs":
        provider = new ElevenLabsProvider();
        break;
      case "gemini-live":
        provider = new GeminiLiveProvider();
        break;
      default:
        throw new Error(`Unknown voice provider: ${type}`);
    }

    providers.set(type, provider);
    console.log(`[VoiceProvider] Initialized: ${provider.name} (${provider.modelId})`);
  }

  // For testing: direct access to global config
  static getGlobalConfig() {
    return globalConfig;
  }

  static async getConfig(): Promise<{
    activeProvider: string;
    benchmarkMode: boolean;
    providers: Array<{
      name: string;
      model: string;
      healthy: boolean;
    }>;
  }> {
    const allProviders = this.getAllProviders();
    const providerStatus = [];

    for (const [type, provider] of allProviders) {
      const healthy = await provider.healthCheck();
      providerStatus.push({
        name: provider.name,
        model: provider.modelId,
        healthy,
      });
    }

    return {
      activeProvider: globalConfig.activeProvider,
      benchmarkMode: globalConfig.benchmarkMode,
      providers: providerStatus,
    };
  }
}
