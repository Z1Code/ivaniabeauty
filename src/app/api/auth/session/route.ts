import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

// POST: Create session cookie from Firebase ID token
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token required" },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check if user is an admin
    const adminDoc = await adminDb
      .collection("adminProfiles")
      .doc(decodedToken.uid)
      .get();

    if (!adminDoc.exists) {
      return NextResponse.json(
        { error: "Not authorized as admin" },
        { status: 403 }
      );
    }

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
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
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
