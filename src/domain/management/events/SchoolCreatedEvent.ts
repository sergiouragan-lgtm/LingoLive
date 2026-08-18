import { School } from "../aggregates/School";

export class SchoolCreatedEvent {
  constructor(public readonly school: School, public readonly occurredOn: Date) {}
}
