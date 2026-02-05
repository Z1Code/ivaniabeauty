import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import CustomerDetailClient from "./CustomerDetailClient";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const customerDoc = await adminDb.collection("customers").doc(id).get();

  if (!customerDoc.exists) {
    notFound();
  }

  const d = customerDoc.data()!;
  const customer = {
    id: customerDoc.id,
    email: d.email || "",
    firstName: d.firstName || "",
    lastName: d.lastName || "",
    phone: d.phone || "",
    addressLine1: d.addressLine1 || "",
    addressLine2: d.addressLine2 || "",
    city: d.city || "",
    state: d.state || "",
    zipCode: d.zipCode || "",
    country: d.country || "",
    totalOrders: d.totalOrders || 0,
    totalSpent: d.totalSpent || 0,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };

  // Fetch customer orders
  const ordersSnapshot = await adminDb
    .collection("orders")
    .where("customerId", "==", id)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const orders = ordersSnapshot.docs.map((doc) => {
    const o = doc.data();
    return {
      id: doc.id,
      orderNumber: o.orderNumber || "---",
      total: o.total || 0,
      status: o.status || "pending",
      createdAt: o.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  return <CustomerDetailClient customer={customer} orders={orders} />;
}
