import { GoogleGenAI } from "@google/genai";

export class SummarizationEngine {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async summarize(history: string[]): Promise<string> {
    const prompt = `Summarize the following language learning history, focusing on progress, vocabulary, and grammar issues: ${history.join(' ')}`;
    const response = await this.ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });
    return response.text || "";
  }
}
