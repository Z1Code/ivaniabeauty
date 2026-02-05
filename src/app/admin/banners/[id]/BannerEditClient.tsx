"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Trash2, Image } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBilingualInput from "@/components/admin/AdminBilingualInput";
import AdminModal from "@/components/admin/AdminModal";

interface BannerData {
  id: string;
  titleEn: string;
  titleEs: string;
  subtitleEn: string;
  subtitleEs: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

const POSITIONS = [
  { value: "hero", label: "Hero" },
  { value: "promo_bar", label: "Barra Promocional" },
  { value: "collection", label: "Coleccion" },
  { value: "popup", label: "Popup" },
];

const inputClasses =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

export default function BannerEditClient({ banner }: { banner: BannerData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [titleEn, setTitleEn] = useState(banner.titleEn);
  const [titleEs, setTitleEs] = useState(banner.titleEs);
  const [subtitleEn, setSubtitleEn] = useState(banner.subtitleEn);
  const [subtitleEs, setSubtitleEs] = useState(banner.subtitleEs);
  const [imageUrl, setImageUrl] = useState(banner.imageUrl);
  const [linkUrl, setLinkUrl] = useState(banner.linkUrl);
  const [position, setPosition] = useState(banner.position);
  const [sortOrder, setSortOrder] = useState(banner.sortOrder);
  const [startsAt, setStartsAt] = useState(banner.startsAt);
  const [endsAt, setEndsAt] = useState(banner.endsAt);
  const [isActive, setIsActive] = useState(banner.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleEn,
          titleEs,
          subtitleEn,
          subtitleEs,
          imageUrl,
          linkUrl,
          position,
          sortOrder,
          startsAt: startsAt || null,
          endsAt: endsAt || null,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar");
      }

      setSuccess("Banner actualizado correctamente.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating banner:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar el banner."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      router.push("/admin/banners");
    } catch (err) {
      console.error("Error deleting banner:", err);
      setError("Error al eliminar el banner.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Editar Banner"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Banners", href: "/admin/banners" },
          { label: "Editar" },
        ]}
        action={
          <button
            onClick={() => router.push("/admin/banners")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        }
      />

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Titles */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="font-serif text-lg font-semibold text-gray-800">
                Contenido
              </h2>

              <AdminBilingualInput
                label="Titulo"
                valueEn={titleEn}
                valueEs={titleEs}
                onChangeEn={setTitleEn}
                onChangeEs={setTitleEs}
                placeholder="Titulo del banner"
                required
              />

              <AdminBilingualInput
                label="Subtitulo"
                valueEn={subtitleEn}
                valueEs={subtitleEs}
                onChangeEn={setSubtitleEn}
                onChangeEs={setSubtitleEs}
                placeholder="Subtitulo del banner"
              />
            </div>

            {/* Media & Link */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="font-serif text-lg font-semibold text-gray-800">
                Media y Enlace
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Imagen
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    <Image className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className={inputClasses}
                  />
                </div>
                {imageUrl && (
                  <div className="mt-3 w-full max-w-xs h-24 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Enlace
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/colecciones/nueva-temporada"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="font-serif text-lg font-semibold text-gray-800">
                Configuracion
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Posicion
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className={inputClasses}
                >
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  min={0}
                  className={inputClasses}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Activo
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    isActive ? "bg-rosa" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="font-serif text-lg font-semibold text-gray-800">
                Programacion
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio (opcional)
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
                  Fecha Fin (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-red-600 text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Banner
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Banner"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2.5 rounded-xl bg-white text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">
          ¿Estas seguro de que deseas eliminar este banner? Esta accion
          desactivara el banner y no se podra deshacer facilmente.
        </p>
        <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-sm font-semibold text-gray-800">
            {titleEs || titleEn || "Sin titulo"}
          </p>
          <p className="text-xs text-gray-400">ID: {banner.id}</p>
        </div>
      </AdminModal>
    </>
  );
}
