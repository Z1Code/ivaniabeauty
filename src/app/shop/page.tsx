import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import ShopPageClient from "@/components/shop/ShopPageClient";
import { getProducts } from "@/lib/services/products";

export const metadata: Metadata = {
  title: "Shop Fajas Premium | Ivania Beauty",
  description:
    "Explora nuestra coleccion de fajas premium. Fajas para playa, dia a dia, eventos y post-parto con compresion firme y comodidad garantizada.",
  openGraph: {
    title: "Shop Fajas Premium | Ivania Beauty",
    description:
      "Explora nuestra coleccion de fajas premium. Fajas para playa, dia a dia, eventos y post-parto con compresion firme y comodidad garantizada.",
    type: "website",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Fajas Premium | Ivania Beauty",
    description:
      "Explora nuestra coleccion de fajas premium. Fajas para playa, dia a dia, eventos y post-parto.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://ivaniabeauty.com/shop",
  },
};

interface ShopListProductPayload {
  id: string;
  name: { en: string; es: string };
  slug: string;
  price: number;
  originalPrice: number | null;
  category: string;
  colors: string[];
  sizes: string[];
  compression: string;
  badge: { en: string; es: string } | null;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sizeStock?: Record<string, number>;
  colorSizeStock?: Record<string, Record<string, number>>;
}

function toShopListPayload(products: Awaited<ReturnType<typeof getProducts>>): ShopListProductPayload[] {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    originalPrice: product.originalPrice,
    category: product.category,
    colors: product.colors,
    sizes: product.sizes,
    compression: product.compression,
    badge: product.badge,
    images: product.images,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
    sizeStock: product.sizeStock,
    colorSizeStock: product.colorSizeStock,
  }));
}

const getShopProductsCached = unstable_cache(
  async () => {
    const products = await getProducts();
    return toShopListPayload(products);
  },
  ["shop-products"],
  { revalidate: 120, tags: ["products"] }
);

export default async function ShopPage() {
  const initialProducts = await getShopProductsCached();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-perla flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ShopPageClient initialProducts={initialProducts} />
    </Suspense>
  );
}
