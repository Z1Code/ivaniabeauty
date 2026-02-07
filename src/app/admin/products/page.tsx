import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/firebase/auth-helpers";
import AdminProductsClient, { type ProductRow } from "./AdminProductsClient";
import type { SizeChartDoc } from "@/lib/firebase/types";

async function getInitialProducts(): Promise<ProductRow[]> {
  const [productsSnap, fitGuidesSnap] = await Promise.all([
    adminDb.collection("products").orderBy("sortOrder", "asc").get(),
    adminDb.collection("sizeCharts").get(),
  ]);

  const fitGuideMap = new Map(
    fitGuidesSnap.docs.map((doc) => [doc.id, doc.data() as SizeChartDoc])
  );

  return productsSnap.docs.map((doc) => {
    const data = doc.data();
    const fitGuide = fitGuideMap.get(doc.id);

    return {
      id: doc.id,
      nameEs: data.nameEs || "",
      nameEn: data.nameEn || "",
      price: Number(data.price || 0),
      originalPrice: data.originalPrice ?? null,
      category: data.category || "",
      stockQuantity: Number(data.stockQuantity ?? 0),
      isActive: data.isActive !== false,
      images: Array.isArray(data.images) ? data.images : [],
      fitGuideStatus:
        fitGuide?.status ||
        (data.sizeChartImageUrl ? "stale" : "failed"),
      fitGuideWarnings: fitGuide?.warnings || [],
    };
  });
}

export default async function AdminProductsPage() {
  await requireAdmin();
  const initialProducts = await getInitialProducts();
  return <AdminProductsClient initialProducts={initialProducts} />;
}

