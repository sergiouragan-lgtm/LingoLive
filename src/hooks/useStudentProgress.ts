import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface StudentProgress {
  studentId: string;
  classroomId: string;
  schoolId: string;
  totalLessonsCompleted: number;
  totalMinutesSpent: number;
  averageAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Timestamp;
  performanceScore: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  vocabularyMastered: number;
  grammarMastered: number;
  speakingScore: number;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
}

export interface ProgressTrend {
  period: string;
  accuracy: number;
  lessonsCompleted: number;
  minutesSpent: number;
}

export interface UseStudentProgressOptions {
  enabled?: boolean;
  realtime?: boolean;
  onError?: (error: Error) => void;
}

export function useStudentProgress(
  schoolId: string,
  studentId: string,
  options?: UseStudentProgressOptions
) {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled === false || !schoolId || !studentId) {
      setIsLoading(false);
      return;
    }

    try {
      const progressRef = doc(
        db,
        'schools',
        schoolId,
        'students',
        studentId,
        'progress',
        'latest'
      );

      if (options?.realtime) {
        const unsubscribe = onSnapshot(
          progressRef,
          (doc) => {
            if (doc.exists()) {
              setProgress({
                studentId,
                ...doc.data()
              } as StudentProgress);
              setError(null);
            } else {
              setProgress(null);
            }
            setIsLoading(false);
          },
          (err) => {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            if (options?.onError) {
              options.onError(error);
            }
            console.error('Error fetching student progress:', err);
            setIsLoading(false);
          }
        );

        return () => unsubscribe();
      } else {
        // One-time fetch
        getDoc(progressRef)
          .then((doc) => {
            if (doc.exists()) {
              setProgress({
                studentId,
                ...doc.data()
              } as StudentProgress);
              setError(null);
            } else {
              setProgress(null);
            }
            setIsLoading(false);
          })
          .catch((err) => {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            if (options?.onError) {
              options.onError(error);
            }
            console.error('Error fetching student progress:', err);
            setIsLoading(false);
          });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
    }
  }, [schoolId, studentId, options?.enabled, options?.realtime, options?.onError]);

  return {
    progress,
    isLoading,
    error,
  };
}

export function useClassroomStudentsProgress(
  schoolId: string,
  classroomId: string,
  options?: UseStudentProgressOptions
) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled === false || !schoolId || !classroomId) {
      setIsLoading(false);
      return;
    }

    try {
      // Query all students in classroom and their progress
      const q = query(
        collection(db, 'schools', schoolId, 'students'),
        where('classroomId', '==', classroomId)
      );

      getDocs(q)
        .then(async (snapshot) => {
          const progressPromises = snapshot.docs.map(async (studentDoc) => {
            const progressRef = doc(
              db,
              'schools',
              schoolId,
              'students',
              studentDoc.id,
              'progress',
              'latest'
            );
            const progressDoc = await getDoc(progressRef);
            if (progressDoc.exists()) {
              return {
                studentId: studentDoc.id,
                ...progressDoc.data()
              } as StudentProgress;
            }
            return null;
          });

          const progressData = (await Promise.all(progressPromises)).filter(
            (p) => p !== null
          ) as StudentProgress[];

          setStudents(progressData);
          setError(null);
          setIsLoading(false);
        })
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          if (options?.onError) {
            options.onError(error);
          }
          console.error('Error fetching classroom students progress:', err);
          setIsLoading(false);
        });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
    }
  }, [schoolId, classroomId, options?.enabled, options?.onError]);

  const getTopPerformers = useCallback((count: number = 5): StudentProgress[] => {
    return students
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, count);
  }, [students]);

  const getNeedAttention = useCallback((threshold: number = 50): StudentProgress[] => {
    return students.filter((s) => s.performanceScore < threshold);
  }, [students]);

  const getAverageMetrics = useCallback(() => {
    if (students.length === 0) {
      return {
        averageAccuracy: 0,
        averageMinutesSpent: 0,
        averageLessonsCompleted: 0,
        averagePerformanceScore: 0,
      };
    }

    const sum = students.reduce(
      (acc, s) => ({
        accuracy: acc.accuracy + s.averageAccuracy,
        minutesSpent: acc.minutesSpent + s.totalMinutesSpent,
        lessonsCompleted: acc.lessonsCompleted + s.totalLessonsCompleted,
        performanceScore: acc.performanceScore + s.performanceScore,
      }),
      { accuracy: 0, minutesSpent: 0, lessonsCompleted: 0, performanceScore: 0 }
    );

    return {
      averageAccuracy: sum.accuracy / students.length,
      averageMinutesSpent: sum.minutesSpent / students.length,
      averageLessonsCompleted: sum.lessonsCompleted / students.length,
      averagePerformanceScore: sum.performanceScore / students.length,
    };
  }, [students]);

  return {
    students,
    isLoading,
    error,
    getTopPerformers,
    getNeedAttention,
    getAverageMetrics,
  };
}
