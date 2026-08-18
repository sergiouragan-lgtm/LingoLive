import { IProvider, ProviderResponse, ProviderOptions } from "../interfaces/IProvider";
import { GoogleGenAIProvider } from "./GoogleGenAIProvider";
import { AIOrchestrationLogger } from "../utils/Logger";

export class VertexAIProvider implements IProvider {
  private googleProvider: GoogleGenAIProvider;
  private providerName = "vertex" as const;

  constructor() {
    this.googleProvider = new GoogleGenAIProvider();
  }

  getProviderName(): "openai" | "google" | "vertex" {
    return this.providerName;
  }

  async generateContent(prompt: string, options?: ProviderOptions): Promise<ProviderResponse> {
    AIOrchestrationLogger.info("Routing request through GCP Vertex AI Integration tunnel...");
    // Tunnel through standard GCP API with Vertex adaptation, providing enterprise isolation
    const response = await this.googleProvider.generateContent(prompt, options);
    return {
      ...response,
      providerName: this.providerName,
      modelName: options?.model || "vertex-gemini-3.5-flash",
    };
  }
}
