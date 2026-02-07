"use client";

import { useRouter } from "next/navigation";
import { Plus, Ticket, Calendar, Percent, DollarSign } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";

export interface CouponRow {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function CouponsClient({
  initialCoupons,
}: {
  initialCoupons: CouponRow[];
}) {
  const router = useRouter();

  const columns = [
    {
      key: "code",
      header: "Codigo",
      render: (c: CouponRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rosa-light/30 to-arena flex-shrink-0 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-rosa/60" />
          </div>
          <span className="font-semibold font-mono text-gray-800 tracking-wide">
            {c.code}
          </span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Descripcion",
      render: (c: CouponRow) => (
        <span className="text-gray-600 line-clamp-1">
          {c.description || "-"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (c: CouponRow) => (
        <AdminBadge variant={c.discountType === "percentage" ? "info" : "rosa"}>
          <span className="flex items-center gap-1">
            {c.discountType === "percentage" ? (
              <Percent className="w-3 h-3" />
            ) : (
              <DollarSign className="w-3 h-3" />
            )}
            {c.discountType === "percentage" ? "Porcentaje" : "Fijo"}
          </span>
        </AdminBadge>
      ),
    },
    {
      key: "value",
      header: "Valor",
      render: (c: CouponRow) => (
        <span className="font-semibold text-gray-800">
          {c.discountType === "percentage"
            ? `${c.discountValue}%`
            : formatPrice(c.discountValue)}
        </span>
      ),
    },
    {
      key: "minPurchase",
      header: "Compra Min.",
      render: (c: CouponRow) => (
        <span className="text-gray-600">
          {c.minPurchase > 0 ? formatPrice(c.minPurchase) : "-"}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Uso",
      render: (c: CouponRow) => (
        <span className="text-gray-600">
          {c.usageCount}
          {c.usageLimit != null ? ` / ${c.usageLimit}` : " / inf"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (c: CouponRow) => {
        if (!c.isActive) {
          return <AdminBadge variant="default">Inactivo</AdminBadge>;
        }
        if (isExpired(c.expiresAt)) {
          return <AdminBadge variant="danger">Expirado</AdminBadge>;
        }
        return <AdminBadge variant="success">Activo</AdminBadge>;
      },
    },
    {
      key: "expires",
      header: "Expira",
      render: (c: CouponRow) => (
        <span className="flex items-center gap-1.5 text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(c.expiresAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Cupones"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Cupones" },
        ]}
        action={
          <button
            onClick={() => router.push("/admin/coupons/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cupon
          </button>
        }
      />

      <AdminTable
        columns={columns}
        data={initialCoupons}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => router.push(`/admin/coupons/${c.id}`)}
        emptyMessage="No se encontraron cupones"
      />
    </>
  );
}
