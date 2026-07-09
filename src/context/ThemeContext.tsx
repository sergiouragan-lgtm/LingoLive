import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export type ThemeType = 'corporate' | 'kiditorial';

interface ThemeContextType {
  theme: ThemeType;
  age: number | null;
  setAge: (newAge: number) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [age, setAgeState] = useState<number | null>(() => {
    const cached = localStorage.getItem('lingolive_student_age');
    return cached ? Number(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  // Derive theme from age
  const theme: ThemeType = age !== null && age < 12 ? 'kiditorial' : 'corporate';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setLoading(true);
        try {
          const studentRef = doc(db, "students", user.uid);
          const studentSnap = await getDoc(studentRef);
          if (studentSnap.exists()) {
            const data = studentSnap.data();
            if (data && data.age !== undefined) {
              const fetchedAge = Number(data.age);
              setAgeState(fetchedAge);
              localStorage.setItem('lingolive_student_age', String(fetchedAge));
            }
          } else {
            // Default to corporate age if not set
            setAgeState(20);
            localStorage.setItem('lingolive_student_age', '20');
          }
        } catch (err: any) {
          console.warn("Failed to fetch student age for theme wrapper", err);
          try {
            handleFirestoreError(err, OperationType.GET, `students/${user.uid}`);
          } catch (handled) {}
        } finally {
          setLoading(false);
        }
      } else {
        setAgeState(null);
        localStorage.removeItem('lingolive_student_age');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setAge = async (newAge: number) => {
    setAgeState(newAge);
    localStorage.setItem('lingolive_student_age', String(newAge));
    
    const user = auth.currentUser;
    if (user) {
      try {
        const studentRef = doc(db, "students", user.uid);
        await setDoc(studentRef, { age: newAge }, { merge: true });
      } catch (err: any) {
        console.error("Failed to persist updated age to Firestore", err);
        try {
          handleFirestoreError(err, OperationType.WRITE, `students/${user.uid}`);
        } catch (handled) {}
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, age, setAge, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
