import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getRemoteConfig, RemoteConfig } from 'firebase/remote-config';
import { getMessaging, Messaging } from 'firebase/messaging';

// Secure placeholder config with environment fallback for production scale
const defaultFirebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyEnterpriseLingoLIVE12345",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "lingolive-ia-enterprise.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "lingolive-ia-enterprise",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "lingolive-ia-enterprise.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:a1b2c3d4e5f6g7h8",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ENTERPRISE1"
};

let appInstance: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;
  
  if (getApps().length > 0) {
    appInstance = getApp();
  } else {
    try {
      appInstance = initializeApp(defaultFirebaseConfig);
      console.log("[Firebase Core] Enterprise initialization succeeded.");
    } catch (error) {
      console.error("[Firebase Core] Direct initialization failed, fallback loaded.", error);
      appInstance = initializeApp({ ...defaultFirebaseConfig, apiKey: "dummy-key-fallback" });
    }
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
  const firestore = getFirestore(getFirebaseApp());
  return firestore;
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

export function getFirebaseFunctions(region: string = 'us-central1'): Functions {
  return getFunctions(getFirebaseApp(), region);
}

export function getFirebaseRemoteConfig(): RemoteConfig {
  return getRemoteConfig(getFirebaseApp());
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      return getMessaging(getFirebaseApp());
    } catch (e) {
      console.warn("[Firebase Core] Messaging is not supported or permission blocked in this browser scope.", e);
    }
  }
  return null;
}
