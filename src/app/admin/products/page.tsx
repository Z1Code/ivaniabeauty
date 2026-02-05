"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Package } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";
import { formatPrice } from "@/lib/utils";

interface ProductRow {
  id: string;
  nameEs: string;
  nameEn: string;
  price: number;
  originalPrice: number | null;
  category: string;
  stockQuantity: number;
  isActive: boolean;
  images: string[];
}

const CATEGORIES: Record<string, string> = {
  fajas: "Fajas",
  cinturillas: "Cinturillas",
  tops: "Tops & Brassieres",
  shorts: "Shorts",
  cuidado: "Cuidado Personal",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);

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
  }, [search, category]);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  const columns = [
    {
      key: "name",
      header: "Producto",
      render: (p: ProductRow) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rosa-light/30 to-arena flex-shrink-0 flex items-center justify-center">
            <Package className="w-4 h-4 text-rosa/40" />
          </div>
          <div>
            <p className="font-medium text-gray-800 line-clamp-1">
              {p.nameEs}
            </p>
            <p className="text-xs text-gray-400 line-clamp-1">{p.nameEn}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Precio",
      render: (p: ProductRow) => (
        <div>
          <p className="font-semibold text-gray-800">
            {formatPrice(p.price)}
          </p>
          {p.originalPrice && (
            <p className="text-xs text-gray-400 line-through">
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
      key: "status",
      header: "Estado",
      render: (p: ProductRow) => (
        <AdminBadge variant={p.isActive ? "success" : "default"}>
          {p.isActive ? "Activo" : "Inactivo"}
        </AdminBadge>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Productos"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Productos" },
        ]}
        action={
          <button
            onClick={() => router.push("/admin/products/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rosa text-white text-sm font-semibold hover:bg-rosa-dark transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rosa/30 cursor-pointer"
        >
          <option value="">Todas las categorias</option>
          {Object.entries(CATEGORIES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando productos...</p>
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
