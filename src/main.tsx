import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserRoleProvider } from './context/UserRoleContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { LocalizationProvider } from './context/LocalizationContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserRoleProvider>
      <ThemeProvider>
        <LocalizationProvider>
          <App />
        </LocalizationProvider>
      </ThemeProvider>
    </UserRoleProvider>
  </StrictMode>,
);

// Register Service Worker for offline support
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('LingoLive ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.error('LingoLive ServiceWorker registration failed: ', err);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Register in dev mode too for easier testing
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('LingoLive ServiceWorker (Dev) registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.error('LingoLive ServiceWorker (Dev) registration failed: ', err);
      });
  });
}

