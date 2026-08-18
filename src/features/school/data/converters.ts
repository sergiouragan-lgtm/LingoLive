import {
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import { School, Department, Teacher, Student, Parent, Class, Subject, Schedule, Attendance, AcademicEvent } from '../../../types';

const createConverter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T) => data as DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions) =>
    snapshot.data(options) as T,
});

export const schoolConverter = createConverter<School>();
export const departmentConverter = createConverter<Department>();
export const teacherConverter = createConverter<Teacher>();
export const studentConverter = createConverter<Student>();
export const parentConverter = createConverter<Parent>();
export const classConverter = createConverter<Class>();
export const subjectConverter = createConverter<Subject>();
export const scheduleConverter = createConverter<Schedule>();
export const attendanceConverter = createConverter<Attendance>();
export const academicEventConverter = createConverter<AcademicEvent>();
