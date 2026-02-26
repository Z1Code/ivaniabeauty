import type { Metadata } from "next";
import { getProductBySlug, getProducts } from "@/lib/services/products";
import ProductDetailPage from "./ProductPageClient";

interface Props {
  params: Promise<{ productId: string }>;
}

// Pre-render top 20 products at build time; remaining served dynamically on demand
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.slice(0, 20).map((product) => ({
    productId: product.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductBySlug(productId);

  if (!product) {
    return {
      title: "Product Not Found | Ivania Beauty",
    };
  }

  const title = `${product.name.es} | Ivania Beauty`;
  const description =
    product.shortDescription.es || product.description.es || "";
  const image = product.images[0] || "/og-image.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `https://ivaniabeauty.com/shop/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const product = await getProductBySlug(productId);

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name.es,
        description: product.shortDescription.es || product.description.es,
        image: product.images,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "USD",
          availability: product.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
        ...(product.rating > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailPage />
    </>
  );
}
