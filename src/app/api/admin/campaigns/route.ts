import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await adminDb.collection("campaigns").orderBy("createdAt", "desc").get();
  const campaigns = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startsAt: doc.data().startsAt?.toDate?.()?.toISOString() || null,
    endsAt: doc.data().endsAt?.toDate?.()?.toISOString() || null,
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
  }));
  return NextResponse.json(campaigns);
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const docRef = await adminDb.collection("campaigns").add({
    name: body.name,
    description: body.description || "",
    couponId: body.couponId || null,
    startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
    endsAt: body.endsAt ? new Date(body.endsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: body.isActive !== false,
    bannerImage: body.bannerImage || null,
    bannerTextEn: body.bannerTextEn || "",
    bannerTextEs: body.bannerTextEs || "",
    targetUrl: body.targetUrl || "/shop",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}
