import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

// PUT: Update review status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const validStatuses = ["pending", "approved", "rejected"];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.status) updateData.status = body.status;

  await adminDb.collection("reviews").doc(id).update(updateData);
  return NextResponse.json({ success: true });
}

// DELETE: Hard delete a review
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const docRef = adminDb.collection("reviews").doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  await docRef.delete();
  return NextResponse.json({ success: true });
}
