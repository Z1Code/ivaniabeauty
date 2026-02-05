import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: skip initialization when env vars are missing (e.g. during
// Vercel build-time prerendering). At runtime the vars are always present.
const isConfigured = !!firebaseConfig.apiKey;
const app =
  isConfigured
    ? getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApp()
    : null;

export const auth = app
  ? getAuth(app)
  : (null as unknown as ReturnType<typeof getAuth>);
export const db = app
  ? getFirestore(app)
  : (null as unknown as ReturnType<typeof getFirestore>);
export const storage = app
  ? getStorage(app)
  : (null as unknown as ReturnType<typeof getStorage>);
export default app;
