import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

function envOrDefault(key: string, fallback: string) {
  const value = process.env[key];
  if (value && value.trim()) {
    return value;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${key} must be configured for production.`);
  }
  return fallback;
}

const firebaseConfig = {
  apiKey: envOrDefault("NEXT_PUBLIC_FIREBASE_API_KEY", "AIzaSyDJf0hl5mEtWTKjI251PAeFDh8Ir39z8Vg"),
  authDomain: envOrDefault("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "test-4d303.firebaseapp.com"),
  projectId: envOrDefault("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "test-4d303"),
  storageBucket:
    envOrDefault("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "test-4d303.firebasestorage.app"),
  messagingSenderId: envOrDefault("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "971534303955"),
  appId: envOrDefault("NEXT_PUBLIC_FIREBASE_APP_ID", "1:971534303955:web:c42732b64471af58a64a26"),
  measurementId: envOrDefault("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", "G-NG9ZE8QSRW")
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

export async function initFirebaseAnalytics() {
  if (typeof window === "undefined") {
    return null;
  }
  const { isSupported, getAnalytics } = await import("firebase/analytics");
  if (!(await isSupported())) {
    return null;
  }
  return getAnalytics(firebaseApp);
}
