import { ISchoolRepository } from '../domain/repository';
import { School, Department, Teacher, Student, Parent, Class, Subject, Schedule, Attendance, AcademicEvent } from '../../../types';

/**
 * Service for the School Management module.
 * Provides application-level operations.
 */
export class SchoolService {
  constructor(private repository: ISchoolRepository) {}

  /** Creates a new school record. */
  async createSchool(school: Omit<School, 'id'>) {
    try {
      console.log('[SchoolService] Creating school:', school.name);
      return await this.repository.addSchool(school);
    } catch (error) {
      console.error('[SchoolService] Error creating school:', error);
      throw error;
    }
  }

  async createDepartment(dept: Omit<Department, 'id'>) {
    try {
      console.log('[SchoolService] Creating department:', dept.name);
      return await this.repository.addDepartment(dept);
    } catch (error) {
      console.error('[SchoolService] Error creating department:', error);
      throw error;
    }
  }
  
  async registerTeacher(teacher: Omit<Teacher, 'uid'>) {
    try {
      console.log('[SchoolService] Registering teacher:', teacher.name);
      return await this.repository.addTeacher(teacher);
    } catch (error) {
      console.error('[SchoolService] Error registering teacher:', error);
      throw error;
    }
  }
  
  async registerStudent(student: Omit<Student, 'uid'>) {
    try {
      console.log('[SchoolService] Registering student:', student.name);
      return await this.repository.addStudent(student);
    } catch (error) {
      console.error('[SchoolService] Error registering student:', error);
      throw error;
    }
  }
  
  async registerParent(parent: Omit<Parent, 'uid'>) {
    try {
      console.log('[SchoolService] Registering parent:', parent.email);
      return await this.repository.addParent(parent);
    } catch (error) {
      console.error('[SchoolService] Error registering parent:', error);
      throw error;
    }
  }
  
  async createClass(cls: Omit<Class, 'id'>) {
    try {
      console.log('[SchoolService] Creating class:', cls.name);
      return await this.repository.addClass(cls);
    } catch (error) {
      console.error('[SchoolService] Error creating class:', error);
      throw error;
    }
  }
  
  async createSubject(subject: Omit<Subject, 'id'>) {
    try {
      console.log('[SchoolService] Creating subject:', subject.name);
      return await this.repository.addSubject(subject);
    } catch (error) {
      console.error('[SchoolService] Error creating subject:', error);
      throw error;
    }
  }
  
  async createSchedule(schedule: Omit<Schedule, 'id'>) {
    try {
      console.log('[SchoolService] Creating schedule');
      return await this.repository.addSchedule(schedule);
    } catch (error) {
      console.error('[SchoolService] Error creating schedule:', error);
      throw error;
    }
  }
  
  async logAttendance(attendance: Omit<Attendance, 'id'>) {
    try {
      console.log('[SchoolService] Logging attendance for student:', attendance.studentUid);
      return await this.repository.recordAttendance(attendance);
    } catch (error) {
      console.error('[SchoolService] Error logging attendance:', error);
      throw error;
    }
  }
  
  async createAcademicEvent(event: Omit<AcademicEvent, 'id'>) {
    try {
      console.log('[SchoolService] Creating academic event:', event.title);
      return await this.repository.addAcademicEvent(event);
    } catch (error) {
      console.error('[SchoolService] Error creating academic event:', error);
      throw error;
    }
  }
}
