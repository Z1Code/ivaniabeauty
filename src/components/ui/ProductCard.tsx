"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Eye } from "lucide-react";
import { formatPrice, getColorHex, cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  badge?: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
  colors: string[];
  category: string;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

const badgeStyles: Record<string, string> = {
  Bestseller: "bg-rosa",
  Nuevo: "bg-turquesa",
  Oferta: "bg-dorado",
};

export default function ProductCard({ product, className }: ProductCardProps) {
  const {
    name,
    slug,
    price,
    originalPrice,
    badge,
    rating,
    reviewCount,
    colors,
  } = product;

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("group relative", className)}
    >
      <Link href={`/shop/${slug}`} className="block">
        <div className="rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
          {/* Image Area */}
          <div className="relative aspect-[3/4] overflow-hidden">
            {/* Gradient placeholder */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-rosa-light to-rosa/30"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            {/* Badge */}
            {badge && (
              <span
                className={cn(
                  "absolute top-3 left-3 z-10 px-3 py-1 text-xs font-semibold text-white rounded-full",
                  badgeStyles[badge] || "bg-rosa"
                )}
              >
                {badge}
              </span>
            )}

            {/* Quick view button */}
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-rosa-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:bg-white"
              aria-label="Vista rapida"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Eye className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-2">
            {/* Product Name */}
            <h3 className="font-serif text-base font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-rosa-dark transition-colors">
              {name}
            </h3>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-rosa-dark">
                {formatPrice(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {Array.from({ length: fullStars }).map((_, i) => (
                  <Star
                    key={`full-${i}`}
                    className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
                {hasHalfStar && (
                  <Star
                    key="half"
                    className="w-3.5 h-3.5 fill-yellow-400/50 text-yellow-400"
                  />
                )}
                {Array.from({ length: emptyStars }).map((_, i) => (
                  <Star
                    key={`empty-${i}`}
                    className="w-3.5 h-3.5 fill-transparent text-gray-300"
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({reviewCount})</span>
            </div>

            {/* Color dots */}
            {colors.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                {colors.map((color) => (
                  <span
                    key={color}
                    className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: getColorHex(color) }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
