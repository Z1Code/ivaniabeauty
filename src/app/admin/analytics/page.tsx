"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Ticket,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge, {
  getOrderStatusVariant,
  getOrderStatusLabel,
} from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  totalCustomers: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  orders: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Fetch all data sources in parallel
        const [productsRes, customersRes, ordersRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/customers"),
          fetch("/api/admin/orders?limit=200"),
        ]);

        let products: Array<Record<string, unknown>> = [];
        if (productsRes.ok) products = await productsRes.json();

        let customers: Array<Record<string, unknown>> = [];
        if (customersRes.ok) customers = await customersRes.json();

        interface OrderRecord {
          id: string;
          orderNumber: string;
          customerName: string;
          total: number;
          status: string;
          createdAt: string;
        }
        let orders: OrderRecord[] = [];
        if (ordersRes.ok) orders = await ordersRes.json();

        const activeProducts = products.filter(
          (p) => p.isActive === true
        ).length;

        // Top products by review count (as proxy for popularity)
        const sortedProducts = [...products]
          .filter((p) => p.isActive)
          .sort(
            (a, b) =>
              ((b.reviewCount as number) || 0) -
              ((a.reviewCount as number) || 0)
          )
          .slice(0, 5)
          .map((p) => ({
            id: p.id as string,
            name: (p.nameEs as string) || (p.nameEn as string) || "---",
            revenue: (p.price as number) || 0,
            orders: (p.reviewCount as number) || 0,
          }));

        setTopProducts(sortedProducts);

        // Calculate stats from real orders
        let totalRevenue = 0;
        orders.forEach((o) => {
          if (o.status !== "cancelled" && o.status !== "refunded") {
            totalRevenue += o.total || 0;
          }
        });

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          activeProducts,
          totalCustomers: customers.length,
        });

        // Recent orders (first 10)
        setRecentOrders(
          orders.slice(0, 10).map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            total: o.total,
            status: o.status,
            createdAt: o.createdAt,
          }))
        );

        // Status breakdown
        const statusCounts: Record<string, number> = {};
        orders.forEach((o) => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        setStatusBreakdown(
          Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
          }))
        );
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <>
        <AdminPageHeader
          title="Analytics"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Analytics" },
          ]}
        />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </>
    );
  }

  const recentOrderColumns = [
    {
      key: "orderNumber",
      header: "Pedido",
      render: (o: RecentOrder) => (
        <div>
          <p className="font-semibold text-gray-800">{o.orderNumber}</p>
          <p className="text-xs text-gray-400">
            {new Date(o.createdAt).toLocaleDateString("es")}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      render: (o: RecentOrder) => (
        <span className="text-gray-700">{o.customerName}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (o: RecentOrder) => (
        <span className="font-semibold">{formatPrice(o.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (o: RecentOrder) => (
        <AdminBadge variant={getOrderStatusVariant(o.status)}>
          {getOrderStatusLabel(o.status)}
        </AdminBadge>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Analytics" },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminCard
          title="Total Pedidos"
          value={stats.totalOrders}
          icon={ShoppingCart}
        />
        <AdminCard
          title="Revenue Total"
          value={formatPrice(stats.totalRevenue)}
          icon={DollarSign}
        />
        <AdminCard
          title="Productos Activos"
          value={stats.activeProducts}
          icon={Package}
        />
        <AdminCard
          title="Clientes Totales"
          value={stats.totalCustomers}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rosa" />
              Pedidos Recientes
            </h3>
            <Link
              href="/admin/orders"
              className="text-sm text-rosa hover:text-rosa-dark transition-colors flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="p-0">
              <AdminTable
                columns={recentOrderColumns}
                data={recentOrders}
                keyExtractor={(o) => o.id}
                emptyMessage="No hay pedidos recientes"
              />
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Los pedidos recientes aparecen aqui.
              </p>
              <Link
                href="/admin/orders"
                className="text-sm text-rosa hover:text-rosa-dark mt-2 inline-block"
              >
                Ver todos los pedidos
              </Link>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-rosa" />
              Top Productos
            </h3>
          </div>

          {topProducts.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {topProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-rosa-light/5 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatPrice(product.revenue)} / producto
                    </p>
                  </div>
                  <AdminBadge variant="rosa">
                    {product.orders} resenas
                  </AdminBadge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Sin datos de productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Status Breakdown & Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-rosa" />
            Desglose por Estado
          </h3>

          {statusBreakdown.length > 0 ? (
            <div className="space-y-3">
              {statusBreakdown.map((item) => {
                const total = statusBreakdown.reduce(
                  (sum, s) => sum + s.count,
                  0
                );
                const pct = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <AdminBadge variant={getOrderStatusVariant(item.status)}>
                        {getOrderStatusLabel(item.status)}
                      </AdminBadge>
                      <span className="text-sm font-medium text-gray-600">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rosa rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                El desglose de estados se mostrara cuando haya pedidos.
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-rosa" />
            Resumen Rapido
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Ticket Promedio
                </span>
              </div>
              <span className="text-sm font-bold text-green-700">
                {stats.totalOrders > 0
                  ? formatPrice(stats.totalRevenue / stats.totalOrders)
                  : "$0.00"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Pedidos / Cliente
                </span>
              </div>
              <span className="text-sm font-bold text-blue-700">
                {stats.totalCustomers > 0
                  ? (stats.totalOrders / stats.totalCustomers).toFixed(1)
                  : "0"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">
                  Revenue / Producto
                </span>
              </div>
              <span className="text-sm font-bold text-purple-700">
                {stats.activeProducts > 0
                  ? formatPrice(stats.totalRevenue / stats.activeProducts)
                  : "$0.00"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rosa-light/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rosa" />
                <span className="text-sm font-medium text-rosa-dark">
                  Tasa de Conversion
                </span>
              </div>
              <span className="text-sm font-bold text-rosa-dark">
                {statusBreakdown.length > 0
                  ? (() => {
                      const delivered =
                        statusBreakdown.find((s) => s.status === "delivered")
                          ?.count || 0;
                      const total = statusBreakdown.reduce(
                        (sum, s) => sum + s.count,
                        0
                      );
                      return total > 0
                        ? `${((delivered / total) * 100).toFixed(1)}%`
                        : "0%";
                    })()
                  : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
