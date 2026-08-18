import { AuditFields } from "../../../../core/types/AuditFields";

export interface ClassroomEntity extends AuditFields {
  name: string;
  description: string;
  teacherId: string;
  courseId: string;
}
