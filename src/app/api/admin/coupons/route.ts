import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await adminDb.collection("coupons").orderBy("createdAt", "desc").get();
  const coupons = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startsAt: doc.data().startsAt?.toDate?.()?.toISOString() || null,
    expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
  }));
  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.code || !body.discountType || body.discountValue == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check uniqueness
  const existing = await adminDb.collection("coupons").where("code", "==", body.code.toUpperCase()).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
  }

  const docRef = await adminDb.collection("coupons").add({
    code: body.code.toUpperCase(),
    description: body.description || "",
    discountType: body.discountType,
    discountValue: Number(body.discountValue),
    minPurchase: body.minPurchase ? Number(body.minPurchase) : 0,
    maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
    usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
    usageCount: 0,
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    isActive: body.isActive !== false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id }, { status: 201 });
}
