import { NextResponse } from "next/server";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isFirebaseConfigured()) {
    return NextResponse.json({
      stats: { totalOrders: 0, totalRevenue: 0, activeProducts: 0, totalCustomers: 0 },
      recentOrders: [],
      topProducts: [],
      statusBreakdown: [],
    });
  }

  try {
    // Run all queries in parallel for maximum speed
    const [
      productsSnap,
      customersCountSnap,
      ordersSnap,
    ] = await Promise.all([
      // Only fetch fields needed for top products
      adminDb.collection("products").select("nameEs", "nameEn", "price", "reviewCount", "isActive").get(),
      adminDb.collection("customers").count().get(),
      // Only fetch fields needed for order stats
      adminDb.collection("orders").select("orderNumber", "customerName", "total", "status", "createdAt").orderBy("createdAt", "desc").limit(200).get(),
    ]);

    // Process products server-side
    const products = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nameEs: (data.nameEs as string) || "",
        nameEn: (data.nameEn as string) || "",
        price: (data.price as number) || 0,
        reviewCount: (data.reviewCount as number) || 0,
        isActive: data.isActive === true,
      };
    });
    const activeProducts = products.filter((p) => p.isActive).length;

    const topProducts = [...products]
      .filter((p) => p.isActive)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.nameEs || p.nameEn || "---",
        revenue: p.price,
        orders: p.reviewCount,
      }));

    // Process orders server-side
    const orders = ordersSnap.docs.map((doc) => {
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

    let totalRevenue = 0;
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== "cancelled" && o.status !== "refunded") {
        totalRevenue += o.total;
      }
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    return NextResponse.json({
      stats: {
        totalOrders: orders.length,
        totalRevenue,
        activeProducts,
        totalCustomers: customersCountSnap.data().count,
      },
      recentOrders: orders.slice(0, 10),
      topProducts,
      statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
