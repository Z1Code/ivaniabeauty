import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";

// GET: List orders (with optional status filter)
export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50;

  let query: FirebaseFirestore.Query = adminDb
    .collection("orders")
    .orderBy("createdAt", "desc");

  if (status) {
    query = query.where("status", "==", status);
  }

  query = query.limit(limit);

  const snapshot = await query.get();
  const orders = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      orderNumber: d.orderNumber || "---",
      customerName: d.customerName || "---",
      customerEmail: d.customerEmail || "---",
      total: d.total || 0,
      status: d.status || "pending",
      paymentMethod: d.paymentMethod || "card",
      itemCount: d.itemCount || 0,
      labelUrl: d.labelUrl || null,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
    };
  });

  return NextResponse.json(orders);
}
