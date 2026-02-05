"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Image, ExternalLink } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";

interface BannerRow {
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
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
}

const POSITION_LABELS: Record<string, string> = {
  hero: "Hero",
  promo_bar: "Barra Promo",
  collection: "Coleccion",
  popup: "Popup",
};

const POSITION_VARIANTS: Record<string, "rosa" | "info" | "warning" | "default"> = {
  hero: "rosa",
  promo_bar: "info",
  collection: "warning",
  popup: "default",
};

export default function BannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/banners");
      if (!res.ok) throw new Error("Error al cargar banners");
      const data = await res.json();
      setBanners(data);
    } catch (err) {
      console.error("Error fetching banners:", err);
      setError("No se pudieron cargar los banners. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const columns = [
    {
      key: "title",
      header: "Titulo (ES)",
      render: (b: BannerRow) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rosa-light/30 to-arena flex-shrink-0 flex items-center justify-center">
            <Image className="w-4 h-4 text-rosa/60" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 line-clamp-1">
              {b.titleEs || b.titleEn || "Sin titulo"}
            </p>
            {b.subtitleEs && (
              <p className="text-xs text-gray-400 line-clamp-1">
                {b.subtitleEs}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "position",
      header: "Posicion",
      render: (b: BannerRow) => (
        <AdminBadge variant={POSITION_VARIANTS[b.position] || "default"}>
          {POSITION_LABELS[b.position] || b.position}
        </AdminBadge>
      ),
    },
    {
      key: "image",
      header: "Imagen",
      render: (b: BannerRow) =>
        b.imageUrl ? (
          <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={b.imageUrl}
              alt={b.titleEs || "Banner"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sin imagen</span>
        ),
    },
    {
      key: "link",
      header: "Link",
      render: (b: BannerRow) =>
        b.linkUrl ? (
          <span className="flex items-center gap-1 text-gray-500 text-xs">
            <ExternalLink className="w-3 h-3" />
            <span className="line-clamp-1 max-w-[120px]">{b.linkUrl}</span>
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      render: (b: BannerRow) => (
        <AdminBadge variant={b.isActive ? "success" : "default"}>
          {b.isActive ? "Activo" : "Inactivo"}
        </AdminBadge>
      ),
    },
    {
      key: "sortOrder",
      header: "Orden",
      render: (b: BannerRow) => (
        <span className="text-gray-600 font-mono text-sm">{b.sortOrder}</span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Banners"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Banners" },
        ]}
        action={
          <button
            onClick={() => router.push("/admin/banners/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Banner
          </button>
        }
      />

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando banners...</p>
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={banners}
          keyExtractor={(b) => b.id}
          onRowClick={(b) => router.push(`/admin/banners/${b.id}`)}
          emptyMessage="No se encontraron banners"
        />
      )}
    </>
  );
}
