"use client";

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
import type { AnalyticsPayload } from "@/lib/admin/analytics-data";

export default function AnalyticsClient({
  initialData,
}: {
  initialData: AnalyticsPayload;
}) {
  const { stats, recentOrders, topProducts, statusBreakdown } = initialData;

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

