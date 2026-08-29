import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export type ThemeType = 'corporate' | 'kiditorial';
export type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  age: number | null;
  setAge: (newAge: number) => Promise<void>;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const normalizeColorScheme = (value: string | null): ColorScheme =>
  value === 'light' || value === 'dark' || value === 'system' ? value : 'system';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [age, setAgeState] = useState<number | null>(() => {
    const cached = localStorage.getItem('lingolive_student_age');
    return cached ? Number(cached) : null;
  });
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    return normalizeColorScheme(localStorage.getItem('lingolive_color_scheme'));
  });
  const [loading, setLoading] = useState(true);

  // Apply the approved light/dark theme and follow OS changes while in system mode.
  useEffect(() => {
    const root = window.document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyScheme = () => root.classList.toggle('dark', colorScheme === 'dark' || (colorScheme === 'system' && media.matches));
    applyScheme();
    if (colorScheme === 'system') media.addEventListener('change', applyScheme);
    return () => media.removeEventListener('change', applyScheme);
  }, [colorScheme]);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem('lingolive_color_scheme', scheme);
  };

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
    <ThemeContext.Provider value={{ theme, age, setAge, colorScheme, setColorScheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'neutral' as any,
      age: 18,
      setAge: () => {},
      colorScheme: 'light' as any,
      setColorScheme: () => {},
      loading: false
    };
  }
  return context;
};
