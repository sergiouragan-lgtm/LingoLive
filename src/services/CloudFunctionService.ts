import { auth } from '../firebase';

/**
 * CloudFunctionService - Calls Firebase Cloud Functions for B2B school management
 */

export interface ClassroomPayload {
  schoolId: string;
  name: string;
  teacherUid: string;
  classroomId?: string;
}

export interface StudentPayload {
  schoolId: string;
  classroomId: string;
  studentUid: string;
  name: string;
  email: string;
  cefrLevel?: string;
}

export interface TeacherPayload {
  schoolId: string;
  name: string;
  email: string;
  languages?: string[];
}

export interface CloudFunctionResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

const API_BASE_URL = process.env.VITE_FUNCTIONS_URL || 'https://us-central1-lingolive-ia-f5778.cloudfunctions.net';

/**
 * Get authorization token from Firebase Auth
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await user.getIdToken();
}

/**
 * Make authenticated request to Cloud Function
 */
async function callCloudFunction<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: any
): Promise<CloudFunctionResponse<T>> {
  try {
    const token = await getAuthToken();

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Cloud Function error [${method} ${path}]:`, error);
    throw error;
  }
}

/**
 * CLASSROOM OPERATIONS
 */

export const CloudFunctionService = {
  /**
   * Create a new classroom
   */
  async createClassroom(payload: ClassroomPayload): Promise<CloudFunctionResponse> {
    return callCloudFunction('POST', '/createClassroom', payload);
  },

  /**
   * Update an existing classroom
   */
  async updateClassroom(
    classroomId: string,
    payload: Omit<ClassroomPayload, 'schoolId'>
  ): Promise<CloudFunctionResponse> {
    return callCloudFunction('PUT', `/updateClassroom/${classroomId}`, {
      classroomId,
      ...payload
    });
  },

  /**
   * Delete a classroom
   */
  async deleteClassroom(schoolId: string, classroomId: string): Promise<CloudFunctionResponse> {
    return callCloudFunction('DELETE', `/deleteClassroom/${classroomId}`, {
      schoolId,
      classroomId
    });
  },

  /**
   * Get classroom details
   */
  async getClassroom(schoolId: string, classroomId: string): Promise<CloudFunctionResponse> {
    return callCloudFunction('GET', `/getClassroom/${classroomId}`, {
      schoolId,
      classroomId
    });
  },

  /**
   * List all classrooms in a school
   */
  async listClassrooms(schoolId: string): Promise<CloudFunctionResponse> {
    return callCloudFunction('GET', `/listClassrooms/${schoolId}`, {
      schoolId
    });
  },

  /**
   * STUDENT OPERATIONS
   */

  /**
   * Add a student to a classroom
   */
  async addStudentToClassroom(payload: StudentPayload): Promise<CloudFunctionResponse> {
    return callCloudFunction('POST', `/addStudentToClassroom`, payload);
  },

  /**
   * Remove a student from a classroom
   */
  async removeStudentFromClassroom(
    schoolId: string,
    classroomId: string,
    studentId: string
  ): Promise<CloudFunctionResponse> {
    return callCloudFunction('DELETE', `/removeStudentFromClassroom/${classroomId}/${studentId}`, {
      schoolId,
      classroomId,
      studentId
    });
  },

  /**
   * TEACHER OPERATIONS
   */

  /**
   * Create a new teacher
   */
  async createTeacher(schoolId: string, payload: TeacherPayload): Promise<CloudFunctionResponse> {
    return callCloudFunction('POST', '/createTeacher', {
      schoolId,
      ...payload
    });
  },

  /**
   * Update teacher information
   */
  async updateTeacher(
    schoolId: string,
    teacherId: string,
    payload: Partial<TeacherPayload>
  ): Promise<CloudFunctionResponse> {
    return callCloudFunction('PUT', `/updateTeacher/${teacherId}`, {
      schoolId,
      teacherId,
      ...payload
    });
  },

  /**
   * Delete a teacher
   */
  async deleteTeacher(schoolId: string, teacherId: string): Promise<CloudFunctionResponse> {
    return callCloudFunction('DELETE', `/deleteTeacher/${teacherId}`, {
      schoolId,
      teacherId
    });
  },

  /**
   * List all teachers in a school
   */
  async listTeachers(schoolId: string): Promise<CloudFunctionResponse> {
    return callCloudFunction('GET', `/listTeachers/${schoolId}`, {
      schoolId
    });
  }
};
