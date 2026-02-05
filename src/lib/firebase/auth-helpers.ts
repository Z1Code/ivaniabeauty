import { adminAuth, adminDb } from "./admin";
import { cookies } from "next/headers";
import type { AdminProfile } from "./types";

/**
 * Verify the current session and return the admin profile.
 * Use this in Server Components and API routes to protect admin pages.
 */
export async function getAdminSession(): Promise<AdminProfile | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session");

    if (!sessionCookie?.value) return null;

    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true
    );

    const adminDoc = await adminDb
      .collection("adminProfiles")
      .doc(decodedClaims.uid)
      .get();

    if (!adminDoc.exists) return null;

    const data = adminDoc.data()!;
    return {
      uid: decodedClaims.uid,
      email: data.email || decodedClaims.email || "",
      fullName: data.fullName || "",
      role: data.role || "admin",
      avatarUrl: data.avatarUrl || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  } catch {
    return null;
  }
}

/**
 * Require admin session - throws redirect if not authenticated.
 * Use in Server Components.
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const admin = await getAdminSession();
  if (!admin) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
    // redirect() throws internally, this line is never reached
    throw new Error("Redirect");
  }
  return admin;
}
