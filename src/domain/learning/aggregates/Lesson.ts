import { AggregateRoot } from "../../../shared/kernel/BaseEntity";
import { LessonTitle } from "../value-objects/LessonTitle";
import { CefrLevel } from "../../cefr/Types";

export type LearningSkill = 'Grammar' | 'Vocabulary' | 'Reading' | 'Writing' | 'Listening' | 'Speaking';

export interface LessonMetadata {
  courseId: string;
  language: string;
  level: CefrLevel;
  skills: LearningSkill[];
  order: number;
  estimatedMinutes: number;
  prerequisites: string[];
}

export class Lesson extends AggregateRoot<string> {
  private title: LessonTitle;
  private content: string;
  private metadata?: LessonMetadata;

  constructor(id: string, title: LessonTitle, content: string, metadata?: LessonMetadata) {
    super(id);
    this.title = title;
    this.content = content;
    this.metadata = metadata;
  }

  getTitle(): LessonTitle {
    return this.title;
  }

  getContent(): string {
    return this.content;
  }

  getMetadata(): LessonMetadata | undefined {
    return this.metadata;
  }
}
