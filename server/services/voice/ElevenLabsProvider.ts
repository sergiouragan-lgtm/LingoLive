import * as ElevenLabs from "@elevenlabs/client";
import { VoiceProvider, VoiceGenerationResult, VoiceOptions } from "./VoiceProvider";

export class ElevenLabsProvider extends VoiceProvider {
  name = "ElevenLabs";
  modelId = "eleven_multilingual_v2";

  private client: any;
  private apiKey: string;

  // Mapping of language codes to ElevenLabs supported languages
  private supportedLanguages = new Set([
    'en', 'pt', 'pt-BR', 'pt-PT',
    'es', 'es-MX', 'fr', 'de', 'it', 'ja', 'zh', 'ko', 'ru', 'ar'
  ]);

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || '';
    this.initializeClient();
  }

  private initializeClient() {
    // @ts-ignore
    this.client = new (ElevenLabs.ElevenLabsClient || ElevenLabs)(this.apiKey);
  }

  async generateSpeech(text: string, options?: VoiceOptions): Promise<VoiceGenerationResult> {
    const startTime = Date.now();

    const voiceId = options?.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default voice

    const audioStream = await this.client.generate({
      voice: voiceId,
      text: text,
      model_id: this.modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audio = Buffer.concat(chunks);

    const endTime = Date.now();
    const latencyMs = endTime - startTime;
    const audioSize = audio.length;

    // ElevenLabs pricing: ~$0.30 per 1M characters
    const estimatedCost = (text.length / 1_000_000) * 0.30;

    return {
      audio,
      metrics: {
        startTime,
        endTime,
        latencyMs,
        audioSize,
        estimatedCost,
      },
      metadata: {
        provider: this.name,
        voiceId,
        language: options?.language || 'en',
        model: this.modelId,
      },
    };
  }

  async getAvailableVoices(): Promise<Array<{
    id: string;
    name: string;
    language: string;
    gender: string;
    accents?: string[];
  }>> {
    // Hardcoded list of ElevenLabs popular voices
    // In production, would fetch from their API
    return [
      {
        id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel",
        language: "en",
        gender: "female",
        accents: ["american"],
      },
      {
        id: "EXAVITQu4vr4xnSDxMaL",
        name: "Bella",
        language: "en",
        gender: "female",
        accents: ["american"],
      },
      {
        id: "MF3mGyEYCl7XYWbV9V2b",
        name: "Ava",
        language: "en",
        gender: "female",
        accents: ["american"],
      },
      {
        id: "TxGEqnHWrfWFTfGW9XjX",
        name: "Antonio",
        language: "pt",
        gender: "male",
        accents: ["brazilian"],
      },
    ];
  }

  async estimateCostPerMinute(): Promise<number> {
    // ElevenLabs: roughly $0.18-0.30 per minute depending on voice/model
    return 0.24;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check: attempt to get voices
      await this.client.voices.get();
      return true;
    } catch (error) {
      console.error("[ElevenLabs] Health check failed:", error);
      return false;
    }
  }

  async supportsLanguage(language: string): Promise<boolean> {
    const normalized = language.toLowerCase().replace('_', '-');
    return this.supportedLanguages.has(normalized);
  }
}
