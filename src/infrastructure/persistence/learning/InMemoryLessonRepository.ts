import { Lesson } from "../../../domain/learning/aggregates/Lesson";
import { ILessonRepository } from "../../../domain/learning/repositories/ILessonRepository";

export class InMemoryLessonRepository implements ILessonRepository {
  private lessons: Lesson[] = [];

  async save(lesson: Lesson): Promise<void> {
    this.lessons.push(lesson);
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.lessons.find(l => l.id === id) || null;
  }
}
