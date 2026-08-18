import { Entity } from "../../../shared/kernel/BaseEntity";
import { Email } from "../value-objects/Email";

export class Teacher implements Entity<string> {
  readonly id: string;
  private name: string;
  private email: Email;

  constructor(id: string, name: string, email: Email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }
}
