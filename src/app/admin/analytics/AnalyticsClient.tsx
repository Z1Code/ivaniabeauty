"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Globe, Eye, MousePointer } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge, {
  getOrderStatusVariant,
  getOrderStatusLabel,
} from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";
import type { AnalyticsPayload } from "@/lib/admin/analytics-data";
import type { VercelAnalyticsData } from "@/lib/admin/vercel-analytics";

const ROSA_COLORS = ["#D4737A", "#40BFC1", "#E8A0A6", "#C25D64", "#F5D5D8", "#2DA5A7", "#B44C54", "#A3E0E1", "#F0B0B6", "#8ECFD0"];

export default function AnalyticsClient({
  initialData,
}: {
  initialData: AnalyticsPayload;
}) {
  const { stats, recentOrders, topProducts, statusBreakdown } = initialData;

  const [vercelRange, setVercelRange] = useState<"7d" | "30d" | "90d">("30d");
  const [vercelData, setVercelData] = useState<VercelAnalyticsData | null>(null);
  const [vercelLoading, setVercelLoading] = useState(true);

  const fetchVercel = useCallback(async (range: "7d" | "30d" | "90d") => {
    setVercelLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/vercel?range=${range}`);
      if (res.ok) {
        const data: VercelAnalyticsData = await res.json();
        setVercelData(data);
      }
    } catch {
      // silently fail
    } finally {
      setVercelLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVercel(vercelRange);
  }, [vercelRange, fetchVercel]);

  const vercelConfigured =
    vercelData &&
    (vercelData.timeSeries.length > 0 || vercelData.topPages.length > 0 || vercelData.totalPageViews > 0);

  const recentOrderColumns = [
    {
      key: "orderNumber",
      header: "Pedido",
      render: (o: AnalyticsPayload["recentOrders"][number]) => (
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">{o.orderNumber}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(o.createdAt).toLocaleDateString("es")}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      render: (o: AnalyticsPayload["recentOrders"][number]) => (
        <span className="text-gray-700 dark:text-gray-300">{o.customerName}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (o: AnalyticsPayload["recentOrders"][number]) => (
        <span className="font-semibold">{formatPrice(o.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (o: AnalyticsPayload["recentOrders"][number]) => (
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

      {/* ── Vercel Web Analytics Section ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-rosa" />
            Vercel Web Analytics
          </h3>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setVercelRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  vercelRange === r
                    ? "bg-rosa text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {vercelLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-rosa/30 border-t-rosa rounded-full animate-spin" />
          </div>
        ) : !vercelConfigured ? (
          <div className="text-center py-10">
            <Globe className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Vercel Analytics no configurado. Agrega VERCEL_ANALYTICS_TOKEN en variables de entorno.
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-rosa-light/10 dark:bg-rosa/10">
                <div className="w-10 h-10 rounded-full bg-rosa/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-rosa" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Page Views</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {vercelData!.totalPageViews.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#40BFC1]/10">
                <div className="w-10 h-10 rounded-full bg-[#40BFC1]/10 flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-[#40BFC1]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Visitors</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {vercelData!.totalVisitors.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Line Chart - Page Views Over Time */}
            {vercelData!.timeSeries.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                  Visitas en el Tiempo
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vercelData!.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#9CA3AF" }}
                        tickFormatter={(v: string) => {
                          const d = new Date(v);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pageViews"
                        stroke="#D4737A"
                        strokeWidth={2}
                        dot={false}
                        name="Page Views"
                      />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        stroke="#40BFC1"
                        strokeWidth={2}
                        dot={false}
                        name="Visitors"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Top Pages */}
              {vercelData!.topPages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Paginas Mas Visitadas
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vercelData!.topPages} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                        <YAxis
                          type="category"
                          dataKey="key"
                          tick={{ fontSize: 11, fill: "#9CA3AF" }}
                          width={120}
                          tickFormatter={(v: string) =>
                            v.length > 18 ? v.slice(0, 18) + "..." : v
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="total" fill="#D4737A" radius={[0, 4, 4, 0]} name="Views" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Pie Chart - Referrers */}
              {vercelData!.topReferrers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Fuentes de Trafico
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vercelData!.topReferrers}
                          dataKey="total"
                          nameKey="key"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={(props: PieLabelRenderProps) => {
                            const name = String(props.name ?? "");
                            const pct = Number(props.percent ?? 0);
                            return `${name.length > 15 ? name.slice(0, 15) + "..." : name} ${(pct * 100).toFixed(0)}%`;
                          }}
                          labelLine={false}
                          fontSize={10}
                        >
                          {vercelData!.topReferrers.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={ROSA_COLORS[index % ROSA_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Firestore KPI Cards ── */}
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
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
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
              <ShoppingCart className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
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

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-rosa" />
              Top Productos
            </h3>
          </div>

          {topProducts.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {topProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-rosa-light/5 dark:hover:bg-rosa/5 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-500">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
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
              <Package className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin datos de productos</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
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
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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
              <BarChart3 className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                El desglose de estados se mostrara cuando haya pedidos.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300 p-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-rosa" />
            Resumen Rapido
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950 transition-colors duration-300">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Ticket Promedio
                </span>
              </div>
              <span className="text-sm font-bold text-green-700 dark:text-green-400">
                {stats.totalOrders > 0
                  ? formatPrice(stats.totalRevenue / stats.totalOrders)
                  : "$0.00"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950 transition-colors duration-300">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Pedidos / Cliente
                </span>
              </div>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                {stats.totalCustomers > 0
                  ? (stats.totalOrders / stats.totalCustomers).toFixed(1)
                  : "0"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950 transition-colors duration-300">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                  Revenue / Producto
                </span>
              </div>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                {stats.activeProducts > 0
                  ? formatPrice(stats.totalRevenue / stats.activeProducts)
                  : "$0.00"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rosa-light/20 dark:bg-rosa/10 transition-colors duration-300">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rosa dark:text-rosa-light" />
                <span className="text-sm font-medium text-rosa-dark dark:text-rosa-light">
                  Tasa de Conversion
                </span>
              </div>
              <span className="text-sm font-bold text-rosa-dark dark:text-rosa-light">
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

