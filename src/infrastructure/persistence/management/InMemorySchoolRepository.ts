import { School } from "../../../domain/management/aggregates/School";
import { ISchoolRepository } from "../../../domain/management/repositories/ISchoolRepository";

export class InMemorySchoolRepository implements ISchoolRepository {
  private schools: School[] = [];

  async save(school: School): Promise<void> {
    this.schools.push(school);
  }

  async findById(id: string): Promise<School | null> {
    return this.schools.find(s => s.id === id) || null;
  }
}
