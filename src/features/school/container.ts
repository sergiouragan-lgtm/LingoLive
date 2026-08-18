import { SchoolRepository } from './data/repository';
import { SchoolService } from './application/service';

export const schoolService = new SchoolService(new SchoolRepository());
