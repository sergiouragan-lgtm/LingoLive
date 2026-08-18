import * as React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register Service Worker for offline support
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('LingoLive ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((err) => {
          // If the error is an AbortError, it might be due to a race condition, ignore it.
          if (err.name === 'AbortError') {
            console.warn('LingoLive ServiceWorker registration aborted, possibly due to race condition.');
          } else {
            console.error('LingoLive ServiceWorker registration failed: ', err);
          }
        });
    });
  }
}

registerServiceWorker();

// Global PWA prompt handler for in-app installation
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI to notify that our app is installable
  window.dispatchEvent(new CustomEvent('pwa-can-install', { detail: true }));
});

(window as any).triggerPWAInstall = async () => {
  if (!deferredPrompt) {
    console.warn('PWA installation prompt not deferred yet.');
    return false;
  }
  try {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-can-install', { detail: false }));
    return outcome === 'accepted';
  } catch (err) {
    console.error('Error during PWA installation:', err);
    return false;
  }
};

(window as any).isPWAInstallable = () => {
  return !!deferredPrompt;
};

