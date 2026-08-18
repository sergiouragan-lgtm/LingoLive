export type AgentId = string;

export interface AIAgent {
  id: AgentId;
  name: string;
  purpose: string;
  supportedLanguages: string[];
}

export interface OrchestrationRequest {
  userId: string;
  task: string;
  context: Record<string, any>;
}

export interface OrchestrationResponse {
  response: string;
  metadata: Record<string, any>;
}
