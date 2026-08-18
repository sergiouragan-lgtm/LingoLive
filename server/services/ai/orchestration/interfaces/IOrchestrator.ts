import { ProviderResponse, ProviderOptions } from "./IProvider";

export interface UserContext {
  userId: string;
  age: number;
  level: string; // CEFR level (A1, A2, B1, etc.)
  learningGoal?: string;
  languageNative: string;
  languageTarget: string;
  xp?: number;
  streak?: number;
  allowSlang?: boolean;
  allowRegionalExpressions?: boolean;
}

export interface SchoolContext {
  schoolId?: string;
  schoolName?: string;
  pedagogicalFocus?: string;
}

export interface OrchestrationRequest {
  message: string;
  userContext: UserContext;
  schoolContext?: SchoolContext;
  lessonContext?: string;
  options?: ProviderOptions;
}

export interface IAIOrchestrator {
  orchestrate(request: OrchestrationRequest): Promise<ProviderResponse>;
}
