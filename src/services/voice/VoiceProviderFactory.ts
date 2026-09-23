import { VoiceTutorProvider } from './types';
import { CurrentVoiceProvider } from './CurrentVoiceProvider';
import { GPTLiveAdapter } from './GPTLiveAdapter';

export type VoiceProviderType = 'current' | 'gpt-live';

/**
 * Voice Provider Factory
 * Manages provider selection and feature flags
 *
 * Environment variables:
 * - VOICE_PROVIDER: 'current' | 'gpt-live' (default: 'current')
 * - OPENAI_API_KEY: Required for gpt-live provider
 */
export class VoiceProviderFactory {
  private static currentProvider: CurrentVoiceProvider | null = null;
  private static gptLiveProvider: GPTLiveAdapter | null = null;

  static getProvider(type?: VoiceProviderType): VoiceTutorProvider {
    const providerType = type || this.getConfiguredProvider();

    if (providerType === 'gpt-live') {
      if (!this.gptLiveProvider) {
        this.gptLiveProvider = new GPTLiveAdapter();
      }
      return this.gptLiveProvider;
    }

    if (!this.currentProvider) {
      this.currentProvider = new CurrentVoiceProvider();
    }
    return this.currentProvider;
  }

  static getConfiguredProvider(): VoiceProviderType {
    if (typeof process !== 'undefined' && process.env) {
      const env = process.env.VOICE_PROVIDER as VoiceProviderType;
      if (env === 'gpt-live' || env === 'current') {
        return env;
      }
    }
    return 'current';
  }

  static isGPTLiveEnabled(): boolean {
    return this.getConfiguredProvider() === 'gpt-live';
  }

  /**
   * SPIKE PHASE: Get provider for A/B testing
   * Allows running both providers in parallel for metrics
   */
  static async getProviderWithFallback(): Promise<VoiceTutorProvider> {
    const primary = this.getProvider();

    if (await primary.isAvailable()) {
      return primary;
    }

    // Fallback to current provider if primary unavailable
    console.warn('[VoiceProviderFactory] Primary provider unavailable, falling back to current');
    return this.getProvider('current');
  }
}
