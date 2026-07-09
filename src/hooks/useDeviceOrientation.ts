import { useState, useEffect } from 'react';

export type Orientation = 'portrait' | 'landscape';

export function useDeviceOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape';
    }
    return 'portrait';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setOrientation(window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleResize);
    
    // Also use media query for extra robustness
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setOrientation(e.matches ? 'portrait' : 'landscape');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaQueryChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      }
    };
  }, []);

  return orientation;
}
