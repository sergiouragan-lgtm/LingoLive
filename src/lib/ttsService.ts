import * as ElevenLabs from "@elevenlabs/client";

let elevenlabsClient: any | null = null;

function getElevenLabs(): any {
  if (!elevenlabsClient) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }
    // @ts-ignore
    elevenlabsClient = new (ElevenLabs.ElevenLabsClient || ElevenLabs)(apiKey);
  }
  return elevenlabsClient;
}

export async function textoParaVoz(texto: string): Promise<Buffer> {
  const elevenlabs = getElevenLabs();
  const audioStream = await elevenlabs.generate({
    voice: "21m00Tcm4TlvDq8ikWAM", // Substitua pelo seu Voice ID de preferência
    text: texto,
    model_id: "eleven_multilingual_v2", // Suporta Português, Inglês, Chinês e Francês
  });

  // Converte a stream de áudio num Buffer para enviar ao frontend
  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
