"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

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

const inputClasses =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

export default function NewCouponPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<CouponFormData>({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    startsAt: "",
    expiresAt: "",
    isActive: true,
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

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear el cupon");
      }

      router.push("/admin/coupons");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al crear el cupon"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <AdminPageHeader
        title="Nuevo Cupon"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Cupones", href: "/admin/coupons" },
          { label: "Nuevo" },
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
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Creando..." : "Crear Cupon"}
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-6">
        {/* Code & Description */}
        <section className="space-y-4">
          <h3 className="font-semibold text-gray-800">Informacion Basica</h3>
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
                className={inputClasses + " uppercase font-mono tracking-wider"}
              />
              <p className="mt-1 text-xs text-gray-400">
                Se convertira automaticamente a mayusculas
              </p>
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
                onChange={(e) => updateField("discountValue", e.target.value)}
                placeholder={
                  form.discountType === "percentage" ? "Ej: 15" : "Ej: 10.00"
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
          <h3 className="font-semibold text-gray-800">Requisitos de Compra</h3>
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
                onChange={(e) => updateField("minPurchase", e.target.value)}
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
                onChange={(e) => updateField("maxDiscount", e.target.value)}
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
                onChange={(e) => updateField("usageLimit", e.target.value)}
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
  );
}
