import { Either } from "../../../../core/functional/Either";
import { Failure } from "../../../../core/error/Failure";
import { ClassroomEntity } from "../entities/ClassroomEntity";

export interface IClassroomRepository {
  fetchSession(sessionId: string): Promise<Either<Failure, ClassroomEntity>>;
}
