import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  await requireAdmin();

  const snapshot = await adminDb
    .collection("customers")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const customers = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      email: d.email || "",
      firstName: d.firstName || "",
      lastName: d.lastName || "",
      phone: d.phone || "",
      totalOrders: d.totalOrders || 0,
      totalSpent: d.totalSpent || 0,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  return <CustomersClient customers={customers} />;
}
