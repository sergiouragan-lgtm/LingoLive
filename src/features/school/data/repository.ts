import { db } from '../../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ISchoolRepository } from '../domain/repository';
import { School, Department, Teacher, Student, Parent, Class, Subject, Schedule, Attendance, AcademicEvent } from '../../../types';
import {
  schoolConverter,
  departmentConverter,
  teacherConverter,
  studentConverter,
  parentConverter,
  classConverter,
  subjectConverter,
  scheduleConverter,
  attendanceConverter,
  academicEventConverter,
} from './converters';

/**
 * Implementation of the School Management repository using Firestore.
 */
export class SchoolRepository implements ISchoolRepository {
  /** Adds a new school record. */
  async addSchool(school: Omit<School, 'id'>): Promise<void> {
    console.log('[SchoolRepository] Adding school:', school.name);
    await addDoc(collection(db, 'schools').withConverter(schoolConverter), school as School);
  }
  
  /** Adds a new department record. */
  async addDepartment(dept: Omit<Department, 'id'>): Promise<void> {
    console.log('[SchoolRepository] Adding department:', dept.name);
    await addDoc(collection(db, 'departments').withConverter(departmentConverter), dept as Department);
  }
  
  /** Adds a new teacher record. */
  async addTeacher(teacher: Omit<Teacher, 'uid'>): Promise<void> {
    console.log('[SchoolRepository] Adding teacher:', teacher.name);
    await addDoc(collection(db, 'teachers').withConverter(teacherConverter), teacher as Teacher);
  }
  
  /** Adds a new student record. */
  async addStudent(student: Omit<Student, 'uid'>): Promise<void> {
    console.log('[SchoolRepository] Adding student:', student.name);
    await addDoc(collection(db, 'students').withConverter(studentConverter), student as Student);
  }
  
  /** Adds a new parent record. */
  async addParent(parent: Omit<Parent, 'uid'>): Promise<void> {
    console.log('[SchoolRepository] Adding parent:', parent.email);
    await addDoc(collection(db, 'parents').withConverter(parentConverter), parent as Parent);
  }
  
  /** Adds a new class record. */
  async addClass(cls: Omit<Class, 'id'>): Promise<void> {
    console.log('[SchoolRepository] Adding class:', cls.name);
    await addDoc(collection(db, 'classes').withConverter(classConverter), cls as Class);
  }
  
  /** Adds a new subject record. */
  async addSubject(subject: Omit<Subject, 'id'>): Promise<void> {
    console.log('[SchoolRepository] Adding subject:', subject.name);
    await addDoc(collection(db, 'subjects').withConverter(subjectConverter), subject as Subject);
  }
  
  /** Adds a new schedule record. */
  async addSchedule(schedule: Omit<Schedule, 'id'>): Promise<void> {
    console.log('[SchoolRepository] Adding schedule for class:', schedule.classId);
    await addDoc(collection(db, 'schedules').withConverter(scheduleConverter), schedule as Schedule);
  }
  
  /** Records student attendance. */
  async recordAttendance(attendance: Omit<Attendance, 'id'>): Promise<void> {
    console.log('[SchoolRepository] Recording attendance for:', attendance.studentUid);
    await addDoc(collection(db, 'attendance').withConverter(attendanceConverter), attendance as Attendance);
  }
  
  /** Adds a new academic event record. */
  async addAcademicEvent(event: Omit<AcademicEvent, 'id'>): Promise<void> {
    console.log('[SchoolRepository] Adding academic event:', event.title);
    await addDoc(collection(db, 'academic_events').withConverter(academicEventConverter), event as AcademicEvent);
  }
}
