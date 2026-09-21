# Cloud Functions Integration Guide

This guide shows how to integrate the Cloud Functions into your React components for classroom and student management.

---

## Table of Contents

1. [Setup](#setup)
2. [Classroom Operations](#classroom-operations)
3. [Student Enrollment](#student-enrollment)
4. [Progress Tracking](#progress-tracking)
5. [Error Handling](#error-handling)
6. [Complete Examples](#complete-examples)

---

## Setup

### 1. Create a Cloud Functions Service

Create a new file `src/services/classroomService.ts`:

```typescript
import { db, auth } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  increment,
  serverTimestamp,
  writeBatch,
  Firestore,
  DocumentReference,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';

export interface Classroom {
  id: string;
  name: string;
  teacherUid: string;
  schoolId: string;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrolledStudent {
  uid: string;
  name: string;
  email: string;
  schoolId: string;
  classId: string;
  cefrLevel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProgress {
  studentUid: string;
  classId: string;
  wordsLearned: number;
  lessonsCompleted: number;
  averageScore: number;
  streakDays: number;
  lastActivityDate: Date;
}

export interface StudentStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  totalDaysActive: number;
}

export class ClassroomService {
  /**
   * Create a new classroom
   */
  static async createClassroom(
    schoolId: string,
    name: string,
    teacherUid: string
  ): Promise<Classroom> {
    const classroomRef = collection(db, 'schools', schoolId, 'classrooms');
    const docRef = await addDoc(classroomRef, {
      name,
      teacherUid,
      schoolId,
      studentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      name,
      teacherUid,
      schoolId,
      studentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get a specific classroom
   */
  static async getClassroom(
    schoolId: string,
    classroomId: string
  ): Promise<Classroom | null> {
    const docRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId
    );
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      teacherUid: data.teacherUid,
      schoolId: data.schoolId,
      studentCount: data.studentCount,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }

  /**
   * List all classrooms in a school
   */
  static async listClassrooms(schoolId: string): Promise<Classroom[]> {
    const q = collection(db, 'schools', schoolId, 'classrooms');
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        teacherUid: data.teacherUid,
        schoolId: data.schoolId,
        studentCount: data.studentCount,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    });
  }

  /**
   * Update classroom details
   */
  static async updateClassroom(
    schoolId: string,
    classroomId: string,
    updates: Partial<Classroom>
  ): Promise<void> {
    const docRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId
    );

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.teacherUid) updateData.teacherUid = updates.teacherUid;

    await updateDoc(docRef, updateData);
  }

  /**
   * Delete a classroom
   */
  static async deleteClassroom(
    schoolId: string,
    classroomId: string
  ): Promise<void> {
    const docRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId
    );
    await deleteDoc(docRef);
  }

  /**
   * Enroll a student in a classroom
   * This triggers the onStudentEnrolled Cloud Function
   */
  static async enrollStudent(
    schoolId: string,
    classroomId: string,
    studentUid: string,
    studentName: string,
    studentEmail: string
  ): Promise<EnrolledStudent> {
    const studentRef = collection(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'students'
    );

    const docRef = await addDoc(studentRef, {
      uid: studentUid,
      name: studentName,
      email: studentEmail,
      schoolId,
      classId: classroomId,
      cefrLevel: 'A1',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      uid: studentUid,
      name: studentName,
      email: studentEmail,
      schoolId,
      classId: classroomId,
      cefrLevel: 'A1',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Remove a student from a classroom
   */
  static async unenrollStudent(
    schoolId: string,
    classroomId: string,
    studentUid: string
  ): Promise<void> {
    const batch = writeBatch(db);

    // Delete student document
    const studentRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'students',
      studentUid
    );
    batch.delete(studentRef);

    // Delete associated documents
    const progressRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'studentProgress',
      studentUid
    );
    batch.delete(progressRef);

    const streakRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'studentStreaks',
      studentUid
    );
    batch.delete(streakRef);

    const achievementRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'studentAchievements',
      studentUid
    );
    batch.delete(achievementRef);

    const assessmentRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'studentAssessments',
      studentUid
    );
    batch.delete(assessmentRef);

    // Update classroom count
    const classroomRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId
    );
    batch.update(classroomRef, {
      studentCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    // Update metadata
    const metadataRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'metadata',
      'stats'
    );
    batch.update(metadataRef, {
      totalStudents: increment(-1),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  }

  /**
   * Get student progress
   */
  static async getStudentProgress(
    schoolId: string,
    classroomId: string,
    studentUid: string
  ): Promise<StudentProgress | null> {
    const docRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'studentProgress',
      studentUid
    );

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      studentUid: data.studentUid,
      classId: data.classId,
      wordsLearned: data.wordsLearned,
      lessonsCompleted: data.lessonsCompleted,
      averageScore: data.averageScore,
      streakDays: data.streakDays,
      lastActivityDate: data.lastActivityDate?.toDate() || new Date()
    };
  }

  /**
   * Update student progress
   */
  static async updateStudentProgress(
    schoolId: string,
    classroomId: string,
    studentUid: string,
    updates: Partial<StudentProgress>
  ): Promise<void> {
    const docRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'studentProgress',
      studentUid
    );

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.wordsLearned !== undefined)
      updateData.wordsLearned = updates.wordsLearned;
    if (updates.lessonsCompleted !== undefined)
      updateData.lessonsCompleted = updates.lessonsCompleted;
    if (updates.averageScore !== undefined)
      updateData.averageScore = updates.averageScore;
    if (updates.streakDays !== undefined) updateData.streakDays = updates.streakDays;

    await updateDoc(docRef, updateData);
  }

  /**
   * Get student streak data
   */
  static async getStudentStreak(
    schoolId: string,
    classroomId: string,
    studentUid: string
  ): Promise<StudentStreak | null> {
    const docRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'studentStreaks',
      studentUid
    );

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastActivityDate: data.lastActivityDate?.toDate() || new Date(),
      totalDaysActive: data.totalDaysActive
    };
  }

  /**
   * Update student streak
   */
  static async updateStudentStreak(
    schoolId: string,
    classroomId: string,
    studentUid: string,
    updates: Partial<StudentStreak>
  ): Promise<void> {
    const docRef = doc(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'studentStreaks',
      studentUid
    );

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.currentStreak !== undefined)
      updateData.currentStreak = updates.currentStreak;
    if (updates.longestStreak !== undefined)
      updateData.longestStreak = updates.longestStreak;
    if (updates.totalDaysActive !== undefined)
      updateData.totalDaysActive = updates.totalDaysActive;

    await updateDoc(docRef, updateData);
  }

  /**
   * List all students in a classroom
   */
  static async listClassroomStudents(
    schoolId: string,
    classroomId: string
  ): Promise<EnrolledStudent[]> {
    const q = collection(
      db,
      'schools',
      schoolId,
      'classrooms',
      classroomId,
      'students'
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
      .filter(doc => doc.id !== '_metadata')
      .map(doc => {
        const data = doc.data();
        return {
          uid: data.uid,
          name: data.name,
          email: data.email,
          schoolId: data.schoolId,
          classId: data.classId,
          cefrLevel: data.cefrLevel,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      });
  }
}
```

---

## Classroom Operations

### Create a Classroom

```typescript
import { ClassroomService } from '@/services/classroomService';

const handleCreateClassroom = async () => {
  try {
    const classroom = await ClassroomService.createClassroom(
      'school_123',
      '7A - Advanced English',
      'teacher_456'
    );
    console.log('Classroom created:', classroom);
    // Show success message
  } catch (error) {
    console.error('Failed to create classroom:', error);
    // Show error message
  }
};
```

### List Classrooms

```typescript
const [classrooms, setClassrooms] = useState<Classroom[]>([]);

useEffect(() => {
  const loadClassrooms = async () => {
    try {
      const data = await ClassroomService.listClassrooms('school_123');
      setClassrooms(data);
    } catch (error) {
      console.error('Failed to load classrooms:', error);
    }
  };

  loadClassrooms();
}, []);
```

### Update Classroom

```typescript
const handleUpdateClassroom = async (classroomId: string) => {
  try {
    await ClassroomService.updateClassroom(
      'school_123',
      classroomId,
      { name: 'Updated Classroom Name' }
    );
    console.log('Classroom updated');
  } catch (error) {
    console.error('Failed to update classroom:', error);
  }
};
```

### Delete Classroom

```typescript
const handleDeleteClassroom = async (classroomId: string) => {
  if (confirm('Are you sure you want to delete this classroom?')) {
    try {
      await ClassroomService.deleteClassroom('school_123', classroomId);
      console.log('Classroom deleted');
      // Refresh classroom list
    } catch (error) {
      console.error('Failed to delete classroom:', error);
    }
  }
};
```

---

## Student Enrollment

### Enroll a Student

```typescript
const handleEnrollStudent = async (studentData: {
  uid: string;
  name: string;
  email: string;
}) => {
  try {
    const enrolled = await ClassroomService.enrollStudent(
      'school_123',
      'classroom_789',
      studentData.uid,
      studentData.name,
      studentData.email
    );
    console.log('Student enrolled:', enrolled);
    // This automatically triggers onStudentEnrolled Cloud Function
    // which creates progress, streak, achievement records
  } catch (error) {
    console.error('Failed to enroll student:', error);
  }
};
```

### Unenroll a Student

```typescript
const handleUnenrollStudent = async (studentUid: string) => {
  if (confirm('Remove this student from the classroom?')) {
    try {
      await ClassroomService.unenrollStudent(
        'school_123',
        'classroom_789',
        studentUid
      );
      console.log('Student unenrolled');
      // Refresh student list
    } catch (error) {
      console.error('Failed to unenroll student:', error);
    }
  }
};
```

### List Classroom Students

```typescript
const [students, setStudents] = useState<EnrolledStudent[]>([]);

useEffect(() => {
  const loadStudents = async () => {
    try {
      const data = await ClassroomService.listClassroomStudents(
        'school_123',
        'classroom_789'
      );
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  loadStudents();
}, []);
```

---

## Progress Tracking

### Get Student Progress

```typescript
const handleGetProgress = async (studentUid: string) => {
  try {
    const progress = await ClassroomService.getStudentProgress(
      'school_123',
      'classroom_789',
      studentUid
    );

    if (progress) {
      console.log('Student Progress:', {
        wordsLearned: progress.wordsLearned,
        lessonsCompleted: progress.lessonsCompleted,
        averageScore: progress.averageScore,
        streakDays: progress.streakDays
      });
    }
  } catch (error) {
    console.error('Failed to get progress:', error);
  }
};
```

### Update Progress After Lesson Completion

```typescript
const handleLessonCompleted = async (
  studentUid: string,
  score: number
) => {
  try {
    const currentProgress = await ClassroomService.getStudentProgress(
      'school_123',
      'classroom_789',
      studentUid
    );

    if (currentProgress) {
      const newLessonsCompleted = currentProgress.lessonsCompleted + 1;
      const newAverageScore =
        (currentProgress.averageScore * currentProgress.lessonsCompleted + score) /
        newLessonsCompleted;

      await ClassroomService.updateStudentProgress(
        'school_123',
        'classroom_789',
        studentUid,
        {
          lessonsCompleted: newLessonsCompleted,
          averageScore: newAverageScore,
          lastActivityDate: new Date()
        }
      );
    }
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
};
```

### Get and Update Streak

```typescript
const handleActivityLogged = async (studentUid: string) => {
  try {
    const streak = await ClassroomService.getStudentStreak(
      'school_123',
      'classroom_789',
      studentUid
    );

    if (streak) {
      const today = new Date();
      const lastActivity = new Date(streak.lastActivityDate);
      const daysDiff = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newCurrentStreak = streak.currentStreak;

      if (daysDiff === 1) {
        // Consecutive day
        newCurrentStreak = streak.currentStreak + 1;
      } else if (daysDiff > 1) {
        // Streak broken, restart
        newCurrentStreak = 1;
      }

      const newLongestStreak = Math.max(
        streak.longestStreak,
        newCurrentStreak
      );

      await ClassroomService.updateStudentStreak(
        'school_123',
        'classroom_789',
        studentUid,
        {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          totalDaysActive: streak.totalDaysActive + 1
        }
      );
    }
  } catch (error) {
    console.error('Failed to update streak:', error);
  }
};
```

---

## Error Handling

### Create a Custom Hook for Error Handling

```typescript
import { useState } from 'react';

export const useClassroomOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeOperation = async <T,>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Operation failed:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, executeOperation };
};
```

---

## Complete Examples

### Full Classroom Management Component

```typescript
import React, { useState, useEffect } from 'react';
import { ClassroomService, Classroom, EnrolledStudent } from '@/services/classroomService';
import { useClassroomOperations } from '@/hooks/useClassroomOperations';

export const ClassroomManagementView: React.FC<{ schoolId: string }> = ({ schoolId }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { isLoading, error, executeOperation } = useClassroomOperations();

  // Load classrooms on mount
  useEffect(() => {
    loadClassrooms();
  }, []);

  // Load students when classroom is selected
  useEffect(() => {
    if (selectedClassroom) {
      loadStudents();
    }
  }, [selectedClassroom]);

  const loadClassrooms = async () => {
    const result = await executeOperation(() =>
      ClassroomService.listClassrooms(schoolId)
    );
    if (result) setClassrooms(result);
  };

  const loadStudents = async () => {
    if (!selectedClassroom) return;
    const result = await executeOperation(() =>
      ClassroomService.listClassroomStudents(schoolId, selectedClassroom.id)
    );
    if (result) setStudents(result);
  };

  const handleCreateClassroom = async (name: string) => {
    const result = await executeOperation(() =>
      ClassroomService.createClassroom(schoolId, name, 'current_teacher_uid')
    );
    if (result) {
      setClassrooms([...classrooms, result]);
      setIsCreating(false);
    }
  };

  const handleEnrollStudent = async (
    name: string,
    email: string
  ) => {
    if (!selectedClassroom) return;
    const result = await executeOperation(() =>
      ClassroomService.enrollStudent(
        schoolId,
        selectedClassroom.id,
        `student_${Date.now()}`,
        name,
        email
      )
    );
    if (result) {
      loadStudents(); // Refresh student list
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Classroom Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Classrooms Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Classrooms</h2>
        {isLoading && <p>Loading...</p>}
        <div className="grid grid-cols-3 gap-4">
          {classrooms.map(classroom => (
            <div
              key={classroom.id}
              onClick={() => setSelectedClassroom(classroom)}
              className={`p-4 border rounded cursor-pointer ${
                selectedClassroom?.id === classroom.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <h3 className="font-semibold">{classroom.name}</h3>
              <p className="text-sm text-gray-500">
                {classroom.studentCount} students
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Students Section */}
      {selectedClassroom && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Students in {selectedClassroom.name}
          </h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">CEFR</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.uid}>
                  <td className="border p-2">{student.name}</td>
                  <td className="border p-2">{student.email}</td>
                  <td className="border p-2">{student.cefrLevel}</td>
                  <td className="border p-2">
                    <button
                      onClick={() =>
                        ClassroomService.unenrollStudent(
                          schoolId,
                          selectedClassroom.id,
                          student.uid
                        ).then(() => loadStudents())
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

---

## Best Practices

1. **Always handle errors** - Use try-catch or the custom hook
2. **Show loading states** - Disable buttons during operations
3. **Refresh after mutations** - Reload data after create/update/delete
4. **Batch related operations** - Use batch writes for multiple changes
5. **Validate input** - Check data before sending to Cloud Functions
6. **Cache when possible** - Minimize Firestore reads
7. **Monitor usage** - Check Firebase console for quota usage

---

## Troubleshooting

### Student not appearing after enrollment
- Check Firestore rules allow creating in students subcollection
- Verify Cloud Function onStudentEnrolled executed successfully
- Check function logs in Firebase Console

### Progress not updating
- Ensure you have proper write permissions
- Verify studentProgress collection exists
- Check for typos in schoolId/classroomId/studentUid

### Stripe Quota exceeded
- Optimize query patterns
- Use collection group queries sparingly
- Consider indexing frequently queried fields

