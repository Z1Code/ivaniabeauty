import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

// GET: Verify current session and return admin profile
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true
    );

    const adminDoc = await adminDb
      .collection("adminProfiles")
      .doc(decodedClaims.uid)
      .get();

    if (!adminDoc.exists) {
      return NextResponse.json({ authenticated: false }, { status: 403 });
    }

    const adminData = adminDoc.data();

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        fullName: adminData?.fullName || "",
        role: adminData?.role || "admin",
        avatarUrl: adminData?.avatarUrl || null,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
