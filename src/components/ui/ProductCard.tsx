"use client";

import React, { memo, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Star, Eye } from "lucide-react";
import { formatPrice, cn, getColorHex } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocalizedField } from "@/lib/productHelpers";
import useCart from "@/hooks/useCart";

type BilingualString = { en: string; es: string };

export interface Product {
  id: string;
  name: BilingualString;
  slug: string;
  price: number;
  originalPrice?: number | null;
  badge?: BilingualString | null;
  images: string[];
  rating: number;
  reviewCount: number;
  colors: string[];
  category: string;
  sizes?: string[];
  inStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  imagePriority?: boolean;
  className?: string;
}

// Elegant badge styles: neutral background with strong colored border
const badgeStyles: Record<string, { border: string; text: string; bg: string }> = {
  Bestseller: {
    border: "border-rosa",
    text: "text-rosa-dark",
    bg: "bg-white/90",
  },
  New: {
    border: "border-turquesa",
    text: "text-turquesa",
    bg: "bg-white/90",
  },
  Nuevo: {
    border: "border-turquesa",
    text: "text-turquesa",
    bg: "bg-white/90",
  },
  Sale: {
    border: "border-amber-500",
    text: "text-amber-600",
    bg: "bg-white/90",
  },
  Oferta: {
    border: "border-amber-500",
    text: "text-amber-600",
    bg: "bg-white/90",
  },
};

const defaultBadgeStyle = {
  border: "border-rosa",
  text: "text-rosa-dark",
  bg: "bg-white/90",
};

function ProductCard({ product, imagePriority = false, className }: ProductCardProps) {
  const { t, language } = useTranslation();
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const { slug, price, originalPrice, badge, colors } = product;
  const primaryImage = product.images[0] || "";

  const name = getLocalizedField(product.name, language);
  const localBadge = getLocalizedField(badge, language);
  const isAiGeneratedImage = primaryImage.includes("/products/generated/");

  const [filling, setFilling] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isOutOfStock = product.inStock === false;

  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (filling || added || isOutOfStock) return;

      setFilling(true);

      setTimeout(() => {
        addItem({
          id: product.id,
          name,
          price: product.price,
          image: product.images[0] || "",
          color: colors[0] || "",
          size: (product.sizes && product.sizes[0]) || "",
          quantity: 1,
        });
        setFilling(false);
        setAdded(true);

        setTimeout(() => {
          openCart();
          setAdded(false);
        }, 600);
      }, 500);
    },
    [filling, added, isOutOfStock, addItem, openCart, product, name, colors]
  );

  const fullStars = Math.floor(product.rating);
  const hasHalf = product.rating - fullStars >= 0.5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("group h-full", className)}
      aria-label={name}
    >
      <div className="relative rounded-xl overflow-hidden bg-white flex flex-col h-full shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(255,107,157,0.12)] transition-all duration-500 ease-out border border-gray-100/80 hover:border-rosa-light/40">
        {/* ─── Image Area ─── */}
        <Link
          href={`/shop/${slug}`}
          className="block flex-shrink-0 relative"
        >
          <div
            className={cn(
              "relative aspect-[3/4] overflow-hidden",
              isAiGeneratedImage
                ? "bg-white"
                : "bg-[#f9f7f5]"
            )}
          >
            {/* Badge - elegant style with neutral bg and colored border */}
            {localBadge && (
              <span
                className={cn(
                  "absolute top-2.5 left-2.5 z-10 px-2.5 py-1 text-[9px] font-semibold rounded-lg tracking-wide uppercase",
                  "border backdrop-blur-sm shadow-sm",
                  "transition-all duration-300 hover:shadow-md hover:scale-105",
                  (badgeStyles[localBadge] || defaultBadgeStyle).bg,
                  (badgeStyles[localBadge] || defaultBadgeStyle).border,
                  (badgeStyles[localBadge] || defaultBadgeStyle).text
                )}
              >
                {localBadge}
              </span>
            )}

            {/* Discount badge - matching elegant style */}
            {discountPercent && (
              <span className="absolute top-2.5 right-2.5 z-10 px-2 py-1 text-[9px] font-semibold text-rosa-dark bg-white/90 backdrop-blur-sm border border-rosa rounded-lg shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                -{discountPercent}%
              </span>
            )}

            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 z-10 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
                <span className="px-4 py-1.5 bg-black/70 text-white text-[10px] font-semibold rounded-full tracking-widest uppercase">
                  {t("shop.outOfStock")}
                </span>
              </div>
            )}

            {/* Product image */}
            {primaryImage && !imgError ? (
              <Image
                src={primaryImage}
                alt={name}
                fill
                priority={imagePriority}
                fetchPriority={imagePriority ? "high" : "auto"}
                quality={isAiGeneratedImage ? 95 : 92}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 29vw, 360px"
                className={cn(
                  "absolute inset-0 w-full h-full transition-transform duration-700 ease-out will-change-transform",
                  isAiGeneratedImage
                    ? "object-contain p-1.5 group-hover:scale-[1.01]"
                    : "object-cover group-hover:scale-[1.06]"
                )}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-rosa-light/40" />
              </div>
            )}

            {/* Hover gradient overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-400 pointer-events-none",
                isAiGeneratedImage
                  ? "from-black/8 group-hover:opacity-100"
                  : "from-black/15 group-hover:opacity-100"
              )}
            />

            {/* Quick View hint (desktop only) */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none hidden sm:flex">
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFFDF9]/92 backdrop-blur-sm text-gray-800 text-[10px] font-medium rounded-full shadow-lg">
                <Eye className="w-3 h-3" />
                {t("shop.quickView")}
              </span>
            </div>
          </div>
        </Link>

        {/* ─── Card Body ─── */}
        <div className="p-3 sm:p-3.5 flex flex-col flex-1 gap-1">
          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5",
                      i < fullStars
                        ? "fill-amber-400 text-amber-400"
                        : i === fullStars && hasHalf
                          ? "fill-amber-400/50 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-[9px] text-gray-400 font-medium">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Product name */}
          <Link href={`/shop/${slug}`} className="block flex-1">
            <h3 className="font-serif text-[13px] sm:text-[14px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-rosa-dark transition-colors duration-300">
              {name}
            </h3>
          </Link>

          {/* Color swatches preview */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1 pt-0.5">
              {colors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="w-3 h-3 rounded-full border border-gray-200/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
                  style={{ backgroundColor: getColorHex(color) }}
                  title={color}
                  aria-label={`${t("shop.selectColor")}: ${color}`}
                  role="img"
                />
              ))}
              {colors.length > 4 && (
                <span className="text-[9px] text-gray-400 font-medium ml-0.5">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-auto pt-1">
            <span className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-[10px] text-gray-400 line-through decoration-gray-300">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* ─── Add to Cart - Fill bar animation (preserved) ─── */}
          <motion.button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            animate={filling ? { scale: 0.96 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            whileTap={
              !filling && !added && !isOutOfStock
                ? { scale: 0.93 }
                : undefined
            }
            className={cn(
              "group/btn relative w-full py-2 sm:py-2.5 rounded-lg text-[13px] font-medium cursor-pointer overflow-hidden transition-all duration-300 min-h-[40px] mt-1",
              isOutOfStock
                ? "border border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                : added
                  ? "border border-emerald-400/50 bg-emerald-50"
                  : "border border-rosa/30 bg-rosa/5 hover:border-rosa hover:shadow-md hover:shadow-rosa/10"
            )}
            aria-label={
              isOutOfStock
                ? t("shop.outOfStock")
                : t("productDetail.addToCart")
            }
          >
            {/* Fill bar - sweeps left to right on click */}
            <motion.span
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-rosa to-rosa-dark"
              initial={{ width: "0%" }}
              animate={{ width: filling ? "100%" : "0%" }}
              transition={
                filling
                  ? { duration: 0.5, ease: "easeOut" }
                  : { duration: 0 }
              }
            />

            {/* Label */}
            <AnimatePresence mode="wait">
              {isOutOfStock ? (
                <motion.span
                  key="oos"
                  className="relative z-10 flex items-center justify-center gap-2 text-gray-400 text-xs"
                >
                  {t("shop.outOfStock")}
                </motion.span>
              ) : added ? (
                <motion.span
                  key="check"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="relative z-10 flex items-center justify-center gap-2 text-emerald-600"
                >
                  <Check className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "relative z-10 flex items-center justify-center gap-2 transition-colors duration-300",
                    filling
                      ? "text-white"
                      : "text-rosa-dark group-hover/btn:text-rosa-dark"
                  )}
                >
                  <ShoppingBag className="w-3 h-3" />
                  {t("productDetail.addToCart")}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

export default memo(ProductCard);
