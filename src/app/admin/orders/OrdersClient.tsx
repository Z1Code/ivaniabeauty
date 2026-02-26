"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge, {
  getOrderStatusVariant,
  getOrderStatusLabel,
} from "@/components/admin/AdminBadge";
import { Loader2, Printer } from "lucide-react";
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
  labelUrl?: string | null;
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
  const [labelGenerating, setLabelGenerating] = useState(false);
  const [labelProgress, setLabelProgress] = useState<{ current: number; total: number } | null>(null);

  const filtered = useMemo(
    () => (statusFilter ? orders.filter((o) => o.status === statusFilter) : orders),
    [orders, statusFilter]
  );

  const generateDayLabels = useCallback(async () => {
    if (labelGenerating) return;

    // Filter eligible orders: confirmed/processing, no existing label
    const eligible = orders.filter(
      (o) => ["confirmed", "processing"].includes(o.status) && !o.labelUrl
    );

    if (eligible.length === 0) {
      alert("No hay pedidos elegibles para etiquetas (necesitan estar confirmados/procesando y sin etiqueta existente).");
      return;
    }

    const confirmed = confirm(
      `Se generarán etiquetas para ${eligible.length} pedido(s). Esto puede generar costos en Shippo. ¿Continuar?`
    );
    if (!confirmed) return;

    setLabelGenerating(true);
    setLabelProgress({ current: 0, total: eligible.length });

    const batchId = `batch-${Date.now()}`;
    const labelUrls: string[] = [];
    let errors = 0;

    for (let i = 0; i < eligible.length; i++) {
      setLabelProgress({ current: i + 1, total: eligible.length });

      try {
        const res = await fetch("/api/admin/shipping/bulk-labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: eligible[i].id, batchId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.labelUrl && !data.skipped) {
            labelUrls.push(data.labelUrl);
          }
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    // Merge labels into single PDF
    if (labelUrls.length > 0) {
      try {
        const mergeRes = await fetch("/api/admin/shipping/merge-labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labelUrls }),
        });

        if (mergeRes.ok) {
          const blob = await mergeRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `etiquetas-${new Date().toISOString().split("T")[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error("Error merging labels:", err);
      }
    }

    setLabelGenerating(false);
    setLabelProgress(null);
    alert(`Proceso completado. Etiquetas generadas: ${labelUrls.length}. Errores: ${errors}.`);
  }, [labelGenerating, orders]);

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
        action={
          <button
            onClick={generateDayLabels}
            disabled={labelGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {labelGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            {labelGenerating ? "Generando..." : "Generar Etiquetas del Día"}
          </button>
        }
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

      {labelProgress && (
        <p className="text-xs text-gray-500 mb-3">
          Generando etiqueta {labelProgress.current}/{labelProgress.total}...
        </p>
      )}

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
