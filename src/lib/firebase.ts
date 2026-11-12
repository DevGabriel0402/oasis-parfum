import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDKsr95mN8qAFluDkuf7LN3JXkslK97uTg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "oasis-imports.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "oasis-imports",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "oasis-imports.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "252914369205",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:252914369205:web:ad165fddd0ede75478b4fc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-M09LQZJZKG",
};

// Initialize Firebase once
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Safe Analytics initialization
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Silently ignore if analytics is blocked or unsupported
  });
}
