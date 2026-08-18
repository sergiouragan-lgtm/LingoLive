import { School } from "../aggregates/School";

export interface ISchoolRepository {
  save(school: School): Promise<void>;
  findById(id: string): Promise<School | null>;
}
