import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import OrdersClient from "./OrdersClient";

export default async function AdminOrdersPage() {
  await requireAdmin();

  const snapshot = await adminDb
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

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
      createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  return <OrdersClient orders={orders} />;
}
