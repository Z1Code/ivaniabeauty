"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Loader2, CheckCircle } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBilingualInput from "@/components/admin/AdminBilingualInput";
import AdminModal from "@/components/admin/AdminModal";

interface CampaignData {
  id: string;
  name: string;
  description: string;
  couponId: string;
  bannerImage: string;
  bannerTextEn: string;
  bannerTextEs: string;
  targetUrl: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface CampaignEditClientProps {
  initialData: CampaignData;
}

export default function CampaignEditClient({
  initialData,
}: CampaignEditClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [bannerTextEn, setBannerTextEn] = useState(initialData.bannerTextEn);
  const [bannerTextEs, setBannerTextEs] = useState(initialData.bannerTextEs);
  const [couponId, setCouponId] = useState(initialData.couponId);
  const [bannerImage, setBannerImage] = useState(initialData.bannerImage);
  const [targetUrl, setTargetUrl] = useState(initialData.targetUrl);
  const [startsAt, setStartsAt] = useState(initialData.startsAt);
  const [endsAt, setEndsAt] = useState(initialData.endsAt);
  const [isActive, setIsActive] = useState(initialData.isActive);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/campaigns/${initialData.id}`, {
        method: "PUT",
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
        throw new Error(data.error || "Error al guardar la campana");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${initialData.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar la campana");
      }

      router.push("/admin/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setShowDeleteModal(false);
      setDeleting(false);
    }
  };

  const inputClasses =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

  return (
    <>
      <AdminPageHeader
        title="Editar Campana"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Campanas", href: "/admin/campaigns" },
          { label: "Editar" },
        ]}
      />

      <form onSubmit={handleSave}>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Campana guardada correctamente
            </div>
          )}

          {/* Name & Coupon ID */}
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
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
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Campana"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </>
              )}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Estas seguro de que quieres eliminar la campana{" "}
          <strong className="text-gray-800">{name}</strong>? Esta accion
          desactivara la campana.
        </p>
      </AdminModal>
    </>
  );
}
