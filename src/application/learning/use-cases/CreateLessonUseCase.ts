import { Lesson } from "../../../domain/learning/aggregates/Lesson";
import { ILessonRepository } from "../../../domain/learning/repositories/ILessonRepository";
import { LessonTitle } from "../../../domain/learning/value-objects/LessonTitle";

export class CreateLessonUseCase {
  constructor(private readonly lessonRepository: ILessonRepository) {}

  async execute(id: string, title: string, content: string): Promise<void> {
    const lessonTitle = new LessonTitle(title);
    const lesson = new Lesson(id, lessonTitle, content);
    
    await this.lessonRepository.save(lesson);
  }
}
