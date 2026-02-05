import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

// GET: Get order details
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await adminDb.collection("orders").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get order items
  const itemsSnap = await adminDb.collection("orderItems").where("orderId", "==", id).get();
  const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const data = doc.data()!;
  return NextResponse.json({
    id: doc.id,
    ...data,
    items,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
  });
}

// PUT: Update order (mainly status)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.status) updateData.status = body.status;
  if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber;
  if (body.notes !== undefined) updateData.notes = body.notes;

  await adminDb.collection("orders").doc(id).update(updateData);
  return NextResponse.json({ success: true });
}
