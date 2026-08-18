export interface LanguageModel {
  id: string;
  language: string;
  version: string;
  capabilities: string[];
  regions: string[];
}

export interface LanguageKnowledgeNode {
  language: string;
  dialect: string;
  region: string;
  expressions: string[];
}

export interface SpeechProfile {
  userId: string;
  pronunciationScore: number;
  accentProfile: string;
  fluencyLevel: string;
}
