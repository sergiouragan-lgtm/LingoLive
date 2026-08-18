import { doc, getDoc, Firestore } from "firebase/firestore";
import { Either, left, right } from "../../../../core/functional/Either";
import { Failure, ServerFailure } from "../../../../core/error/Failure";
import { ClassroomEntity } from "../../domain/entities/ClassroomEntity";
import { handleFirestoreError, OperationType } from "../../../../firebase";

export class ClassroomRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async fetchSession(tenantId: string, classroomId: string): Promise<Either<Failure, ClassroomEntity>> {
    try {
      const docRef = doc(this.db, "tenants", tenantId, "classrooms", classroomId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return left(new ServerFailure("Classroom not found"));
      }

      const data = docSnap.data() as ClassroomEntity;
      return right({ ...data, id: docSnap.id });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `tenants/${tenantId}/classrooms/${classroomId}`);
      return left(new ServerFailure("Error fetching classroom"));
    }
  }
}
