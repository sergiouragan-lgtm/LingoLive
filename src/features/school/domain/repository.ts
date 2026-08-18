import { School, Department, Teacher, Student, Parent, Class, Subject, Schedule, Attendance, AcademicEvent } from '../../../types';

/**
 * Interface for the School Management module repository.
 * Defines the operations allowed on school-related data.
 */
export interface ISchoolRepository {
  /** Adds a new school record. */
  addSchool(school: Omit<School, 'id'>): Promise<void>;
  /** Adds a new department record. */
  addDepartment(dept: Omit<Department, 'id'>): Promise<void>;
  /** Adds a new teacher record. */
  addTeacher(teacher: Omit<Teacher, 'uid'>): Promise<void>;
  /** Adds a new student record. */
  addStudent(student: Omit<Student, 'uid'>): Promise<void>;
  /** Adds a new parent record. */
  addParent(parent: Omit<Parent, 'uid'>): Promise<void>;
  /** Adds a new class record. */
  addClass(cls: Omit<Class, 'id'>): Promise<void>;
  /** Adds a new subject record. */
  addSubject(subject: Omit<Subject, 'id'>): Promise<void>;
  /** Adds a new schedule record. */
  addSchedule(schedule: Omit<Schedule, 'id'>): Promise<void>;
  /** Records student attendance. */
  recordAttendance(attendance: Omit<Attendance, 'id'>): Promise<void>;
  /** Adds a new academic event record. */
  addAcademicEvent(event: Omit<AcademicEvent, 'id'>): Promise<void>;
}
