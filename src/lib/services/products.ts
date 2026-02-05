import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";

/**
 * Product type as consumed by the frontend (bilingual object structure).
 * This matches the existing Product interface used throughout the storefront.
 */
export interface Product {
  id: string;
  name: { en: string; es: string };
  slug: string;
  price: number;
  originalPrice: number | null;
  category: string;
  colors: string[];
  sizes: string[];
  compression: string;
  occasion: string;
  badge: { en: string; es: string } | null;
  description: { en: string; es: string };
  shortDescription: { en: string; es: string };
  features: { en: string[]; es: string[] };
  materials: string;
  care: string;
  images: string[];
  sizeChartImageUrl: string | null;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

/**
 * Transform a Firestore document (flat bilingual columns)
 * into the frontend's expected bilingual object structure.
 */
function transformProduct(
  id: string,
  data: FirebaseFirestore.DocumentData
): Product {
  return {
    id,
    name: { en: data.nameEn || "", es: data.nameEs || "" },
    slug: data.slug || "",
    price: Number(data.price) || 0,
    originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
    category: data.category || "",
    colors: data.colors || [],
    sizes: data.sizes || [],
    compression: data.compression || "",
    occasion: data.occasion || "",
    badge:
      data.badgeEn || data.badgeEs
        ? { en: data.badgeEn || "", es: data.badgeEs || "" }
        : null,
    description: {
      en: data.descriptionEn || "",
      es: data.descriptionEs || "",
    },
    shortDescription: {
      en: data.shortDescriptionEn || "",
      es: data.shortDescriptionEs || "",
    },
    features: {
      en: data.featuresEn || [],
      es: data.featuresEs || [],
    },
    materials: data.materials || "",
    care: data.care || "",
    images: data.images || [],
    sizeChartImageUrl: data.sizeChartImageUrl || null,
    rating: Number(data.rating) || 0,
    reviewCount: Number(data.reviewCount) || 0,
    inStock: data.inStock !== false,
  };
}

/**
 * Get all active products from Firestore.
 * Falls back to JSON data if Firestore is not configured.
 */
export async function getProducts(): Promise<Product[]> {
  if (!isFirebaseConfigured()) {
    const productsData = (await import("@/data/products.json")).default;
    return productsData as unknown as Product[];
  }

  try {
    const snapshot = await adminDb
      .collection("products")
      .where("isActive", "==", true)
      .orderBy("sortOrder", "asc")
      .get();

    return snapshot.docs.map((doc) => transformProduct(doc.id, doc.data()));
  } catch (err) {
    console.warn("Falling back to JSON products:", err);
    const productsData = (await import("@/data/products.json")).default;
    return productsData as unknown as Product[];
  }
}

/**
 * Get a single product by its slug.
 * Falls back to JSON data if Firestore is not configured.
 */
export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  if (!isFirebaseConfigured()) {
    const productsData = (await import("@/data/products.json")).default;
    const product = (productsData as unknown as Product[]).find(
      (p) => p.slug === slug
    );
    return product || null;
  }

  try {
    const snapshot = await adminDb
      .collection("products")
      .where("slug", "==", slug)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return transformProduct(doc.id, doc.data());
  } catch (err) {
    console.warn("Falling back to JSON for product:", slug, err);
    const productsData = (await import("@/data/products.json")).default;
    const product = (productsData as unknown as Product[]).find(
      (p) => p.slug === slug
    );
    return product || null;
  }
}

/**
 * Get all active collections from Firestore.
 */
export async function getCollections() {
  if (!isFirebaseConfigured()) {
    const collectionsData = (await import("@/data/collections.json")).default;
    return collectionsData;
  }

  try {
    const snapshot = await adminDb
      .collection("collections")
      .where("isActive", "==", true)
      .orderBy("sortOrder", "asc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug,
        name: data.nameEs,
        description: data.descriptionEs,
        image: data.image,
        productCount: data.productCount,
      };
    });
  } catch {
    const collectionsData = (await import("@/data/collections.json")).default;
    return collectionsData;
  }
}
