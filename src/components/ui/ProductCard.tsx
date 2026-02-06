"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShoppingBag, Check, Star, Eye } from "lucide-react";
import { formatPrice, cn, getColorHex } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { getLocalizedField } from "@/lib/productHelpers";
import useCart from "@/hooks/useCart";
import {
  CARD_BACKGROUND_SETTINGS_STORAGE_KEY,
  CARD_BACKGROUND_SETTINGS_UPDATED_EVENT,
  DEFAULT_CARD_BACKGROUND_SETTINGS,
  resolveCardPresetBackground,
  sanitizeCardBackgroundSettings,
  type CardBackgroundPreset,
  type CardBackgroundSettings,
} from "@/lib/card-background-settings";

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

const STUDY_MODE_INTERVAL_MS = 2600;
const STUDY_MODE_MANUAL_LOCK_MS = 8500;
const FALLBACK_CARD_BACKGROUND_SETTINGS = sanitizeCardBackgroundSettings(
  DEFAULT_CARD_BACKGROUND_SETTINGS
);

function readCardBackgroundSettingsFromStorage(): CardBackgroundSettings {
  if (typeof window === "undefined") {
    return FALLBACK_CARD_BACKGROUND_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(CARD_BACKGROUND_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return FALLBACK_CARD_BACKGROUND_SETTINGS;
    }
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeCardBackgroundSettings(parsed);
  } catch {
    return FALLBACK_CARD_BACKGROUND_SETTINGS;
  }
}

function getPresetSurfaceStyle(preset: CardBackgroundPreset): React.CSSProperties {
  const resolved = resolveCardPresetBackground(preset);
  if (resolved.backgroundImage) {
    return {
      backgroundImage: resolved.backgroundImage,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundColor: "#f3f4f6",
    };
  }
  if (resolved.background) {
    return {
      background: resolved.background,
    };
  }
  return {
    background: "#f3f4f6",
  };
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { t, language } = useTranslation();
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const prefersReducedMotion = useReducedMotion();
  const { slug, price, originalPrice, badge, colors } = product;
  const primaryImage = product.images[0] || "";
  const aiAngleImages = useMemo(
    () => product.images.filter((url) => url.includes("/products/generated/")),
    [product.images]
  );
  const imageSequence = aiAngleImages.length > 0 ? aiAngleImages : [primaryImage].filter(Boolean);

  const name = getLocalizedField(product.name, language);
  const localBadge = getLocalizedField(badge, language);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cardBackgroundSettings, setCardBackgroundSettings] =
    useState<CardBackgroundSettings>(FALLBACK_CARD_BACKGROUND_SETTINGS);
  const [manualBackgroundPresetId, setManualBackgroundPresetId] = useState<string | null>(
    null
  );
  const normalizedImageIndex = imageSequence.length
    ? activeImageIndex % imageSequence.length
    : 0;
  const currentImage = imageSequence[normalizedImageIndex] || primaryImage;
  const isAiGeneratedImage = currentImage.includes("/products/generated/");
  const supportsAngleCycling = imageSequence.length > 1;
  const studyModeAutoplayEnabled =
    supportsAngleCycling && isAiGeneratedImage && !prefersReducedMotion;

  const [filling, setFilling] = useState(false);
  const [added, setAdded] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});
  const isCurrentImageFailed = Boolean(currentImage && failedImages[currentImage]);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [manualLockUntilTs, setManualLockUntilTs] = useState(0);

  const effectiveBackgroundSettings = useMemo(
    () => sanitizeCardBackgroundSettings(cardBackgroundSettings),
    [cardBackgroundSettings]
  );
  const availableBackgroundPresets = useMemo(() => {
    const source = effectiveBackgroundSettings.enabled
      ? effectiveBackgroundSettings.presets
      : FALLBACK_CARD_BACKGROUND_SETTINGS.presets;
    return source.length ? source : FALLBACK_CARD_BACKGROUND_SETTINGS.presets;
  }, [effectiveBackgroundSettings]);
  const effectiveDefaultPresetId = effectiveBackgroundSettings.enabled
    ? effectiveBackgroundSettings.defaultPresetId
    : FALLBACK_CARD_BACKGROUND_SETTINGS.defaultPresetId;
  const activeBackgroundPreset = useMemo(() => {
    if (manualBackgroundPresetId && effectiveBackgroundSettings.enabled) {
      const manualPreset =
        availableBackgroundPresets.find(
          (preset) => preset.id === manualBackgroundPresetId
        ) || null;
      if (manualPreset) return manualPreset;
    }
    const byDefault =
      availableBackgroundPresets.find(
        (preset) => preset.id === effectiveDefaultPresetId
      ) || null;
    return byDefault || availableBackgroundPresets[0] || null;
  }, [
    availableBackgroundPresets,
    effectiveBackgroundSettings.enabled,
    manualBackgroundPresetId,
    effectiveDefaultPresetId,
  ]);
  const cardBackgroundStyle = useMemo(() => {
    if (!isAiGeneratedImage) return undefined;
    if (!activeBackgroundPreset) return undefined;
    return getPresetSurfaceStyle(activeBackgroundPreset);
  }, [isAiGeneratedImage, activeBackgroundPreset]);
  const showPerCardBackgroundSelector =
    isAiGeneratedImage &&
    effectiveBackgroundSettings.enabled &&
    effectiveBackgroundSettings.allowPerCardSelector &&
    availableBackgroundPresets.length > 1;

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

  const getNextValidImageIndex = useCallback(
    (fromIndex: number): number => {
      if (!imageSequence.length) return 0;
      for (let step = 1; step <= imageSequence.length; step += 1) {
        const candidate = (fromIndex + step) % imageSequence.length;
        const candidateUrl = imageSequence[candidate];
        if (!failedImages[candidateUrl]) {
          return candidate;
        }
      }
      return fromIndex % imageSequence.length;
    },
    [imageSequence, failedImages]
  );

  const lockManualControl = useCallback(() => {
    setManualLockUntilTs(Date.now() + STUDY_MODE_MANUAL_LOCK_MS);
  }, []);

  const handleImageAreaClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!supportsAngleCycling) return;
      e.preventDefault();
      lockManualControl();
      setActiveImageIndex((prev) => getNextValidImageIndex(prev));
    },
    [supportsAngleCycling, lockManualControl, getNextValidImageIndex]
  );

  useEffect(() => {
    if (!studyModeAutoplayEnabled) return;

    const timer = window.setInterval(() => {
      if (isImageHovered) return;
      if (Date.now() < manualLockUntilTs) return;
      setActiveImageIndex((prev) => getNextValidImageIndex(prev));
    }, STUDY_MODE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    studyModeAutoplayEnabled,
    isImageHovered,
    manualLockUntilTs,
    getNextValidImageIndex,
  ]);

  useEffect(() => {
    const syncSettings = () => {
      setCardBackgroundSettings(readCardBackgroundSettingsFromStorage());
    };

    syncSettings();
    window.addEventListener(CARD_BACKGROUND_SETTINGS_UPDATED_EVENT, syncSettings);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CARD_BACKGROUND_SETTINGS_STORAGE_KEY) {
        syncSettings();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        CARD_BACKGROUND_SETTINGS_UPDATED_EVENT,
        syncSettings
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

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
          tabIndex={-1}
          onClick={handleImageAreaClick}
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
          onTouchStart={() => lockManualControl()}
        >
          <div
            className={cn(
              "relative aspect-[3/4] overflow-hidden",
              isAiGeneratedImage
                ? "bg-white"
                : "bg-[#f9f7f5]"
            )}
            style={isAiGeneratedImage ? cardBackgroundStyle : undefined}
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
                  {t("shop.outOfStock") || "Agotado"}
                </span>
              </div>
            )}

            {/* Product image */}
            {currentImage && !isCurrentImageFailed ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={currentImage}
                  src={currentImage}
                  alt={name}
                  className={cn(
                    "absolute inset-0 w-full h-full transition-transform duration-700 ease-out will-change-transform",
                    isAiGeneratedImage
                      ? "object-contain p-1.5 group-hover:scale-[1.01]"
                      : "object-cover group-hover:scale-[1.06]"
                  )}
                  loading="lazy"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, scale: 1.035, x: 6 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, scale: 1, x: 0 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0.8 }
                      : { opacity: 0, scale: 0.985, x: -6 }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.12 }
                      : { duration: 0.48, ease: [0.22, 0.61, 0.36, 1] }
                  }
                  onError={() =>
                    setFailedImages((prev) => ({
                      ...prev,
                      [currentImage]: true,
                    }))
                  }
                />
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-rosa-light/40" />
              </div>
            )}

            {supportsAngleCycling && (
              <span className="absolute left-2 bottom-2 z-10 px-2 py-1 rounded-full bg-white/90 text-[9px] font-semibold text-gray-700 shadow-sm border border-gray-100">
                {studyModeAutoplayEnabled
                  ? isImageHovered
                    ? "Modo estudio: en pausa"
                    : "Modo estudio: activo"
                  : "Click: cambiar angulo"}
              </span>
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
                {t("shop.quickView") || "Ver detalle"}
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
                />
              ))}
              {colors.length > 4 && (
                <span className="text-[9px] text-gray-400 font-medium ml-0.5">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          )}

          {supportsAngleCycling && (
            <div className="flex items-center gap-1.5 pt-1">
              {imageSequence.slice(0, 8).map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    lockManualControl();
                    setActiveImageIndex(idx);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all cursor-pointer border",
                    idx === activeImageIndex
                      ? "bg-gray-800 border-gray-800 scale-110"
                      : "bg-gray-300 border-gray-300 hover:bg-gray-500 hover:border-gray-500"
                  )}
                  aria-label={`Ver angulo ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {showPerCardBackgroundSelector && (
            <div className="flex items-center gap-1.5 pt-1">
              {availableBackgroundPresets.slice(0, 8).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setManualBackgroundPresetId(preset.id);
                  }}
                  className={cn(
                    "w-3 h-3 rounded-full border cursor-pointer transition-all",
                    preset.id === activeBackgroundPreset?.id
                      ? "border-gray-700 ring-1 ring-gray-500 ring-offset-1"
                      : "border-gray-200 hover:border-gray-400"
                  )}
                  style={getPresetSurfaceStyle(preset)}
                  aria-label={`Fondo ${preset.label}`}
                />
              ))}
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
                ? t("shop.outOfStock") || "Agotado"
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
                  {t("shop.outOfStock") || "Agotado"}
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
