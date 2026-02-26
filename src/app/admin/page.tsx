import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { computeTotalStock } from "@/lib/stock-helpers";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboard() {
  await requireAdmin();

  // Fetch active products to check sizeStock (can't query inside maps in Firestore)
  const lowStockPromise = adminDb
    .collection("products")
    .where("isActive", "==", true)
    .select("nameEs", "nameEn", "sizeStock", "colorSizeStock", "sizes")
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
    totalStock: number;
  }> = lowStockSnap
    ? lowStockSnap.docs
        .map((doc) => {
          const data = doc.data();
          const colorSizeStock = data.colorSizeStock && typeof data.colorSizeStock === "object"
            ? (data.colorSizeStock as Record<string, Record<string, number>>)
            : undefined;
          const sizeStock: Record<string, number> = data.sizeStock || {};
          const totalStock = computeTotalStock(colorSizeStock, sizeStock);
          return {
            id: doc.id,
            name: data.nameEs || data.nameEn || "---",
            totalStock,
          };
        })
        .filter((p) => p.totalStock <= 10)
        .sort((a, b) => a.totalStock - b.totalStock)
        .slice(0, 5)
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
