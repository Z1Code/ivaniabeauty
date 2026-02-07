"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge, {
  getOrderStatusVariant,
  getOrderStatusLabel,
} from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";

interface OrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentMethod: string;
  itemCount: number;
  createdAt: string;
}

const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "processing", label: "Procesando" },
  { value: "shipped", label: "Enviados" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

export default function OrdersClient({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () => (statusFilter ? orders.filter((o) => o.status === statusFilter) : orders),
    [orders, statusFilter]
  );

  const columns = useMemo(() => [
    {
      key: "orderNumber",
      header: "Pedido",
      render: (o: OrderRow) => (
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
      render: (o: OrderRow) => (
        <div>
          <p className="text-gray-700">{o.customerName}</p>
          <p className="text-xs text-gray-400">{o.customerEmail}</p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (o: OrderRow) => (
        <span className="font-semibold">{formatPrice(o.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (o: OrderRow) => (
        <AdminBadge variant={getOrderStatusVariant(o.status)}>
          {getOrderStatusLabel(o.status)}
        </AdminBadge>
      ),
    },
    {
      key: "payment",
      header: "Pago",
      render: (o: OrderRow) => (
        <span className="text-gray-500 capitalize">{o.paymentMethod}</span>
      ),
    },
  ], []);

  return (
    <>
      <AdminPageHeader
        title="Pedidos"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pedidos" },
        ]}
      />

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === tab.value
                ? "bg-rosa text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(o) => o.id}
        onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
        emptyMessage="No hay pedidos"
      />
    </>
  );
}
