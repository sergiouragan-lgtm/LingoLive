export class Email {
  private readonly value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error("Invalid email format");
    }
    this.value = value;
  }

  private isValid(email: string): boolean {
    return email.includes("@");
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
