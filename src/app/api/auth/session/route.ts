import { NextResponse } from "next/server";
import { adminAuth, adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

// POST: Create session cookie from Firebase ID token
export async function POST(request: Request) {
  try {
    // Check if Firebase Admin SDK is properly configured
    if (!isFirebaseConfigured()) {
      console.error("SESSION ERROR: Firebase Admin SDK not configured. Check FIREBASE_ADMIN_* env vars.");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token required" },
        { status: 400 }
      );
    }

    // Verify the ID token
    console.log("SESSION: Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log("SESSION: Token verified for UID:", decodedToken.uid);

    // Check if user is an admin
    console.log("SESSION: Checking adminProfiles for UID:", decodedToken.uid);
    const adminDoc = await adminDb
      .collection("adminProfiles")
      .doc(decodedToken.uid)
      .get();

    if (!adminDoc.exists) {
      console.error("SESSION: No adminProfiles document found for UID:", decodedToken.uid);
      return NextResponse.json(
        { error: "Not authorized as admin" },
        { status: 403 }
      );
    }

    console.log("SESSION: Admin profile found, creating session cookie...");

    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    const adminData = adminDoc.data();

    console.log("SESSION: Login successful for", decodedToken.email);

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        fullName: adminData?.fullName || "",
        role: adminData?.role || "admin",
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("SESSION ERROR:", err.message);
    console.error("SESSION ERROR STACK:", err.stack);
    return NextResponse.json(
      { error: "Failed to create session: " + err.message },
      { status: 401 }
    );
  }
}

// DELETE: Destroy session cookie (logout)
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session");

    if (sessionCookie?.value) {
      // Revoke the session
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(
          sessionCookie.value
        );
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      } catch {
        // Session may already be invalid
      }
    }

    cookieStore.delete("__session");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
