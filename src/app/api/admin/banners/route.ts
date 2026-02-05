import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await adminDb.collection("banners").orderBy("sortOrder", "asc").get();
  const banners = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startsAt: doc.data().startsAt?.toDate?.()?.toISOString() || null,
    endsAt: doc.data().endsAt?.toDate?.()?.toISOString() || null,
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
  }));
  return NextResponse.json(banners);
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.titleEn) {
    return NextResponse.json({ error: "titleEn is required" }, { status: 400 });
  }

  const docRef = await adminDb.collection("banners").add({
    titleEn: body.titleEn,
    titleEs: body.titleEs || "",
    subtitleEn: body.subtitleEn || "",
    subtitleEs: body.subtitleEs || "",
    imageUrl: body.imageUrl || "",
    linkUrl: body.linkUrl || "/",
    position: body.position || "hero",
    sortOrder: body.sortOrder ?? 0,
    isActive: body.isActive !== false,
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    endsAt: body.endsAt ? new Date(body.endsAt) : null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}
