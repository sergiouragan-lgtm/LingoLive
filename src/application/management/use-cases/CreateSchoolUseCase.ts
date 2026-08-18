import { School } from "../../../domain/management/aggregates/School";
import { ISchoolRepository } from "../../../domain/management/repositories/ISchoolRepository";
import { Address } from "../../../domain/management/value-objects/Address";

export class CreateSchoolUseCase {
  constructor(private readonly schoolRepository: ISchoolRepository) {}

  async execute(id: string, name: string, street: string, city: string, country: string): Promise<void> {
    const address = new Address(street, city, country);
    const school = new School(id, name, address);
    
    await this.schoolRepository.save(school);
  }
}
