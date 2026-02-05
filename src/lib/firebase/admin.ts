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

function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY.includes("your-private-key")
  );
}

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else if (isFirebaseConfigured()) {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    };
    app = initializeApp({ credential: cert(serviceAccount) });
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
