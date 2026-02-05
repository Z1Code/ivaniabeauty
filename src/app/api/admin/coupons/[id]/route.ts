import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const docRef = adminDb.collection("coupons").doc(id);

  const updateData: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  const fields = ["code", "description", "discountType", "discountValue", "minPurchase", "maxDiscount", "usageLimit", "startsAt", "expiresAt", "isActive"];
  for (const f of fields) {
    if (body[f] !== undefined) {
      if (f === "startsAt" || f === "expiresAt") {
        updateData[f] = body[f] ? new Date(body[f]) : null;
      } else {
        updateData[f] = body[f];
      }
    }
  }
  if (updateData.code) updateData.code = (updateData.code as string).toUpperCase();

  await docRef.update(updateData);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await adminDb.collection("coupons").doc(id).update({
    isActive: false,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true });
}
