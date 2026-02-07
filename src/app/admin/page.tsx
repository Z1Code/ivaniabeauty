import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboard() {
  await requireAdmin();

  const lowStockPromise = adminDb
    .collection("products")
    .where("stockQuantity", "<=", 10)
    .where("isActive", "==", true)
    .limit(5)
    .get()
    .catch(() => null);

  // Fetch dashboard data from Firestore - all counts + recent orders in parallel
  const [
    productsSnap,
    ordersSnap,
    customersSnap,
    reviewsSnap,
    ordersCountSnap,
    revenueSnap,
    lowStockSnap,
  ] =
    await Promise.all([
      adminDb.collection("products").where("isActive", "==", true).count().get(),
      adminDb.collection("orders").orderBy("createdAt", "desc").limit(5).get(),
      adminDb.collection("customers").count().get(),
      adminDb
        .collection("reviews")
        .where("status", "==", "pending")
        .count()
        .get(),
      // Use count() instead of fetching all docs just for the count
      adminDb.collection("orders").count().get(),
      // Only fetch total + status fields for revenue calculation (not full documents)
      adminDb.collection("orders").select("total", "status").get(),
      lowStockPromise,
    ]);

  const totalProducts = productsSnap.data().count;
  const totalCustomers = customersSnap.data().count;
  const pendingReviews = reviewsSnap.data().count;
  const totalOrders = ordersCountSnap.data().count;

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

  // Calculate total revenue from lightweight query (only total + status fields)
  let totalRevenue = 0;
  try {
    revenueSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status !== "cancelled" && data.status !== "refunded") {
        totalRevenue += data.total || 0;
      }
    });
  } catch {
    // If no orders collection yet, that's fine
  }

  const lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
  }> = lowStockSnap
    ? lowStockSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.nameEs || data.nameEn || "---",
        stockQuantity: data.stockQuantity || 0,
      };
    })
    : [];

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
