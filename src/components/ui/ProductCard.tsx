"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
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
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

const badgeStyles: Record<string, string> = {
  Bestseller: "bg-rosa",
  New: "bg-turquesa",
  Nuevo: "bg-turquesa",
  Sale: "bg-dorado",
  Oferta: "bg-dorado",
};

export default function ProductCard({ product, className }: ProductCardProps) {
  const { t, language } = useTranslation();
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const {
    slug,
    price,
    originalPrice,
    badge,
    colors,
  } = product;

  const name = getLocalizedField(product.name, language);
  const localBadge = getLocalizedField(badge, language);

  const [filling, setFilling] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (filling || added) return;

    setFilling(true);

    // After the fill animation completes, add to cart
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

      // Show checkmark briefly, then open cart
      setTimeout(() => {
        openCart();
        setAdded(false);
      }, 600);
    }, 500);
  }, [filling, added, addItem, openCart, product, name, colors]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("group", className)}
    >
      <div className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100/60">
        {/* Image Area */}
        <Link href={`/shop/${slug}`} className="block flex-shrink-0">
          <div className="relative aspect-[3/4] bg-[#f7f3ef] overflow-hidden">
            {/* Badge */}
            {localBadge && (
              <span
                className={cn(
                  "absolute top-3 left-3 z-10 px-3 py-1 text-[11px] font-semibold text-white rounded-full tracking-wide uppercase",
                  badgeStyles[localBadge] || "bg-rosa"
                )}
              >
                {localBadge}
              </span>
            )}

            {/* Discount percentage */}
            {originalPrice && originalPrice > price && (
              <span className="absolute top-3 right-3 z-10 px-2 py-1 text-[11px] font-bold text-white bg-rosa-dark/90 rounded-full">
                -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
              </span>
            )}

            {/* Product image */}
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rosa-light/20 to-arena">
                <ShoppingBag className="w-12 h-12 text-rosa-light/60" />
              </div>
            )}
          </div>
        </Link>

        {/* Info + Cart Button */}
        <div className="p-4 flex flex-col flex-1">
          <Link href={`/shop/${slug}`} className="block flex-1 mb-3">
            <h3 className="font-serif text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-rosa-dark transition-colors">
              {name}
            </h3>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-base font-bold text-gray-900">
                {formatPrice(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </Link>

          {/* Add to Cart - Horizontal fill on press */}
          <motion.button
            onClick={handleAddToCart}
            animate={filling ? { scale: 0.95 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            whileTap={!filling && !added ? { scale: 0.93 } : undefined}
            className={cn(
              "group/btn relative w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer overflow-hidden transition-all duration-300",
              added
                ? "border border-emerald-400/50 bg-emerald-50"
                : "border border-rosa/30 bg-rosa/5 hover:border-rosa hover:shadow-md hover:shadow-rosa/15"
            )}
          >
            {/* Fill bar - sweeps left to right on click */}
            <motion.span
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-rosa to-rosa-dark"
              initial={{ width: "0%" }}
              animate={{ width: filling ? "100%" : "0%" }}
              transition={filling ? { duration: 0.5, ease: "easeOut" } : { duration: 0 }}
            />

            {/* Label */}
            <AnimatePresence mode="wait">
              {added ? (
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
                    filling ? "text-white" : "text-rosa-dark group-hover/btn:text-rosa-dark"
                  )}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {t("productDetail.addToCart")}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
