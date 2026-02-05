"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Trash2, ArrowLeft, CheckCircle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminModal from "@/components/admin/AdminModal";

interface CouponData {
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
  updatedAt: string | null;
}

interface CouponFormData {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minPurchase: string;
  maxDiscount: string;
  usageLimit: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputClasses =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

interface CouponEditClientProps {
  coupon: CouponData;
}

export default function CouponEditClient({ coupon }: CouponEditClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState<CouponFormData>({
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    minPurchase: coupon.minPurchase > 0 ? coupon.minPurchase.toString() : "",
    maxDiscount:
      coupon.maxDiscount != null ? coupon.maxDiscount.toString() : "",
    usageLimit:
      coupon.usageLimit != null ? coupon.usageLimit.toString() : "",
    startsAt: isoToDatetimeLocal(coupon.startsAt),
    expiresAt: isoToDatetimeLocal(coupon.expiresAt),
    isActive: coupon.isActive,
  });

  function updateField<K extends keyof CouponFormData>(
    key: K,
    value: CouponFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.code.trim()) {
      setError("El codigo del cupon es obligatorio.");
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setError("El valor de descuento debe ser mayor a 0.");
      return;
    }
    if (
      form.discountType === "percentage" &&
      Number(form.discountValue) > 100
    ) {
      setError("El porcentaje de descuento no puede ser mayor a 100.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchase: form.minPurchase ? Number(form.minPurchase) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      };

      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar el cupon");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el cupon"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar el cupon");

      router.push("/admin/coupons");
      router.refresh();
    } catch {
      setError("Error al eliminar el cupon");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <AdminPageHeader
          title="Editar Cupon"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Cupones", href: "/admin/coupons" },
            { label: "Editar" },
          ]}
          action={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/coupons")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={saving || deleting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving
                  ? "Guardando..."
                  : success
                    ? "Guardado"
                    : "Guardar"}
              </button>
            </div>
          }
        />

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Cupon actualizado correctamente.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-6">
          {/* Usage stats (read-only info) */}
          <section className="space-y-2">
            <h3 className="font-semibold text-gray-800">Estadisticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Usos</p>
                <p className="text-lg font-bold text-gray-800">
                  {coupon.usageCount}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Limite</p>
                <p className="text-lg font-bold text-gray-800">
                  {coupon.usageLimit != null ? coupon.usageLimit : "Ilimitado"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Creado</p>
                <p className="text-sm font-medium text-gray-600">
                  {coupon.createdAt
                    ? new Date(coupon.createdAt).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Actualizado</p>
                <p className="text-sm font-medium text-gray-600">
                  {coupon.updatedAt
                    ? new Date(coupon.updatedAt).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Code & Description */}
          <section className="space-y-4">
            <h3 className="font-semibold text-gray-800">
              Informacion Basica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codigo <span className="text-rosa">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    updateField("code", e.target.value.toUpperCase())
                  }
                  placeholder="Ej: VERANO25"
                  required
                  className={
                    inputClasses + " uppercase font-mono tracking-wider"
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripcion
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Ej: Descuento de verano 2025"
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Discount Settings */}
          <section className="space-y-4">
            <h3 className="font-semibold text-gray-800">Descuento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de descuento <span className="text-rosa">*</span>
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    updateField(
                      "discountType",
                      e.target.value as "percentage" | "fixed"
                    )
                  }
                  className={inputClasses + " cursor-pointer"}
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor de descuento <span className="text-rosa">*</span>
                </label>
                <input
                  type="number"
                  step={form.discountType === "percentage" ? "1" : "0.01"}
                  min="0"
                  max={form.discountType === "percentage" ? "100" : undefined}
                  value={form.discountValue}
                  onChange={(e) =>
                    updateField("discountValue", e.target.value)
                  }
                  placeholder={
                    form.discountType === "percentage"
                      ? "Ej: 15"
                      : "Ej: 10.00"
                  }
                  required
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Purchase Requirements */}
          <section className="space-y-4">
            <h3 className="font-semibold text-gray-800">
              Requisitos de Compra
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compra minima (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.minPurchase}
                  onChange={(e) =>
                    updateField("minPurchase", e.target.value)
                  }
                  placeholder="0.00"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Dejar en 0 para sin minimo
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento maximo (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) =>
                    updateField("maxDiscount", e.target.value)
                  }
                  placeholder="Sin limite"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Solo aplica para descuentos por porcentaje
                </p>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Usage & Dates */}
          <section className="space-y-4">
            <h3 className="font-semibold text-gray-800">Uso y Vigencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de usos
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) =>
                    updateField("usageLimit", e.target.value)
                  }
                  placeholder="Ilimitado"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Dejar vacio para ilimitado
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => updateField("startsAt", e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de expiracion
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => updateField("expiresAt", e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Active Toggle */}
          <section className="space-y-4">
            <h3 className="font-semibold text-gray-800">Estado</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa"
              />
              <span className="text-sm text-gray-700">
                Cupon activo (disponible para uso)
              </span>
            </label>
          </section>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Cupon"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Estas seguro de que deseas eliminar el cupon{" "}
            <strong className="font-mono">{coupon.code}</strong>?
          </p>
          <p className="text-sm text-gray-400">
            El cupon sera desactivado y ya no podra ser utilizado por los
            clientes.
          </p>
        </div>
      </AdminModal>
    </>
  );
}
