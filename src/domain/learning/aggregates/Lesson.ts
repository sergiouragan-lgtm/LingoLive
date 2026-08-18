import { AggregateRoot } from "../../../shared/kernel/BaseEntity";
import { LessonTitle } from "../value-objects/LessonTitle";

export class Lesson extends AggregateRoot<string> {
  private title: LessonTitle;
  private content: string;

  constructor(id: string, title: LessonTitle, content: string) {
    super(id);
    this.title = title;
    this.content = content;
  }

  getTitle(): LessonTitle {
    return this.title;
  }

  getContent(): string {
    return this.content;
  }
}
