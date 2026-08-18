/**
 * Utility for robust cross-browser and cross-device Fullscreen management.
 * Handles standard Fullscreen APIs, vendor prefixes (WebKit, Mozilla, MS),
 * and provides a simulated CSS-based fallback for mobile devices
 * (like iOS Safari on iPhone) that do not support native Document-level Fullscreen.
 */

export const isFullscreenSupported = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  const doc = document as any;
  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  );
};

export const getFullscreenElement = (): Element | null => {
  if (typeof document === 'undefined') return null;
  
  const doc = document as any;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.webkitCurrentFullScreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
};

export const isSimulatedFullscreenActive = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('simulated-fullscreen');
};

export const isFullscreenActive = (): boolean => {
  return !!getFullscreenElement() || isSimulatedFullscreenActive();
};

/**
 * Activates Fullscreen mode.
 * Tries standard and vendor-prefixed APIs.
 * If unsupported or blocked (e.g. iOS WebKit or iPadOS custom Safari),
 * falls back to simulated CSS Fullscreen mode.
 */
export const requestFullscreen = async (element?: HTMLElement): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const target = element || document.documentElement;
  const targetAny = target as any;

  try {
    if (targetAny.requestFullscreen) {
      await targetAny.requestFullscreen();
    } else if (targetAny.webkitRequestFullscreen) {
      await targetAny.webkitRequestFullscreen();
    } else if (targetAny.webkitRequestFullScreen) {
      await targetAny.webkitRequestFullScreen();
    } else if (targetAny.mozRequestFullScreen) {
      await targetAny.mozRequestFullScreen();
    } else if (targetAny.msRequestFullscreen) {
      await targetAny.msRequestFullscreen();
    } else {
      // Browser doesn't support native fullscreen (e.g., iPhone iOS WebKit)
      // Apply simulated fullscreen fallback
      applySimulatedFullscreen();
    }
  } catch (error) {
    console.warn('Native requestFullscreen failed, applying simulated fallback:', error);
    applySimulatedFullscreen();
  }
};

/**
 * Exits Fullscreen mode.
 */
export const exitFullscreen = async (): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const doc = document as any;

  // Always remove simulated fullscreen classes
  removeSimulatedFullscreen();

  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.webkitCancelFullScreen) {
      await doc.webkitCancelFullScreen();
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  } catch (error) {
    console.warn('Native exitFullscreen failed or was not active:', error);
  }
};

/**
 * Toggles Fullscreen state.
 */
export const toggleFullscreen = async (element?: HTMLElement): Promise<void> => {
  if (isFullscreenActive()) {
    await exitFullscreen();
  } else {
    await requestFullscreen(element);
  }
};

/**
 * Helper to apply simulated CSS fullscreen layout.
 * Extremely useful for iOS WebKit browsers where native Fullscreen API is unavailable.
 */
const applySimulatedFullscreen = () => {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;

  html.classList.add('simulated-fullscreen');
  body.classList.add('simulated-fullscreen-body');

  // Inject CSS rules dynamically to support robust absolute/fixed overlays
  let styleEl = document.getElementById('fullscreen-fallback-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'fullscreen-fallback-styles';
    styleEl.innerHTML = `
      .simulated-fullscreen {
        overflow: hidden !important;
        height: 100% !important;
        width: 100% !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
      }
      .simulated-fullscreen-body {
        overflow: hidden !important;
        height: 100% !important;
        width: 100% !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Scroll to top to ensure clean view on mobile webkit engines
  window.scrollTo(0, 0);
};

/**
 * Helper to remove simulated CSS fullscreen layout.
 */
const removeSimulatedFullscreen = () => {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;

  html.classList.remove('simulated-fullscreen');
  body.classList.remove('simulated-fullscreen-body');
};

/**
 * Registers a cross-browser listener for native fullscreen change events.
 */
export const addFullscreenChangeListener = (callback: () => void): (() => void) => {
  if (typeof document === 'undefined') return () => {};

  const events = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange'
  ];

  events.forEach(event => {
    document.addEventListener(event, callback);
  });

  return () => {
    events.forEach(event => {
      document.removeEventListener(event, callback);
    });
  };
};
