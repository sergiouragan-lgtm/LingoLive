/**
 * Legacy TTS wrapper for backward compatibility
 *
 * DEPRECATED: Use VoiceService from server/services/voice instead
 * This function now delegates to the abstract provider system
 *
 * Migration path:
 * - Server-side: Use VoiceService.generateSpeech() with VoiceOptions
 * - Client-side: Keep using textoParaVoz() for backward compatibility
 */

// Check if we're in Node.js environment (server-side)
const isServerSide = typeof process !== 'undefined' && process.versions && process.versions.node;

let voiceServiceClient: any = null;

async function getVoiceService() {
  if (!isServerSide) {
    throw new Error('textoParaVoz is only available on the server');
  }

  if (!voiceServiceClient) {
    try {
      // Dynamic import to avoid circular dependencies
      const { VoiceService } = await import('../../server/services/voice/VoiceService');
      voiceServiceClient = VoiceService;
    } catch (error) {
      console.error('Failed to load VoiceService:', error);
      // Fallback to original ElevenLabs implementation
      return _getFallbackElevenLabs();
    }
  }
  return voiceServiceClient;
}

// Fallback to original ElevenLabs if VoiceService is not available
async function _getFallbackElevenLabs() {
  const ElevenLabs = await import("@elevenlabs/client");
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required');
  }

  // @ts-ignore
  const client = new (ElevenLabs.ElevenLabsClient || ElevenLabs)(apiKey);

  return {
    generateSpeech: async (text: string, options?: any) => {
      const audioStream = await client.generate({
        voice: options?.voiceId || "21m00Tcm4TlvDq8ikWAM",
        text: text,
        model_id: "eleven_multilingual_v2",
      });

      const chunks = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      return {
        audio: Buffer.concat(chunks),
        provider: "ElevenLabs"
      };
    }
  };
}

/**
 * Generate speech from text
 * @param texto - The text to convert to speech
 * @param voiceId - Optional voice ID override
 * @returns Audio buffer
 *
 * @deprecated Use VoiceService.generateSpeech() on the server instead
 */
export async function textoParaVoz(texto: string, voiceId?: string): Promise<Buffer> {
  try {
    const voiceService = await getVoiceService();

    const result = await voiceService.generateSpeech(texto, {
      voiceId,
      language: _detectLanguage(texto),
    });

    return result.audio;
  } catch (error) {
    console.error('Error in textoParaVoz:', error);
    throw error;
  }
}

/**
 * Simple language detection based on text content
 */
function _detectLanguage(text: string): string {
  if (text.includes('português') || text.includes('Português')) return 'pt';
  if (text.includes('español') || text.includes('Español')) return 'es';
  if (/ã|õ|ç|á|é|í|ó|ú/.test(text)) return 'pt';
  return 'en';
}
