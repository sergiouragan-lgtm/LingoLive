export class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly country: string
  ) {}

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.country === other.country
    );
  }
}
