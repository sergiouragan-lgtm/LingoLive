import { useState, useEffect, useCallback, useRef } from 'react';
import { db, auth } from '@/firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query,
  onSnapshot, Timestamp, QueryConstraint
} from 'firebase/firestore';

export interface Classroom {
  id: string;
  name: string;
  grade: number;
  section: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  teacherUid: string;
  teacherName?: string;
  teacherEmail?: string;
  capacity: number;
  enrolledCount: number;
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
    room: string;
  };
  curriculum: {
    primaryLanguage: string;
    topics: string[];
    materials: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateClassroomData {
  name: string;
  grade: number;
  section: string;
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  teacherUid: string;
  capacity: number;
  schedule: {
    startTime: string;
    endTime: string;
    days: string[];
    room: string;
  };
  curriculum: {
    primaryLanguage: string;
    topics: string[];
    materials: string[];
  };
}

export interface UseClassroomsOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
  constraints?: QueryConstraint[];
}

export function useClassrooms(schoolId: string, options?: UseClassroomsOptions) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to classrooms
  useEffect(() => {
    if (options?.enabled === false || !schoolId) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'schools', schoolId, 'classrooms'),
        ...(options?.constraints || [])
      );

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Classroom[];
          setClassrooms(data);
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsLoading(false);
          if (options?.onError) {
            options.onError(error);
          }
          console.error('Error fetching classrooms:', err);
        }
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [schoolId, options?.enabled, options?.constraints, options?.onError]);

  const createClassroom = useCallback(async (data: CreateClassroomData) => {
    if (!schoolId || !auth.currentUser) {
      throw new Error('School ID or user not available');
    }

    try {
      const classroomData = {
        ...data,
        enrolledCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, 'schools', schoolId, 'classrooms'),
        classroomData
      );

      return {
        id: docRef.id,
        ...classroomData
      } as Classroom;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [schoolId]);

  const updateClassroom = useCallback(async (classroomId: string, updates: Partial<Classroom>) => {
    if (!schoolId) {
      throw new Error('School ID not available');
    }

    try {
      const classroomRef = doc(db, 'schools', schoolId, 'classrooms', classroomId);
      await updateDoc(classroomRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [schoolId]);

  const deleteClassroom = useCallback(async (classroomId: string) => {
    if (!schoolId) {
      throw new Error('School ID not available');
    }

    try {
      const classroomRef = doc(db, 'schools', schoolId, 'classrooms', classroomId);
      await deleteDoc(classroomRef);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [schoolId]);

  const getClassroom = useCallback((classroomId: string): Classroom | null => {
    return classrooms.find(c => c.id === classroomId) || null;
  }, [classrooms]);

  const getClassroomsByTeacher = useCallback((teacherUid: string): Classroom[] => {
    return classrooms.filter(c => c.teacherUid === teacherUid);
  }, [classrooms]);

  return {
    classrooms,
    isLoading,
    error,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    getClassroom,
    getClassroomsByTeacher,
  };
}
