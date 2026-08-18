import { AggregateRoot } from "../../../shared/kernel/BaseEntity";
import { Address } from "../value-objects/Address";

export class School extends AggregateRoot<string> {
  private name: string;
  private address: Address;

  constructor(id: string, name: string, address: Address) {
    super(id);
    this.name = name;
    this.address = address;
  }

  getName(): string {
    return this.name;
  }

  getAddress(): Address {
    return this.address;
  }
}
