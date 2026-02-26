"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Package, Sparkles, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";

export interface ProductRow {
  id: string;
  nameEs: string;
  nameEn: string;
  price: number;
  originalPrice: number | null;
  category: string;
  stockQuantity: number;
  isActive: boolean;
  images: string[];
  fitGuideStatus?: "draft" | "confirmed" | "failed" | "stale";
  fitGuideWarnings?: string[];
}

const CATEGORIES: Record<string, string> = {
  fajas: "Fajas",
  cinturillas: "Cinturillas",
  tops: "Tops & Brassieres",
  shorts: "Shorts",
  cuidado: "Cuidado Personal",
};

const FIT_GUIDE_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  draft: "Borrador",
  stale: "Desactualizada",
  failed: "Fallida",
};

export default function AdminProductsClient({
  initialProducts,
}: {
  initialProducts: ProductRow[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [fitGuideStatus, setFitGuideStatus] = useState("");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const skipInitialFetchRef = useRef(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (fitGuideStatus) params.set("fitGuideStatus", fitGuideStatus);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [search, category, fitGuideStatus]);

  useEffect(() => {
    // Initial data is server-rendered. Avoid immediate duplicate request.
    if (skipInitialFetchRef.current && !search && !category && !fitGuideStatus) {
      skipInitialFetchRef.current = false;
      return;
    }

    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [fetchProducts, search, category, fitGuideStatus]);

  const runBulkAiGeneration = useCallback(async () => {
    if (!products.length || bulkGenerating) return;
    const total = products.length;
    const confirmed = confirm(
      `Se generaran imagenes IA para ${total} producto(s) con los filtros actuales. Continuar?`
    );
    if (!confirmed) return;

    setBulkGenerating(true);
    setBulkSummary(null);
    setBulkProgress({ current: 0, total });

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      setBulkProgress({ current: index + 1, total });

      const sourceImageUrl =
        Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]
          : null;
      if (!sourceImageUrl) {
        skipped++;
        continue;
      }
      if (sourceImageUrl.includes("/products/generated/")) {
        skipped++;
        continue;
      }

      try {
        const res = await fetch(`/api/admin/products/${product.id}/ai-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceImageUrl,
            placeFirst: true,
            maxImages: 8,
          }),
        });
        if (!res.ok) {
          failed++;
          continue;
        }
        success++;
      } catch {
        failed++;
      }
    }

    setBulkGenerating(false);
    setBulkProgress(null);
    setBulkSummary(
      `Proceso completado. Exitos: ${success}, Fallidos: ${failed}, Omitidos (sin imagen base): ${skipped}.`
    );
    await fetchProducts();
  }, [bulkGenerating, fetchProducts, products]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === products.length) return new Set();
      return new Set(products.map((p) => p.id));
    });
  }, [products]);

  const runBulkAction = useCallback(async (action: "activate" | "deactivate") => {
    if (selectedIds.size === 0 || bulkLoading) return;
    const label = action === "activate" ? "activar" : "desactivar";
    const confirmed = confirm(`¿${label.charAt(0).toUpperCase() + label.slice(1)} ${selectedIds.size} producto(s)?`);
    if (!confirmed) return;

    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, productIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        await fetchProducts();
      }
    } catch (err) {
      console.error("Bulk action error:", err);
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkLoading, fetchProducts]);

  const columns = useMemo(() => [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={products.length > 0 && selectedIds.size === products.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      render: (p: ProductRow) => (
        <input
          type="checkbox"
          checked={selectedIds.has(p.id)}
          onChange={() => toggleSelect(p.id)}
          className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "name",
      header: "Producto",
      render: (p: ProductRow) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rosa-light/30 to-arena dark:from-gray-800 dark:to-gray-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {p.images[0] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={p.images[0]}
                alt={p.nameEs}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rosa/40"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
                }}
              />
            ) : (
              <Package className="w-4 h-4 text-rosa/40" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100 line-clamp-1">
              {p.nameEs}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{p.nameEn}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Precio",
      render: (p: ProductRow) => (
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {formatPrice(p.price)}
          </p>
          {p.originalPrice && (
            <p className="text-xs text-gray-400 dark:text-gray-500 line-through">
              {formatPrice(p.originalPrice)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoria",
      render: (p: ProductRow) => (
        <AdminBadge variant="rosa">
          {CATEGORIES[p.category] || p.category}
        </AdminBadge>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (p: ProductRow) => (
        <AdminBadge
          variant={
            p.stockQuantity === 0
              ? "danger"
              : p.stockQuantity <= 10
                ? "warning"
                : "success"
          }
        >
          {p.stockQuantity} uds
        </AdminBadge>
      ),
    },
    {
      key: "fitGuide",
      header: "Fit Guide",
      render: (p: ProductRow) => {
        const status = p.fitGuideStatus || "failed";
        const variant =
          status === "confirmed"
            ? "success"
            : status === "draft"
              ? "rosa"
              : status === "stale"
                ? "warning"
                : "danger";
        return (
          <div className="space-y-1">
            <AdminBadge variant={variant}>
              {FIT_GUIDE_LABELS[status] || status}
            </AdminBadge>
            {p.fitGuideWarnings?.[0] && (
              <p
                className="text-[10px] text-gray-400 dark:text-gray-500 max-w-[150px] truncate"
                title={p.fitGuideWarnings[0]}
              >
                {p.fitGuideWarnings[0]}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (p: ProductRow) => (
        <AdminBadge variant={p.isActive ? "success" : "default"}>
          {p.isActive ? "Activo" : "Inactivo"}
        </AdminBadge>
      ),
    },
  ], [products, selectedIds, toggleSelect, toggleSelectAll]);

  return (
    <>
      <AdminPageHeader
        title="Productos"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Productos" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={runBulkAiGeneration}
              disabled={bulkGenerating || loading || products.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rosa/30 text-rosa text-sm font-semibold hover:bg-rosa/10 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {bulkGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {bulkGenerating ? "Generando..." : "Autogenerar IA (filtrados)"}
            </button>
            <button
              onClick={() => router.push("/admin/products/new")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rosa/30 cursor-pointer"
        >
          <option value="">Todas las categorias</option>
          {Object.entries(CATEGORIES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={fitGuideStatus}
          onChange={(e) => setFitGuideStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rosa/30 cursor-pointer"
        >
          <option value="">Todos los fit guide</option>
          <option value="confirmed">Confirmada</option>
          <option value="draft">Borrador</option>
          <option value="stale">Desactualizada</option>
          <option value="failed">Fallida</option>
        </select>
      </div>

      {bulkProgress && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Generando IA {bulkProgress.current}/{bulkProgress.total}...
        </p>
      )}
      {bulkSummary && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
          {bulkSummary}
        </p>
      )}

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedIds.size} seleccionado(s)
            </span>
            <button
              onClick={() => runBulkAction("activate")}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Activar
            </button>
            <button
              onClick={() => runBulkAction("deactivate")}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Desactivar
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 rounded-xl text-gray-500 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center transition-colors duration-300">
          <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Cargando productos...</p>
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={products}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => router.push(`/admin/products/${p.id}`)}
          emptyMessage="No se encontraron productos"
        />
      )}
    </>
  );
}
