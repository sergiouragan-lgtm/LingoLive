import { FirestoreMemoryRepository } from "../../infrastructure/memory/FirestoreMemoryRepository";
import { UserMemory } from "../../domain/memory/UserMemory";

export class MemoryService {
  constructor(private repo: FirestoreMemoryRepository) {}

  async updateMemory(userId: string, updates: Partial<UserMemory>): Promise<void> {
    await this.repo.saveMemory(userId, updates);
  }

  async getMemory(userId: string): Promise<UserMemory | null> {
    return await this.repo.getMemory(userId);
  }
}
