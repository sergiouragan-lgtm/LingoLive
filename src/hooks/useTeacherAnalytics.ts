import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface TeacherAnalytics {
  teacherId: string;
  schoolId: string;
  totalStudents: number;
  totalClassrooms: number;
  averageStudentPerformance: number;
  totalLessonsTaught: number;
  averageClassScore: number;
  classesWithHighPerformance: number;
  classesNeedingSupport: number;
  lastActivityAt: Timestamp;
  engagementRate: number;
  materialsCreated: number;
}

export interface ClassroomMetrics {
  classroomId: string;
  studentCount: number;
  averagePerformance: number;
  topPerformer: string;
  needsSupport: string[];
  engagementRate: number;
  lastAssignment: Timestamp | null;
}

export interface TeacherStats {
  totalHoursTeaching: number;
  totalStudentsImpacted: number;
  averageLessonRating: number;
  materialsLibrarySize: number;
  questionnairesIssued: number;
  feedbacksProvided: number;
  resourcesUsed: string[];
}

export interface UseTeacherAnalyticsOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useTeacherAnalytics(
  schoolId: string,
  teacherId: string,
  options?: UseTeacherAnalyticsOptions
) {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled === false || !schoolId || !teacherId) {
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const analyticsRef = doc(
          db,
          'schools',
          schoolId,
          'teachers',
          teacherId,
          'analytics',
          'latest'
        );

        const docSnap = await getDoc(analyticsRef);
        if (docSnap.exists()) {
          setAnalytics({
            teacherId,
            schoolId,
            ...docSnap.data()
          } as TeacherAnalytics);
          setError(null);
        } else {
          setAnalytics(null);
        }
        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (options?.onError) {
          options.onError(error);
        }
        console.error('Error fetching teacher analytics:', err);
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [schoolId, teacherId, options?.enabled, options?.onError]);

  return {
    analytics,
    isLoading,
    error,
  };
}

export function useTeacherClassroomMetrics(
  schoolId: string,
  teacherId: string,
  options?: UseTeacherAnalyticsOptions
) {
  const [classrooms, setClassrooms] = useState<ClassroomMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled === false || !schoolId || !teacherId) {
      setIsLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        // Get classrooms taught by teacher
        const q = query(
          collection(db, 'schools', schoolId, 'classrooms'),
          where('teacherUid', '==', teacherId)
        );

        const snapshot = await getDocs(q);
        const metricsPromises = snapshot.docs.map(async (classroomDoc) => {
          const metricsRef = doc(
            db,
            'schools',
            schoolId,
            'classrooms',
            classroomDoc.id,
            'metrics',
            'latest'
          );

          const metricsSnap = await getDoc(metricsRef);
          if (metricsSnap.exists()) {
            return {
              classroomId: classroomDoc.id,
              ...metricsSnap.data()
            } as ClassroomMetrics;
          }
          return null;
        });

        const metricsData = (await Promise.all(metricsPromises)).filter(
          (m) => m !== null
        ) as ClassroomMetrics[];

        setClassrooms(metricsData);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (options?.onError) {
          options.onError(error);
        }
        console.error('Error fetching classroom metrics:', err);
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [schoolId, teacherId, options?.enabled, options?.onError]);

  const getHighPerformingClasses = useCallback(
    (threshold: number = 75): ClassroomMetrics[] => {
      return classrooms.filter((c) => c.averagePerformance >= threshold);
    },
    [classrooms]
  );

  const getClassesNeedingSupport = useCallback(
    (threshold: number = 50): ClassroomMetrics[] => {
      return classrooms.filter((c) => c.averagePerformance < threshold);
    },
    [classrooms]
  );

  const getTotalStudents = useCallback((): number => {
    return classrooms.reduce((sum, c) => sum + c.studentCount, 0);
  }, [classrooms]);

  const getAverageEngagement = useCallback((): number => {
    if (classrooms.length === 0) return 0;
    const sum = classrooms.reduce((acc, c) => acc + c.engagementRate, 0);
    return sum / classrooms.length;
  }, [classrooms]);

  const getClassroomsSummary = useCallback(() => {
    return {
      totalClassrooms: classrooms.length,
      totalStudents: getTotalStudents(),
      averagePerformance:
        classrooms.length > 0
          ? classrooms.reduce((sum, c) => sum + c.averagePerformance, 0) /
            classrooms.length
          : 0,
      averageEngagement: getAverageEngagement(),
      highPerformingCount: getHighPerformingClasses().length,
      needingSupportCount: getClassesNeedingSupport().length,
    };
  }, [classrooms, getTotalStudents, getAverageEngagement, getHighPerformingClasses, getClassesNeedingSupport]);

  return {
    classrooms,
    isLoading,
    error,
    getHighPerformingClasses,
    getClassesNeedingSupport,
    getTotalStudents,
    getAverageEngagement,
    getClassroomsSummary,
  };
}

export function useTeacherStats(
  schoolId: string,
  teacherId: string,
  options?: UseTeacherAnalyticsOptions
) {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled === false || !schoolId || !teacherId) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const statsRef = doc(
          db,
          'schools',
          schoolId,
          'teachers',
          teacherId,
          'stats',
          'lifetime'
        );

        const docSnap = await getDoc(statsRef);
        if (docSnap.exists()) {
          setStats(docSnap.data() as TeacherStats);
          setError(null);
        } else {
          setStats(null);
        }
        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (options?.onError) {
          options.onError(error);
        }
        console.error('Error fetching teacher stats:', err);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [schoolId, teacherId, options?.enabled, options?.onError]);

  return {
    stats,
    isLoading,
    error,
  };
}
