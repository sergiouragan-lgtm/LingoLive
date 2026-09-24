import { VoiceProvider, VoiceGenerationResult, VoiceOptions } from "./VoiceProvider";
import { VoiceProviderFactory, VoiceProviderType } from "./VoiceProviderFactory";

/**
 * High-level voice service that abstracts provider selection
 * Applications use this instead of directly accessing providers
 */
export class VoiceService {
  /**
   * Generate speech using the active provider
   * Transparently handles metrics logging if benchmark mode is enabled
   */
  static async generateSpeech(
    text: string,
    options?: VoiceOptions
  ): Promise<{
    audio: Buffer;
    provider: string;
    metrics?: Record<string, any>;
  }> {
    const provider = VoiceProviderFactory.getActiveProvider();

    try {
      const result = await provider.generateSpeech(text, options);

      const response: {
        audio: Buffer;
        provider: string;
        metrics?: Record<string, any>;
      } = {
        audio: result.audio,
        provider: result.metadata.provider,
      };

      // Log metrics if in benchmark mode
      if (VoiceProviderFactory.isBenchmarkModeEnabled()) {
        response.metrics = this._formatMetricsForLogging(result);
        console.log(`[VoiceService] ${provider.name} | Latency: ${result.metrics.latencyMs}ms | Cost: $${result.metrics.estimatedCost.toFixed(6)}`);
      }

      return response;
    } catch (error) {
      console.error(`[VoiceService] Speech generation failed:`, error);
      throw error;
    }
  }

  /**
   * Generate speech with explicit provider selection (for testing/comparing)
   */
  static async generateSpeechWithProvider(
    text: string,
    providerType: VoiceProviderType,
    options?: VoiceOptions
  ): Promise<VoiceGenerationResult> {
    const provider = VoiceProviderFactory.getProvider(providerType);
    return provider.generateSpeech(text, options);
  }

  /**
   * Switch active provider at runtime
   */
  static switchProvider(providerType: VoiceProviderType): void {
    VoiceProviderFactory.setActiveProvider(providerType);
  }

  /**
   * Get current configuration
   */
  static async getConfiguration() {
    return VoiceProviderFactory.getConfig();
  }

  /**
   * Enable/disable benchmark mode
   */
  static setBenchmarkMode(enabled: boolean): void {
    VoiceProviderFactory.enableBenchmarkMode(enabled);
    console.log(`[VoiceService] Benchmark mode: ${enabled ? "ENABLED" : "DISABLED"}`);
  }

  /**
   * Get available voices from active provider
   */
  static async getAvailableVoices() {
    const provider = VoiceProviderFactory.getActiveProvider();
    return provider.getAvailableVoices();
  }

  /**
   * Get available voices from specific provider
   */
  static async getAvailableVoicesFromProvider(providerType: VoiceProviderType) {
    const provider = VoiceProviderFactory.getProvider(providerType);
    return provider.getAvailableVoices();
  }

  /**
   * Check if provider supports a language
   */
  static async supportsLanguage(language: string, providerType?: VoiceProviderType) {
    const provider = providerType
      ? VoiceProviderFactory.getProvider(providerType)
      : VoiceProviderFactory.getActiveProvider();

    return provider.supportsLanguage(language);
  }

  /**
   * Health check for active provider
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    provider: string;
  }> {
    const provider = VoiceProviderFactory.getActiveProvider();
    const healthy = await provider.healthCheck();

    return {
      healthy,
      provider: provider.name,
    };
  }

  /**
   * Get estimated cost per minute
   */
  static async getCostPerMinute(providerType?: VoiceProviderType): Promise<number> {
    const provider = providerType
      ? VoiceProviderFactory.getProvider(providerType)
      : VoiceProviderFactory.getActiveProvider();

    return provider.estimateCostPerMinute();
  }

  /**
   * Format metrics for logging
   */
  private static _formatMetricsForLogging(result: VoiceGenerationResult): Record<string, any> {
    return {
      latencyMs: result.metrics.latencyMs,
      audioSizeBytes: result.metrics.audioSize,
      estimatedCostUSD: result.metrics.estimatedCost.toFixed(6),
      provider: result.metadata.provider,
      model: result.metadata.model,
      timestamp: new Date().toISOString(),
    };
  }
}
