"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBilingualInput from "@/components/admin/AdminBilingualInput";

export default function NewCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerTextEn, setBannerTextEn] = useState("");
  const [bannerTextEs, setBannerTextEs] = useState("");
  const [couponId, setCouponId] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [targetUrl, setTargetUrl] = useState("/shop");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          bannerTextEn,
          bannerTextEs,
          couponId: couponId || null,
          bannerImage: bannerImage || null,
          targetUrl: targetUrl || "/shop",
          startsAt: startsAt || null,
          endsAt: endsAt || null,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la campana");
      }

      router.push("/admin/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const inputClasses =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

  return (
    <>
      <AdminPageHeader
        title="Nueva Campana"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Campanas", href: "/admin/campaigns" },
          { label: "Nueva" },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-rosa">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Black Friday 2024"
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cupon ID (opcional)
              </label>
              <input
                type="text"
                value={couponId}
                onChange={(e) => setCouponId(e.target.value)}
                placeholder="ID del cupon vinculado"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripcion
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripcion interna de la campana..."
              rows={3}
              className={inputClasses + " resize-none"}
            />
          </div>

          {/* Banner Text Bilingual */}
          <AdminBilingualInput
            label="Texto del Banner"
            valueEn={bannerTextEn}
            valueEs={bannerTextEs}
            onChangeEn={setBannerTextEn}
            onChangeEs={setBannerTextEs}
            placeholder="Ej: 20% de descuento"
          />

          {/* Banner Image & Target URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Imagen del Banner
              </label>
              <input
                type="url"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="https://..."
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Destino
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="/shop"
                className={inputClasses}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isActive ? "bg-rosa" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {isActive ? "Campana activa" : "Campana inactiva"}
            </span>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Crear Campana
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
