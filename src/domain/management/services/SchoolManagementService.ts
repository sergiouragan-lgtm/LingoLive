import { School } from "../aggregates/School";
import { ISchoolRepository } from "../repositories/ISchoolRepository";

export class SchoolManagementService {
  constructor(private readonly schoolRepository: ISchoolRepository) {}

  async createSchool(school: School): Promise<void> {
    // Logic to ensure school name is unique, etc.
    await this.schoolRepository.save(school);
  }
}
