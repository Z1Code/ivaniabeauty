"use client";

import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Star,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminCard from "@/components/admin/AdminCard";
import AdminBadge, {
  getOrderStatusVariant,
  getOrderStatusLabel,
} from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";

interface DashboardProps {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    pendingReviews: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
  }>;
}

export default function DashboardClient({
  stats,
  recentOrders,
  lowStockProducts,
}: DashboardProps) {
  return (
    <>
      <AdminPageHeader title="Dashboard" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminCard
          title="Productos Activos"
          value={stats.totalProducts}
          icon={Package}
        />
        <AdminCard
          title="Pedidos Totales"
          value={stats.totalOrders}
          icon={ShoppingCart}
        />
        <AdminCard
          title="Revenue Total"
          value={formatPrice(stats.totalRevenue)}
          icon={DollarSign}
        />
        <AdminCard
          title="Clientes"
          value={stats.totalCustomers}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Pedidos Recientes</h3>
            <Link
              href="/admin/orders"
              className="text-sm text-rosa hover:text-rosa-dark transition-colors"
            >
              Ver todos
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-rosa-light/5 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">
                      {formatPrice(order.total)}
                    </span>
                    <AdminBadge variant={getOrderStatusVariant(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </AdminBadge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No hay pedidos aun
            </div>
          )}
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Pending Reviews */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Resenas Pendientes
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.pendingReviews}
                </p>
              </div>
            </div>
            <Link
              href="/admin/reviews"
              className="text-sm text-rosa hover:text-rosa-dark transition-colors"
            >
              Moderar resenas
            </Link>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Stock Bajo
              </p>
            </div>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex items-center justify-between text-sm hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                  >
                    <span className="text-gray-700 truncate">
                      {product.name}
                    </span>
                    <AdminBadge
                      variant={
                        product.stockQuantity === 0 ? "danger" : "warning"
                      }
                    >
                      {product.stockQuantity} uds
                    </AdminBadge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Todo el inventario esta bien
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
