import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";

// GET: Get a single customer with their orders
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await adminDb.collection("customers").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Get customer orders
  const ordersSnap = await adminDb.collection("orders").where("customerId", "==", id).get();
  const orders = ordersSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || null,
  }));

  const data = doc.data()!;
  return NextResponse.json({
    id: doc.id,
    ...data,
    orders,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
  });
}
