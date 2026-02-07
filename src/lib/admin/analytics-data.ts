import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";

export interface AnalyticsStats {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  totalCustomers: number;
}

export interface AnalyticsRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface AnalyticsTopProduct {
  id: string;
  name: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsStatusBreakdown {
  status: string;
  count: number;
}

export interface AnalyticsPayload {
  stats: AnalyticsStats;
  recentOrders: AnalyticsRecentOrder[];
  topProducts: AnalyticsTopProduct[];
  statusBreakdown: AnalyticsStatusBreakdown[];
}

function emptyAnalytics(): AnalyticsPayload {
  return {
    stats: {
      totalOrders: 0,
      totalRevenue: 0,
      activeProducts: 0,
      totalCustomers: 0,
    },
    recentOrders: [],
    topProducts: [],
    statusBreakdown: [],
  };
}

export async function getAdminAnalyticsData(): Promise<AnalyticsPayload> {
  if (!isFirebaseConfigured()) {
    return emptyAnalytics();
  }

  const [productsSnap, customersCountSnap, ordersSnap] = await Promise.all([
    adminDb
      .collection("products")
      .select("nameEs", "nameEn", "price", "reviewCount", "isActive")
      .get(),
    adminDb.collection("customers").count().get(),
    adminDb
      .collection("orders")
      .select("orderNumber", "customerName", "total", "status", "createdAt")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get(),
  ]);

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

  const orders = ordersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      orderNumber: (data.orderNumber as string) || "---",
      customerName: (data.customerName as string) || "---",
      total: (data.total as number) || 0,
      status: (data.status as string) || "pending",
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
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

  const statusBreakdown = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
    })
  );

  return {
    stats: {
      totalOrders: orders.length,
      totalRevenue,
      activeProducts,
      totalCustomers: customersCountSnap.data().count,
    },
    recentOrders: orders.slice(0, 10),
    topProducts,
    statusBreakdown,
  };
}

