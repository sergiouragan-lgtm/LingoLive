import { IConversationMemory, MemoryMessage } from "../interfaces/IEngineComponents";
import { safeGetDoc, safeSetDoc } from "../../../firestoreSafe.service";
import { AIOrchestrationLogger } from "../utils/Logger";

export class ConversationMemory implements IConversationMemory {
  // Local cache fallback for sandboxed/offline runs
  private localMemory: Map<string, MemoryMessage[]> = new Map();

  async getHistory(userId: string, limit = 10): Promise<MemoryMessage[]> {
    try {
      const docSnap = await safeGetDoc("ai_conversations", userId);
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data && Array.isArray(data.messages)) {
          const messages = data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          return messages.slice(-limit);
        }
      }
    } catch (error: any) {
      AIOrchestrationLogger.warn(`Failed to read conversation history from Firestore for user ${userId}. Using memory fallback. Error: ${error.message}`);
    }

    // Fallback
    const history = this.localMemory.get(userId) || [];
    return history.slice(-limit);
  }

  async saveMessage(userId: string, role: "user" | "assistant", content: string): Promise<void> {
    const newMessage: MemoryMessage = {
      role,
      content,
      timestamp: new Date(),
    };

    // Update Local Cache first
    if (!this.localMemory.has(userId)) {
      this.localMemory.set(userId, []);
    }
    const userMemory = this.localMemory.get(userId)!;
    userMemory.push(newMessage);

    // Save to Firestore asynchronously
    try {
      const history = await this.getHistory(userId, 50); // Get recent 50
      history.push(newMessage);

      await safeSetDoc("ai_conversations", userId, {
        userId,
        messages: history.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        })),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      AIOrchestrationLogger.warn(`Failed to write conversation history to Firestore for user ${userId}. Saved in-memory. Error: ${error.message}`);
    }
  }

  async summarizeHistory(userId: string): Promise<string> {
    const history = await this.getHistory(userId, 20);
    if (history.length === 0) {
      return "Nenhum histórico anterior.";
    }

    const exchangeCount = Math.floor(history.length / 2);
    return `O aluno teve uma troca de ${exchangeCount} mensagens sobre tópicos diversos. O foco foi a prática de conversação natural, vocabulário cotidiano e expressões regionais.`;
  }
}
