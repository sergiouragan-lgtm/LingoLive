import { MultilingualConversationEngine, SupportedLanguage } from "./MultilingualConversationEngine";

export class ConversationManager {
  private engine: MultilingualConversationEngine;

  constructor() {
    this.engine = new MultilingualConversationEngine();
  }

  async chat(messages: any[], context: any) {
    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
    
    // Dynamically map context fields to support CEFR, target, and native languages
    const result = await this.engine.processTurn({
      userId: context.userId || "anonymous",
      sessionId: context.sessionId || "default_session",
      userMessage: lastUserMessage,
      sourceLanguage: (context.sourceLanguage as SupportedLanguage) || "pt",
      targetLanguage: (context.targetLanguage as SupportedLanguage) || "en",
      userCEFR: context.userCEFR || "B1",
      currentTopic: context.currentTopic || "general",
      voiceInput: !!context.voiceInput
    });

    return result;
  }
}

