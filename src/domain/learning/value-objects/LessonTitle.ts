export class LessonTitle {
  private readonly value: string;

  constructor(value: string) {
    if (value.length < 3) {
      throw new Error("Lesson title must be at least 3 characters long");
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }
}
