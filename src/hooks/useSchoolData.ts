import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';

export interface SchoolData {
  id: string;
  name: string;
  address: string;
  adminUid: string;
  country: string;
  plan: 'school_basic' | 'school_pro';
  studentsLimit: number;
  teachersLimit: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metrics?: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeStudents: number;
  };
}

export interface UseSchoolDataOptions {
  enabled?: boolean;
  realtime?: boolean;
  onError?: (error: Error) => void;
}

export function useSchoolData(schoolId: string, options?: UseSchoolDataOptions) {
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchSchoolData = useCallback(async () => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const docRef = doc(db, 'schools', schoolId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSchool({
          id: docSnap.id,
          ...docSnap.data()
        } as SchoolData);
        setError(null);
        setIsCached(true);
      } else {
        setError(new Error('School not found'));
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (options?.onError) {
        options.onError(error);
      }
      console.error('Error fetching school data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, options]);

  useEffect(() => {
    if (options?.enabled === false) {
      return;
    }

    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    if (options?.realtime) {
      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        doc(db, 'schools', schoolId),
        (doc) => {
          if (doc.exists()) {
            setSchool({
              id: doc.id,
              ...doc.data()
            } as SchoolData);
            setError(null);
            setIsLoading(false);
          } else {
            setError(new Error('School not found'));
            setIsLoading(false);
          }
        },
        (err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          if (options?.onError) {
            options.onError(error);
          }
          console.error('Error listening to school data:', err);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      // One-time fetch
      fetchSchoolData();
    }
  }, [schoolId, options?.realtime, options?.enabled, fetchSchoolData]);

  const refetch = useCallback(() => {
    fetchSchoolData();
  }, [fetchSchoolData]);

  return {
    school,
    isLoading,
    error,
    isCached,
    refetch,
  };
}
