import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

const sanitizeString = (value: string | undefined) =>
  (value || "")
    .replace(/^"|"$/g, "") // strip wrapping quotes if present
    .replace(/\\n/g, "\n")
    .trim();

const sanitizedProjectId = sanitizeString(
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);
const sanitizedClientEmail = sanitizeString(
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL
);
const sanitizedPrivateKey = sanitizeString(
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
);
const sanitizedStorageBucket =
  sanitizeString(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
  (sanitizedProjectId ? `${sanitizedProjectId}.appspot.com` : undefined);

function isFirebaseConfigured(): boolean {
  return !!(
    sanitizedProjectId &&
    sanitizedClientEmail &&
    sanitizedPrivateKey &&
    !sanitizedPrivateKey.includes("your-private-key")
  );
}

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else if (isFirebaseConfigured()) {
    const serviceAccount: ServiceAccount = {
      projectId: sanitizedProjectId,
      clientEmail: sanitizedClientEmail,
      privateKey: sanitizedPrivateKey,
    };
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: sanitizedProjectId,
      storageBucket: sanitizedStorageBucket,
    });
  } else {
    // Firebase not configured - initialize with minimal config for build time
    app = initializeApp({ projectId: "placeholder" });
  }

  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
  adminStorage = getStorage(app);
}

initFirebaseAdmin();

export { adminAuth, adminDb, adminStorage, isFirebaseConfigured };
export default app!;
