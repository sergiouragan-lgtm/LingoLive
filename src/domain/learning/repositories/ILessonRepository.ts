import { Lesson } from "../aggregates/Lesson";

export interface ILessonRepository {
  save(lesson: Lesson): Promise<void>;
  findById(id: string): Promise<Lesson | null>;
}
