/**
 * Setup script: Create admin profile in Firestore for an existing Firebase Auth user.
 *
 * Run with: npx tsx scripts/setup-admin.ts
 *
 * Requires .env.local with Firebase Admin credentials.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

async function setupAdmin() {
  const adminEmail = "admin@ivaniabeauty.com";

  console.log(`Looking up user: ${adminEmail}`);

  try {
    const userRecord = await auth.getUserByEmail(adminEmail);
    console.log(`Found user with UID: ${userRecord.uid}`);

    // Create admin profile in Firestore
    await db.collection("adminProfiles").doc(userRecord.uid).set(
      {
        email: adminEmail,
        fullName: "Admin",
        role: "super_admin",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("Admin profile created in Firestore!");
    console.log(`\nDocument path: adminProfiles/${userRecord.uid}`);
    console.log("\nYou can now login at /admin/login");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

setupAdmin();
