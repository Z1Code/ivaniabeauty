import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const doc = await adminDb.collection("products").doc(id).get();
  if (!doc.exists) notFound();

  const data = doc.data()!;
  const initialData = {
    id: doc.id,
    nameEn: data.nameEn || "",
    nameEs: data.nameEs || "",
    slug: data.slug || "",
    sku: data.sku || "",
    price: data.price?.toString() || "",
    originalPrice: data.originalPrice?.toString() || "",
    category: data.category || "diario",
    occasion: data.occasion || "diario",
    compression: data.compression || "media",
    badgeEn: data.badgeEn || "",
    badgeEs: data.badgeEs || "",
    descriptionEn: data.descriptionEn || "",
    descriptionEs: data.descriptionEs || "",
    shortDescriptionEn: data.shortDescriptionEn || "",
    shortDescriptionEs: data.shortDescriptionEs || "",
    featuresEn: data.featuresEn || [""],
    featuresEs: data.featuresEs || [""],
    materials: data.materials || "",
    care: data.care || "",
    colors: data.colors || [],
    sizes: data.sizes || [],
    images: data.images || [],
    stockQuantity: Object.values(
      (data.sizeStock as Record<string, number>) || {}
    ).reduce((sum: number, qty) => sum + (typeof qty === "number" ? qty : 0), 0).toString(),
    sizeStock: data.sizeStock || {},
    colorSizeStock: data.colorSizeStock || {},
    lowStockThreshold: data.lowStockThreshold?.toString() || "5",
    inStock: data.inStock !== false,
    isFeatured: data.isFeatured || false,
    isActive: data.isActive !== false,
    sortOrder: data.sortOrder?.toString() || "0",
    sizeChartImageUrl: data.sizeChartImageUrl || null,
    productPageImageUrl: data.productPageImageUrl || null,
    productPageImageSourceUrl: data.productPageImageSourceUrl || null,
    imageCropSourceMap:
      data.imageCropSourceMap && typeof data.imageCropSourceMap === "object"
        ? (data.imageCropSourceMap as Record<string, string>)
        : {},
    imageEnhanceSourceMap:
      data.imageEnhanceSourceMap && typeof data.imageEnhanceSourceMap === "object"
        ? (data.imageEnhanceSourceMap as Record<string, string>)
        : {},
  };

  return <ProductForm initialData={initialData} isEditing />;
}
