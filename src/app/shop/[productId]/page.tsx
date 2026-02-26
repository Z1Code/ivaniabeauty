"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ShoppingBag,
  Minus,
  Plus,
  Truck,
  RefreshCw,
  Shield,
  RotateCw,
  CheckCircle,
  X,
  ChevronRight,
  Loader2,
} from "lucide-react";

import productsData from "@/data/products.json";
import useCart from "@/hooks/useCart";
import { formatPrice, getColorHex } from "@/lib/utils";
import { SIZE_CHART } from "@/lib/constants";
import ProductCard from "@/components/ui/ProductCard";
import UnitToggle, { type Unit } from "@/components/ui/UnitToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocalizedField } from "@/lib/productHelpers";
import type { FitGuideStatus } from "@/lib/firebase/types";
import { canonicalizeSizeLabel } from "@/lib/fit-guide/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type BilingualString = { en: string; es: string };
type BilingualArray = { en: string[]; es: string[] };

interface ProductData {
  id: string;
  name: BilingualString;
  slug: string;
  price: number;
  originalPrice: number | null;
  category: string;
  colors: string[];
  sizes: string[];
  compression: string;
  occasion: string;
  badge: BilingualString | null;
  description: BilingualString;
  shortDescription: BilingualString;
  features: BilingualArray;
  materials: string;
  care: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sizeChartImageUrl?: string | null;
  productPageImageUrl?: string | null;
  sizeStock?: Record<string, number>;
}

interface SizeChartDisplayCell {
  cm: string | null;
  in: string | null;
}

interface SizeChartDisplayRow {
  size: string;
  metrics: Record<string, SizeChartDisplayCell | null>;
}

interface SizeChartApiResponse {
  status: FitGuideStatus;
  warnings: string[];
  metricKeys: string[];
  displayRows: SizeChartDisplayRow[];
}

/* ------------------------------------------------------------------ */
/*  Mock reviews (structure only - text is translated via i18n)         */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Thumbnail gradient palette                                         */
/* ------------------------------------------------------------------ */

const THUMB_GRADIENTS = [
  "from-rosa-light/40 to-arena",
  "from-rosa/30 to-rosa-light/50",
  "from-arena to-rosa-light/30",
  "from-rosa-light/20 to-coral/20",
];

/* ------------------------------------------------------------------ */
/*  Tab keys                                                           */
/* ------------------------------------------------------------------ */

type TabKey = "descripcion" | "tallas" | "materiales" | "resenas";

/* ================================================================== */
/*  PAGE COMPONENT                                                     */
/* ================================================================== */

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      setLoading(true);
      try {
        // Fetch from API (Firestore)
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        } else {
          // Fallback to local JSON
          const localProduct = (productsData as ProductData[]).find(
            (p) => p.slug === productId
          );
          setProduct(localProduct || null);
        }
      } catch {
        // Fallback to local JSON on error
        const localProduct = (productsData as ProductData[]).find(
          (p) => p.slug === productId
        );
        setProduct(localProduct || null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  /* Loading state */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-28">
        <Loader2 className="w-8 h-8 text-rosa animate-spin" />
      </div>
    );
  }

  /* If product is not found, render a friendly message */
  if (!product) {
    return <ProductNotFound />;
  }

  return <ProductDetail product={product} />;
}

/* ================================================================== */
/*  NOT FOUND                                                          */
/* ================================================================== */

function ProductNotFound() {
  const { t } = useTranslation();
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center pt-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-serif text-3xl font-bold text-gray-800 mb-4">
          {t("productDetail.notFoundHeading")}
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          {t("productDetail.notFoundText")}
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3 bg-rosa text-white rounded-full font-semibold hover:bg-rosa-dark transition-colors"
        >
          {t("productDetail.notFoundCta")}
        </Link>
      </motion.div>
    </section>
  );
}

/* ================================================================== */
/*  PRODUCT DETAIL                                                     */
/* ================================================================== */

function ProductDetail({ product }: { product: ProductData }) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const addItem = useCart((s) => s.addItem);

  /* ----- localized product fields ----- */
  const localName = getLocalizedField(product.name, language);
  const localDescription = getLocalizedField(product.description, language);
  const localShortDescription = getLocalizedField(product.shortDescription, language);
  const localFeatures = getLocalizedField(product.features, language);
  const localBadge = getLocalizedField(product.badge, language);

  /* ----- local state ----- */
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("descripcion");
  const [show360, setShow360] = useState(false);
  const [sizeGuideUnit, setSizeGuideUnit] = useState<Unit>("cm");
  const [fitGuideLoading, setFitGuideLoading] = useState(false);
  const [fitGuideData, setFitGuideData] = useState<SizeChartApiResponse | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);
  const [liveStock, setLiveStock] = useState<{
    sizeStock: Record<string, number>;
    lowStockThreshold: number;
  } | null>(null);

  /* ----- fetch live stock data ----- */
  useEffect(() => {
    if (!product.id) return;
    let cancelled = false;

    async function fetchStock() {
      try {
        const res = await fetch(`/api/products/${product.id}/stock`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setLiveStock({
            sizeStock: data.sizeStock || {},
            lowStockThreshold: data.lowStockThreshold ?? 5,
          });
        }
      } catch {
        // Silent fail — stock alerts are non-critical
      }
    }

    void fetchStock();
    return () => { cancelled = true; };
  }, [product.id]);

  /* ----- translated tab labels ----- */
  const TAB_LABELS: { key: TabKey; label: string }[] = [
    { key: "descripcion", label: t("productDetail.tabDescription") },
    { key: "tallas", label: t("productDetail.tabSizeGuide") },
    { key: "materiales", label: t("productDetail.tabMaterials") },
    { key: "resenas", label: t("productDetail.tabReviews") },
  ];

  /* ----- derived ----- */
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : null;

  const fullStars = Math.floor(product.rating);
  const hasHalfStar = product.rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  /* ----- related products ----- */
  const relatedProducts = useMemo(() => {
    const sameCat = (productsData as ProductData[]).filter(
      (p) => p.category === product.category && p.id !== product.id
    );
    const pool =
      sameCat.length >= 4
        ? sameCat
        : (productsData as ProductData[]).filter((p) => p.id !== product.id);
    return pool.slice(0, 4);
  }, [product.id, product.category]);

  const galleryImages = useMemo(() => {
    const source = Array.isArray(product.images) ? product.images : [];
    const fitGuideImage = product.sizeChartImageUrl || null;
    return source.filter((image) => image && image !== fitGuideImage);
  }, [product.images, product.sizeChartImageUrl]);

  const selectedGalleryImage =
    galleryImages[selectedImageIndex] || galleryImages[0] || null;
  const selectedMainImage = useMemo(() => {
    const customProductPageImage =
      typeof product.productPageImageUrl === "string" &&
      product.productPageImageUrl.trim()
        ? product.productPageImageUrl.trim()
        : null;
    if (selectedImageIndex === 0 && customProductPageImage) {
      return customProductPageImage;
    }
    return selectedGalleryImage;
  }, [product.productPageImageUrl, selectedGalleryImage, selectedImageIndex]);
  const mainImageClasses = useMemo(
    () =>
      typeof product.productPageImageUrl === "string" &&
      product.productPageImageUrl.trim() &&
      selectedImageIndex === 0
        ? "absolute inset-0 w-full h-full object-cover"
        : "absolute inset-0 w-full h-full object-contain p-3",
    [product.productPageImageUrl, selectedImageIndex]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchFitGuide() {
      setFitGuideLoading(true);
      setFitGuideData(null);
      try {
        const res = await fetch(`/api/products/${product.id}/size-chart`);
        const data = (await res.json()) as Partial<SizeChartApiResponse>;
        if (cancelled) return;

        if (res.ok && typeof data.status === "string") {
          const nextData: SizeChartApiResponse = {
            status: data.status as FitGuideStatus,
            warnings: Array.isArray(data.warnings) ? data.warnings : [],
            metricKeys: Array.isArray(data.metricKeys) ? data.metricKeys : [],
            displayRows: Array.isArray(data.displayRows) ? data.displayRows : [],
          };
          setFitGuideData(nextData);

          if (nextData.status !== "confirmed") {
            console.warn(
              `[fit-guide] Fallback to static chart for product ${product.id}.`,
              nextData.warnings
            );
          }
        } else {
          setFitGuideData(null);
        }
      } catch (error) {
        if (!cancelled) {
          setFitGuideData(null);
          console.warn("[fit-guide] Failed to load fit-guide.", error);
        }
      } finally {
        if (!cancelled) {
          setFitGuideLoading(false);
        }
      }
    }

    void fetchFitGuide();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const fallbackRows = useMemo(() => {
    const normalizedProductSizes = new Set(
      product.sizes.map((size) => canonicalizeSizeLabel(size))
    );

    const staticRows: SizeChartDisplayRow[] = SIZE_CHART.map((row) => ({
      size: row.size,
      metrics: {
        waist: {
          cm: row.waist,
          in: toRoundedInches(row.waist),
        },
        hip: {
          cm: row.hip,
          in: toRoundedInches(row.hip),
        },
      },
    }));

    const filteredRows = staticRows.filter((row) =>
      normalizedProductSizes.has(canonicalizeSizeLabel(row.size))
    );

    return filteredRows.length > 0 ? filteredRows : staticRows;
  }, [product.sizes]);

  const hasConfirmedFitGuide = useMemo(
    () =>
      fitGuideData?.status === "confirmed" &&
      Array.isArray(fitGuideData.displayRows) &&
      fitGuideData.displayRows.length > 0,
    [fitGuideData]
  );

  const chartRows = useMemo(
    () => (hasConfirmedFitGuide ? fitGuideData?.displayRows || [] : fallbackRows),
    [fitGuideData?.displayRows, fallbackRows, hasConfirmedFitGuide]
  );

  const chartMetricKeys = useMemo(() => {
    const baseKeys =
      hasConfirmedFitGuide && fitGuideData?.metricKeys?.length
        ? fitGuideData.metricKeys
        : ["waist", "hip"];

    const visibleKeys = baseKeys.filter((metricKey) =>
      chartRows.some((row) => {
        const metric = row.metrics[metricKey];
        return Boolean(metric?.cm || metric?.in);
      })
    );

    if (visibleKeys.length > 0) return visibleKeys;
    return baseKeys;
  }, [chartRows, fitGuideData?.metricKeys, hasConfirmedFitGuide]);

  const fitGuideNotice = useMemo(() => {
    if (hasConfirmedFitGuide) return null;
    const warning = fitGuideData?.warnings?.[0];
    if (warning) return warning;
    return t("productDetail.fitGuideFallbackNotice");
  }, [fitGuideData?.warnings, hasConfirmedFitGuide, t]);

  /* ----- cart handler ----- */
  const handleAddToCart = () => {
    if (!selectedSize && product.sizes.length > 0) {
      setSizeError(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem({
      id: product.id,
      name: localName,
      price: product.price,
      image: galleryImages[0] ?? "",
      color: selectedColor,
      size: selectedSize || product.sizes[0],
      quantity,
    });
  };

  /* ----- buy now handler ----- */
  const handleBuyNow = () => {
    if (!selectedSize && product.sizes.length > 0) {
      setSizeError(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addItem({
      id: product.id,
      name: localName,
      price: product.price,
      image: galleryImages[0] ?? "",
      color: selectedColor,
      size: selectedSize || product.sizes[0],
      quantity,
    });
    router.push("/checkout");
  };

  /* ----- badge style helper ----- */
  const badgeEnKey = product.badge?.en ?? "";
  const badgeBg =
    badgeEnKey === "Bestseller"
      ? "bg-rosa"
      : badgeEnKey === "New"
        ? "bg-turquesa"
        : badgeEnKey === "Sale"
          ? "bg-dorado"
          : "bg-rosa";

  /* ---------------------------------------------------------------- */
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      {/* ---------- BREADCRUMB ---------- */}
      <nav className="text-sm text-gray-500 mb-8 flex items-center gap-1 flex-wrap">
        <Link href="/" className="hover:text-rosa transition-colors">
          {t("productDetail.breadcrumbHome")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-rosa transition-colors">
          {t("productDetail.breadcrumbShop")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-medium">{localName}</span>
      </nav>

      {/* ---------- TWO COLUMN GRID ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ============ LEFT : GALLERY ============ */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* --- main image --- */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-rosa-light/30 to-arena group cursor-zoom-in">
            {selectedMainImage ? (
              <motion.img
                key={selectedMainImage}
                src={selectedMainImage}
                alt={`${localName} - ${selectedImageIndex + 1}`}
                className={mainImageClasses}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.08 }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${THUMB_GRADIENTS[0]}`}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            )}

            {/* Badge */}
            {product.badge && (
              <span
                className={`absolute top-4 left-4 z-10 px-4 py-1.5 text-xs font-semibold text-white rounded-full ${badgeBg}`}
              >
                {localBadge}
              </span>
            )}
          </div>

          {/* --- thumbnails --- */}
          <div className="flex gap-3 mt-4">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                className={`flex-1 aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-rosa-light/30 to-arena transition-all cursor-pointer ${
                  selectedImageIndex === i
                    ? "ring-2 ring-rosa ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
                aria-label={`${t("productDetail.imageAriaLabel")} ${i + 1}`}
              >
                <img
                  src={img}
                  alt={`${localName} - ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </button>
            ))}
          </div>

          {/* --- 360 toggle --- */}
          <button
            onClick={() => setShow360((v) => !v)}
            className="mt-4 flex items-center gap-2 text-sm text-rosa font-semibold hover:text-rosa-dark transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            {t("productDetail.view360")}
          </button>

          {/* --- 360 viewer --- */}
          <AnimatePresence>
            {show360 && <Viewer360 />}
          </AnimatePresence>
        </motion.div>

        {/* ============ RIGHT : PRODUCT INFO ============ */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Badge pill */}
          {localBadge && (
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full mb-3 ${badgeBg}`}
            >
              {localBadge}
            </span>
          )}

          {/* Name */}
          <h1 className="font-serif text-3xl font-bold text-gray-900">
            {localName}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              {Array.from({ length: fullStars }).map((_, i) => (
                <Star
                  key={`f-${i}`}
                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                />
              ))}
              {hasHalfStar && (
                <Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
              )}
              {Array.from({ length: emptyStars }).map((_, i) => (
                <Star
                  key={`e-${i}`}
                  className="w-4 h-4 fill-transparent text-gray-300"
                />
              ))}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {product.rating}
            </span>
            <span className="text-sm text-gray-500">
              ({product.reviewCount} {t("productDetail.reviewsLabel")})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-3xl font-bold text-rosa-dark">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                {discountPercent && (
                  <span className="px-2 py-0.5 bg-rosa/10 text-rosa-dark text-sm font-semibold rounded-full">
                    {discountPercent}% OFF
                  </span>
                )}
              </>
            )}
          </div>

          {/* Short description */}
          <p className="text-gray-600 mt-4 leading-relaxed">
            {localShortDescription}
          </p>

          {/* Divider */}
          <hr className="border-t border-rosa-light/30 my-6" />

          {/* ----- Color selector ----- */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {t("productDetail.colorLabel")}{" "}
              <span className="font-normal capitalize text-gray-500">
                {selectedColor}
              </span>
            </p>
            <div className="flex items-center gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                    selectedColor === color
                      ? "ring-2 ring-rosa ring-offset-2 border-transparent"
                      : "border-gray-200 hover:border-rosa-light"
                  }`}
                  style={{ backgroundColor: getColorHex(color) }}
                  aria-label={color}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* ----- Size selector ----- */}
          <div className="mb-6" ref={sizeRef}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">
                {t("productDetail.sizeLabel")}{" "}
                <span className="font-normal text-gray-500">
                  {selectedSize || t("productDetail.sizeSelect")}
                </span>
              </p>
              <button
                onClick={() => setShowSizeGuide(true)}
                className="text-sm text-rosa font-semibold underline underline-offset-2 hover:text-rosa-dark transition-colors cursor-pointer"
              >
                {t("productDetail.sizeGuideLink")}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const sizeQty = product.sizeStock?.[size];
                const isOutOfStock = sizeQty !== undefined && sizeQty <= 0;
                return (
                  <button
                    key={size}
                    onClick={() => {
                      if (!isOutOfStock) {
                        setSelectedSize(size);
                        setSizeError(false);
                      }
                    }}
                    disabled={isOutOfStock}
                    className={`min-w-[3rem] px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isOutOfStock
                        ? "border border-gray-200 text-gray-300 line-through cursor-not-allowed"
                        : selectedSize === size
                          ? "bg-rosa text-white shadow-md cursor-pointer"
                          : "border border-gray-300 text-gray-700 hover:border-rosa hover:text-rosa cursor-pointer"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {sizeError && !selectedSize && (
              <p className="text-sm text-red-500 mt-2 animate-pulse">
                {t("productDetail.sizeRequired")}
              </p>
            )}
            {/* Low stock alert */}
            {selectedSize && liveStock && (() => {
              const qty = liveStock.sizeStock[selectedSize];
              if (qty === undefined) return null;
              if (qty <= 0) {
                return (
                  <p className="text-sm text-gray-400 mt-2">
                    {t("productDetail.outOfStockSize")}
                  </p>
                );
              }
              if (qty <= liveStock.lowStockThreshold) {
                return (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                    <p className="text-sm text-amber-600 font-medium">
                      {t("productDetail.lowStockWarning")
                        .replace("{count}", String(qty))
                        .replace("{size}", selectedSize)}
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* ----- Quantity ----- */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {t("productDetail.quantityLabel")}
            </p>
            <div className="inline-flex items-center border border-gray-300 rounded-full overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-rosa-light/30 transition-colors cursor-pointer"
                aria-label={t("productDetail.decreaseQuantityAriaLabel")}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold text-gray-800 select-none">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-rosa-light/30 transition-colors cursor-pointer"
                aria-label={t("productDetail.increaseQuantityAriaLabel")}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ----- Add to Cart ----- */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="w-full py-4 bg-rosa text-white rounded-full text-lg font-semibold hover:bg-rosa-dark transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {t("productDetail.addToCart")}
          </motion.button>

          {/* ----- Buy Now ----- */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleBuyNow}
            className="w-full mt-3 py-4 border-2 border-rosa text-rosa rounded-full text-lg font-semibold hover:bg-rosa hover:text-white transition-colors cursor-pointer"
          >
            {t("productDetail.buyNow")}
          </motion.button>

          {/* ----- Trust badges ----- */}
          <div className="mt-6 flex justify-center gap-8 text-gray-500">
            <div className="flex flex-col items-center gap-1 text-xs">
              <Truck className="w-5 h-5 text-rosa" />
              <span>{t("productDetail.trustFreeShipping")}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs">
              <RefreshCw className="w-5 h-5 text-rosa" />
              <span>{t("productDetail.trust30DayReturns")}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs">
              <Shield className="w-5 h-5 text-rosa" />
              <span>{t("productDetail.trustSecurePayment")}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ----- Size Guide Modal ----- */}
      <AnimatePresence>
        {showSizeGuide && (
          <SizeGuideModal
            onClose={() => setShowSizeGuide(false)}
            unit={sizeGuideUnit}
            onUnitChange={setSizeGuideUnit}
            loading={fitGuideLoading}
            rows={chartRows}
            metricKeys={chartMetricKeys}
            notice={fitGuideNotice}
          />
        )}
      </AnimatePresence>

      {/* ============ TABS SECTION ============ */}
      <div className="mt-16">
        {/* Tab buttons */}
        <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === key
                  ? "border-b-2 border-rosa text-rosa font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="py-8">
          <AnimatePresence mode="wait">
            {activeTab === "descripcion" && (
              <TabPanel key="descripcion">
                <p className="text-gray-600 leading-relaxed mb-6">
                  {localDescription}
                </p>
                <ul className="space-y-3">
                  {localFeatures.map((feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-turquesa flex-shrink-0" />
                      <span className="text-gray-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </TabPanel>
            )}

            {activeTab === "tallas" && (
              <TabPanel key="tallas">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-500">
                      {hasConfirmedFitGuide
                        ? language === "es"
                          ? "Guía confirmada del producto"
                          : "Confirmed product fit guide"
                        : language === "es"
                          ? "Tabla referencial"
                          : "Reference chart"}
                    </p>
                    <UnitToggle unit={sizeGuideUnit} onChange={setSizeGuideUnit} />
                  </div>
                  {fitGuideNotice && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      {fitGuideNotice}
                    </p>
                  )}
                  <SizeChartTable
                    unit={sizeGuideUnit}
                    rows={chartRows}
                    metricKeys={chartMetricKeys}
                  />
                </div>
              </TabPanel>
            )}

            {activeTab === "materiales" && (
              <TabPanel key="materiales">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {t("productDetail.compositionHeading")}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {product.materials}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {t("productDetail.careHeading")}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {product.care}
                    </p>
                  </div>
                </div>
              </TabPanel>
            )}

            {activeTab === "resenas" && (
              <TabPanel key="resenas">
                <ReviewsList rating={product.rating} count={product.reviewCount} />
              </TabPanel>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ============ RELATED PRODUCTS ============ */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 mb-8">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-8">
            {t("productDetail.relatedProductsHeading")}
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {relatedProducts.map((rp) => (
              <div key={rp.id} className="min-w-[260px] max-w-[280px] snap-start flex-shrink-0">
                <ProductCard product={rp} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ================================================================== */
/*  SUB-COMPONENTS                                                     */
/* ================================================================== */

/* ---------- Tab Panel wrapper ---------- */

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Helpers ---------- */

function toRoundedInches(value: string | null): string | null {
  if (!value) return null;
  const numbers = (value.match(/\d+(?:[.,]\d+)?/g) || [])
    .map((token) => Number.parseFloat(token.replace(",", ".")))
    .filter((num) => Number.isFinite(num));

  if (!numbers.length) return null;

  const first = numbers[0];
  const second = numbers[1];
  if (second == null) return String(Math.round(first / 2.54));

  const min = Math.min(first, second);
  const max = Math.max(first, second);
  const minIn = Math.round(min / 2.54);
  const maxIn = Math.round(max / 2.54);
  return minIn === maxIn ? String(minIn) : `${minIn}-${maxIn}`;
}

function humanizeMetricKey(metricKey: string, language: string): string {
  const normalized = metricKey.toLowerCase();
  if (normalized === "waist") return language === "es" ? "Cintura" : "Waist";
  if (normalized === "hip") return language === "es" ? "Cadera" : "Hip";
  if (normalized === "bust") return language === "es" ? "Busto" : "Bust";
  if (normalized === "length") return language === "es" ? "Largo" : "Length";

  return metricKey
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/* ---------- Size Chart Table ---------- */

interface SizeChartTableProps {
  unit: Unit;
  rows: SizeChartDisplayRow[];
  metricKeys: string[];
}

function SizeChartTable({ unit, rows, metricKeys }: SizeChartTableProps) {
  const { t, language } = useTranslation();
  const unitLabel = unit === "inches" ? " (in)" : " (cm)";

  if (!rows.length) {
    return (
      <p className="text-sm text-gray-500">
        {language === "es"
          ? "No hay medidas disponibles para este producto."
          : "No measurements are available for this product."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-rosa-light/40">
            <th className="py-3 pr-6 font-semibold text-gray-800">
              {t("productDetail.sizeChartSize")}
            </th>
            {metricKeys.map((metricKey) => (
              <th
                key={metricKey}
                className="py-3 pr-6 font-semibold text-gray-800 whitespace-nowrap"
              >
                {humanizeMetricKey(metricKey, language)}
                {unitLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.size}
              className="border-b border-gray-100 hover:bg-rosa-light/10 transition-colors"
            >
              <td className="py-3 pr-6 font-medium text-gray-800">{row.size}</td>
              {metricKeys.map((metricKey) => {
                const metric = row.metrics[metricKey];
                const value =
                  unit === "inches" ? metric?.in || "-" : metric?.cm || "-";
                return (
                  <td key={metricKey} className="py-3 pr-6 text-gray-600">
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Size Guide Modal ---------- */

interface SizeGuideModalProps {
  onClose: () => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  loading: boolean;
  rows: SizeChartDisplayRow[];
  metricKeys: string[];
  notice: string | null;
}

function SizeGuideModal({
  onClose,
  unit,
  onUnitChange,
  loading,
  rows,
  metricKeys,
  notice,
}: SizeGuideModalProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-xl p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl z-10"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label={t("productDetail.closeAriaLabel")}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header with title and unit toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-gray-900">
            {t("productDetail.sizeGuideModalTitle")}
          </h2>
          <UnitToggle unit={unit} onChange={onUnitChange} />
        </div>

        {notice && (
          <p className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {notice}
          </p>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-rosa animate-spin" />
            <span className="ml-2 text-sm text-gray-500">
              {t("productDetail.sizeChartLoading") || "Analyzing size chart..."}
            </span>
          </div>
        ) : (
          <SizeChartTable unit={unit} rows={rows} metricKeys={metricKeys} />
        )}

        {/* How to measure */}
        <div className="mt-8 p-4 bg-arena/60 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-2">
            {t("productDetail.howToMeasureHeading")}
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <strong>{t("productDetail.sizeChartWaist").split(" ")[0]}:</strong>{" "}
              {t("productDetail.howToMeasureWaist")}
            </li>
            <li>
              <strong>{t("productDetail.sizeChartHip").split(" ")[0]}:</strong>{" "}
              {t("productDetail.howToMeasureHip")}
            </li>
            <li>{t("productDetail.howToMeasureTip")}</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-rosa text-white rounded-full font-semibold hover:bg-rosa-dark transition-colors cursor-pointer"
        >
          {t("productDetail.sizeGuideClose")}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ---------- 360 Viewer ---------- */

function Viewer360() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    setRotation((prev) => prev + delta * 0.8);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 overflow-hidden"
    >
      <div
        className="relative h-64 rounded-xl bg-gradient-to-br from-rosa-light/20 to-arena overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Rotating gradient to simulate 360 */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-rosa/30 via-transparent to-rosa-light/40"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute inset-8 rounded-full bg-gradient-to-tr from-rosa-light/50 to-arena/70"
          style={{
            transform: `rotate(${-rotation * 0.5}deg)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        />

        {/* Rotation angle label */}
        <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-600">
          {Math.round(((rotation % 360) + 360) % 360)}
        </div>

        {/* Instruction text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 text-gray-500 text-sm bg-white/60 backdrop-blur-sm rounded-full px-4 py-2">
            <RotateCw className="w-4 h-4" />
            <span>{t("productDetail.dragToSpin")}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Reviews List ---------- */

function ReviewsList({ rating, count }: { rating: number; count: number }) {
  const { t } = useTranslation();

  const MOCK_REVIEWS = [
    {
      id: 1,
      name: "Maria Garcia",
      avatar: "MG",
      rating: 5,
      date: "15 Enero, 2026",
      text: t("testimonials.review1Text"),
    },
    {
      id: 2,
      name: "Laura Martinez",
      avatar: "LM",
      rating: 4,
      date: "8 Enero, 2026",
      text: t("testimonials.review2Text"),
    },
    {
      id: 3,
      name: "Carolina Lopez",
      avatar: "CL",
      rating: 5,
      date: "28 Diciembre, 2025",
      text: t("testimonials.review3Text"),
    },
  ];

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-8">
        <div className="text-center">
          <span className="text-4xl font-bold text-gray-900">{rating}</span>
          <div className="flex items-center mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{count} {t("productDetail.reviewsLabel")}</p>
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-6">
        {MOCK_REVIEWS.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: review.id * 0.1 }}
            className="border-b border-gray-100 pb-6 last:border-0"
          >
            <div className="flex items-center gap-3 mb-2">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rosa-light to-rosa flex items-center justify-center text-white text-sm font-semibold">
                {review.avatar}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {review.name}
                </p>
                <p className="text-xs text-gray-400">{review.date}</p>
              </div>
            </div>
            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-transparent text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {review.text}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
