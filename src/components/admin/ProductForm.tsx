"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Trash2, Plus, X } from "lucide-react";
import AdminPageHeader from "./AdminPageHeader";
import AdminBilingualInput from "./AdminBilingualInput";
import AdminImageUpload from "./AdminImageUpload";
import { cn, getColorHex } from "@/lib/utils";

const ALL_COLORS = ["cocoa", "negro", "beige", "brown", "rosado", "pink"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL", "5XL"];
const CATEGORIES = [
  { value: "fajas", label: "Fajas" },
  { value: "cinturillas", label: "Cinturillas" },
  { value: "tops", label: "Tops & Brassieres" },
  { value: "shorts", label: "Shorts" },
  { value: "cuidado", label: "Cuidado Personal" },
];
const COMPRESSIONS = [
  { value: "suave", label: "Suave" },
  { value: "media", label: "Media" },
  { value: "firme", label: "Firme" },
];
const OCCASIONS = [
  { value: "diario", label: "Diario" },
  { value: "postquirurgico", label: "Post Quirurgico" },
  { value: "postparto", label: "Post Parto" },
  { value: "deporte", label: "Deporte" },
];

interface ProductFormData {
  nameEn: string;
  nameEs: string;
  slug: string;
  sku: string;
  price: string;
  originalPrice: string;
  category: string;
  occasion: string;
  compression: string;
  badgeEn: string;
  badgeEs: string;
  descriptionEn: string;
  descriptionEs: string;
  shortDescriptionEn: string;
  shortDescriptionEs: string;
  featuresEn: string[];
  featuresEs: string[];
  materials: string;
  care: string;
  colors: string[];
  sizes: string[];
  images: string[];
  stockQuantity: string;
  lowStockThreshold: string;
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { id?: string };
  isEditing?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const inputClasses =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

export default function ProductForm({
  initialData,
  isEditing,
}: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ProductFormData>({
    nameEn: initialData?.nameEn || "",
    nameEs: initialData?.nameEs || "",
    slug: initialData?.slug || "",
    sku: initialData?.sku || "",
    price: initialData?.price?.toString() || "",
    originalPrice: initialData?.originalPrice?.toString() || "",
    category: initialData?.category || "fajas",
    occasion: initialData?.occasion || "diario",
    compression: initialData?.compression || "media",
    badgeEn: initialData?.badgeEn || "",
    badgeEs: initialData?.badgeEs || "",
    descriptionEn: initialData?.descriptionEn || "",
    descriptionEs: initialData?.descriptionEs || "",
    shortDescriptionEn: initialData?.shortDescriptionEn || "",
    shortDescriptionEs: initialData?.shortDescriptionEs || "",
    featuresEn: initialData?.featuresEn || [""],
    featuresEs: initialData?.featuresEs || [""],
    materials: initialData?.materials || "",
    care: initialData?.care || "",
    colors: initialData?.colors || [],
    sizes: initialData?.sizes || [],
    images: initialData?.images || [],
    stockQuantity: initialData?.stockQuantity?.toString() || "100",
    lowStockThreshold: initialData?.lowStockThreshold?.toString() || "5",
    inStock: initialData?.inStock !== false,
    isFeatured: initialData?.isFeatured || false,
    isActive: initialData?.isActive !== false,
    sortOrder: initialData?.sortOrder?.toString() || "0",
  });

  function updateField<K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      // Auto-generate slug from Spanish name
      if (key === "nameEs" && !isEditing) {
        updated.slug = slugify(value as string);
      }
      return updated;
    });
  }

  function toggleArrayItem(
    key: "colors" | "sizes",
    item: string
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter((i) => i !== item)
        : [...prev[key], item],
    }));
  }

  function addFeature() {
    setForm((prev) => ({
      ...prev,
      featuresEn: [...prev.featuresEn, ""],
      featuresEs: [...prev.featuresEs, ""],
    }));
  }

  function removeFeature(index: number) {
    setForm((prev) => ({
      ...prev,
      featuresEn: prev.featuresEn.filter((_, i) => i !== index),
      featuresEs: prev.featuresEs.filter((_, i) => i !== index),
    }));
  }

  function updateFeature(
    lang: "En" | "Es",
    index: number,
    value: string
  ) {
    const key = `features${lang}` as "featuresEn" | "featuresEs";
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((f, i) => (i === index ? value : f)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice
          ? parseFloat(form.originalPrice)
          : null,
        stockQuantity: parseInt(form.stockQuantity),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        sortOrder: parseInt(form.sortOrder),
        featuresEn: form.featuresEn.filter((f) => f.trim()),
        featuresEs: form.featuresEs.filter((f) => f.trim()),
        badgeEn: form.badgeEn || null,
        badgeEs: form.badgeEs || null,
        sku: form.sku || null,
      };

      const url = isEditing
        ? `/api/admin/products/${initialData?.id}`
        : "/api/admin/products";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al guardar el producto"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Desactivar este producto?")) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/products/${initialData?.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Error al eliminar el producto");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <AdminPageHeader
        title={isEditing ? "Editar Producto" : "Nuevo Producto"}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Productos", href: "/admin/products" },
          { label: isEditing ? "Editar" : "Nuevo" },
        ]}
        action={
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
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
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Informacion Basica
            </h3>
            <AdminBilingualInput
              label="Nombre del producto"
              valueEn={form.nameEn}
              valueEs={form.nameEs}
              onChangeEn={(v) => updateField("nameEn", v)}
              onChangeEs={(v) => updateField("nameEs", v)}
              placeholder="Nombre"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug <span className="text-rosa">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  placeholder="Ej: FAJA-001"
                  className={inputClasses}
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio (USD) <span className="text-rosa">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio original (tachado)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) =>
                    updateField("originalPrice", e.target.value)
                  }
                  placeholder="Dejar vacio si no hay descuento"
                  className={inputClasses}
                />
              </div>
            </div>
            {form.price && form.originalPrice && (
              <p className="text-sm text-emerald-600 font-medium">
                Descuento:{" "}
                {Math.round(
                  (1 - parseFloat(form.price) / parseFloat(form.originalPrice)) * 100
                )}
                %
              </p>
            )}
          </section>

          {/* Description */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Descripcion</h3>
            <AdminBilingualInput
              label="Descripcion corta"
              valueEn={form.shortDescriptionEn}
              valueEs={form.shortDescriptionEs}
              onChangeEn={(v) => updateField("shortDescriptionEn", v)}
              onChangeEs={(v) => updateField("shortDescriptionEs", v)}
              placeholder="Breve descripcion"
              textarea
              rows={2}
            />
            <AdminBilingualInput
              label="Descripcion completa"
              valueEn={form.descriptionEn}
              valueEs={form.descriptionEs}
              onChangeEn={(v) => updateField("descriptionEn", v)}
              onChangeEs={(v) => updateField("descriptionEs", v)}
              placeholder="Descripcion detallada"
              textarea
              rows={4}
            />
          </section>

          {/* Features */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Caracteristicas
              </h3>
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center gap-1 text-sm text-rosa hover:text-rosa-dark transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            {form.featuresEs.map((_, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      ES
                    </span>
                    <input
                      type="text"
                      value={form.featuresEs[index] || ""}
                      onChange={(e) =>
                        updateFeature("Es", index, e.target.value)
                      }
                      placeholder={`Caracteristica ${index + 1}`}
                      className={inputClasses + " mt-1"}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      EN
                    </span>
                    <input
                      type="text"
                      value={form.featuresEn[index] || ""}
                      onChange={(e) =>
                        updateFeature("En", index, e.target.value)
                      }
                      placeholder={`Feature ${index + 1}`}
                      className={inputClasses + " mt-1"}
                    />
                  </div>
                </div>
                {form.featuresEs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="mt-6 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </section>

          {/* Materials & Care */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Materiales y Cuidado
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Materiales
              </label>
              <textarea
                value={form.materials}
                onChange={(e) => updateField("materials", e.target.value)}
                rows={2}
                className={inputClasses + " resize-none"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instrucciones de cuidado
              </label>
              <textarea
                value={form.care}
                onChange={(e) => updateField("care", e.target.value)}
                rows={2}
                className={inputClasses + " resize-none"}
              />
            </div>
          </section>

          {/* Images */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-colors duration-300">
            <AdminImageUpload
              images={form.images}
              onImagesChange={(imgs) => updateField("images", imgs)}
            />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categorization */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Categorizacion
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputClasses + " cursor-pointer"}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ocasion
              </label>
              <select
                value={form.occasion}
                onChange={(e) => updateField("occasion", e.target.value)}
                className={inputClasses + " cursor-pointer"}
              >
                {OCCASIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Compresion
              </label>
              <select
                value={form.compression}
                onChange={(e) => updateField("compression", e.target.value)}
                className={inputClasses + " cursor-pointer"}
              >
                {COMPRESSIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <AdminBilingualInput
              label="Badge / Etiqueta"
              valueEn={form.badgeEn}
              valueEs={form.badgeEs}
              onChangeEn={(v) => updateField("badgeEn", v)}
              onChangeEs={(v) => updateField("badgeEs", v)}
              placeholder="Ej: Bestseller, Nuevo, Oferta"
            />
          </section>

          {/* Colors */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Colores</h3>
            <div className="flex flex-wrap gap-2.5">
              {ALL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleArrayItem("colors", color)}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 transition-all cursor-pointer",
                    form.colors.includes(color)
                      ? "ring-2 ring-rosa ring-offset-2 dark:ring-offset-gray-900 border-rosa scale-110"
                      : "border-gray-200 dark:border-gray-700 hover:scale-110"
                  )}
                  style={{ backgroundColor: getColorHex(color) }}
                  title={color}
                />
              ))}
            </div>
            {form.colors.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Seleccionados: {form.colors.join(", ")}
              </p>
            )}
          </section>

          {/* Sizes */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Tallas</h3>
            <div className="grid grid-cols-4 gap-2">
              {ALL_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleArrayItem("sizes", size)}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium transition-all cursor-pointer text-center",
                    form.sizes.includes(size)
                      ? "bg-rosa text-white ring-2 ring-rosa shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </section>

          {/* Inventory */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Inventario</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) =>
                  updateField("stockQuantity", e.target.value)
                }
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Umbral stock bajo
              </label>
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  updateField("lowStockThreshold", e.target.value)
                }
                className={inputClasses}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => updateField("inStock", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">En stock</span>
            </label>
          </section>

          {/* Display Options */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 transition-colors duration-300">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              Opciones de display
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Producto activo (visible en tienda)
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  updateField("isFeatured", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300 text-rosa focus:ring-rosa"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Producto destacado
              </span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Orden
              </label>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => updateField("sortOrder", e.target.value)}
                className={inputClasses}
              />
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
