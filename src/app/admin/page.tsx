import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboard() {
  await requireAdmin();

  // Fetch dashboard data from Firestore
  const [productsSnap, ordersSnap, customersSnap, reviewsSnap] =
    await Promise.all([
      adminDb.collection("products").where("isActive", "==", true).count().get(),
      adminDb.collection("orders").orderBy("createdAt", "desc").limit(5).get(),
      adminDb.collection("customers").count().get(),
      adminDb
        .collection("reviews")
        .where("status", "==", "pending")
        .count()
        .get(),
    ]);

  const totalProducts = productsSnap.data().count;
  const totalCustomers = customersSnap.data().count;
  const pendingReviews = reviewsSnap.data().count;

  // Get recent orders
  const recentOrders = ordersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      orderNumber: data.orderNumber || "---",
      customerName: data.customerName || "---",
      total: data.total || 0,
      status: data.status || "pending",
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  // Calculate total revenue
  let totalRevenue = 0;
  let totalOrders = 0;
  try {
    const allOrdersSnap = await adminDb.collection("orders").get();
    totalOrders = allOrdersSnap.size;
    allOrdersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status !== "cancelled" && data.status !== "refunded") {
        totalRevenue += data.total || 0;
      }
    });
  } catch {
    // If no orders collection yet, that's fine
  }

  // Get low stock products
  let lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
  }> = [];
  try {
    const lowStockSnap = await adminDb
      .collection("products")
      .where("stockQuantity", "<=", 10)
      .where("isActive", "==", true)
      .limit(5)
      .get();

    lowStockProducts = lowStockSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.nameEs || data.nameEn || "---",
        stockQuantity: data.stockQuantity || 0,
      };
    });
  } catch {
    // Products may not have stockQuantity yet
  }

  return (
    <DashboardClient
      stats={{
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
        pendingReviews,
      }}
      recentOrders={recentOrders}
      lowStockProducts={lowStockProducts}
    />
  );
}
