import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    // Check initial state
    if (typeof window !== 'undefined' && (window as any).isPWAInstallable) {
      setIsInstallable((window as any).isPWAInstallable());
    }

    const handleCanInstall = (e: any) => {
      setIsInstallable(e.detail);
    };

    window.addEventListener('pwa-can-install', handleCanInstall);
    
    // Fallback detection for already installed or standalone mode
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsInstallable(false);
      }
    }

    return () => {
      window.removeEventListener('pwa-can-install', handleCanInstall);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).triggerPWAInstall) {
      return await (window as any).triggerPWAInstall();
    }
    return false;
  };

  return { isInstallable, install };
}
