/**
 * Abstract voice generation provider interface
 * Enables switching between TTS engines without changing application code
 */

export interface VoiceMetrics {
  startTime: number;
  endTime: number;
  latencyMs: number;
  audioSize: number;
  estimatedCost: number;
}

export interface VoiceOptions {
  voiceId?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry';
}

export interface VoiceGenerationResult {
  audio: Buffer;
  metrics: VoiceMetrics;
  metadata: {
    provider: string;
    voiceId: string;
    language: string;
    model: string;
  };
}

export abstract class VoiceProvider {
  abstract name: string;
  abstract modelId: string;

  /**
   * Generate audio from text
   */
  abstract generateSpeech(text: string, options?: VoiceOptions): Promise<VoiceGenerationResult>;

  /**
   * Get available voices for this provider
   */
  abstract getAvailableVoices(): Promise<Array<{
    id: string;
    name: string;
    language: string;
    gender: string;
    accents?: string[];
  }>>;

  /**
   * Estimate cost per minute of audio
   */
  abstract estimateCostPerMinute(): Promise<number>;

  /**
   * Health check for provider
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Validate if provider supports specific language
   */
  abstract supportsLanguage(language: string): Promise<boolean>;
}
