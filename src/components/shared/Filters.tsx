"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import useFilters from "@/hooks/useFilters";
import { getColorHex, cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface FiltersProps {
  isOpen: boolean;
  onClose: () => void;
  mobileOnly?: boolean;
}

const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const colorOptions = ["cocoa", "negro", "beige", "brown", "rosado", "pink"];

function FilterContent({ showSort = false }: { showSort?: boolean }) {
  const { t } = useTranslation();
  const {
    category,
    size,
    compression,
    color,
    sortBy,
    setCategory,
    setSize,
    setCompression,
    setColor,
    setSortBy,
    clearFilters,
  } = useFilters();

  const categories = [
    { label: t("filters.categoryAll"), value: null },
    { label: t("filters.categoryFajas"), value: "fajas" },
    { label: t("filters.categoryCinturillas"), value: "cinturillas" },
    { label: t("filters.categoryTops"), value: "tops" },
    { label: t("filters.categoryShorts"), value: "shorts" },
    { label: t("filters.categoryCuidado"), value: "cuidado" },
  ];

  const compressions = [
    { label: t("filters.compressionSoft"), value: "suave" },
    { label: t("filters.compressionMedium"), value: "media" },
    { label: t("filters.compressionFirm"), value: "firme" },
  ];

  const sortOptions = [
    { label: t("filters.sortFeatured"), value: "featured" },
    { label: t("filters.sortPriceAsc"), value: "price-asc" },
    { label: t("filters.sortPriceDesc"), value: "price-desc" },
    { label: t("filters.sortTopRated"), value: "rating" },
    { label: t("filters.sortNewest"), value: "newest" },
  ];

  const hasActiveFilters =
    category !== null ||
    size !== null ||
    compression !== null ||
    color !== null;

  return (
    <div className="space-y-0">
      {/* Category */}
      <div className="border-b border-rosa-light/30 pb-4 mb-3">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          {t("filters.categoryHeading")}
        </h4>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                category === cat.value
                  ? "bg-rosa text-white shadow-md"
                  : "bg-rosa-light/30 text-gray-700 hover:bg-rosa-light/50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters - right below category */}
      {hasActiveFilters && (
        <div className="pb-4 mb-3 border-b border-rosa-light/30">
          <button
            onClick={clearFilters}
            className="text-rosa text-sm font-medium hover:text-rosa-dark transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            {t("filters.clearFilters")}
          </button>
        </div>
      )}

      {/* Size */}
      <div className="border-b border-rosa-light/30 pb-4 mb-4">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          {t("filters.sizeHeading")}
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(size === s ? null : s)}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition-all duration-200 cursor-pointer text-center",
                size === s
                  ? "bg-rosa text-white ring-2 ring-rosa shadow-md"
                  : "bg-rosa-light/30 text-gray-700 hover:bg-rosa-light/50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Compression */}
      <div className="border-b border-rosa-light/30 pb-4 mb-4">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          {t("filters.compressionHeading")}
        </h4>
        <div className="flex flex-wrap gap-2">
          {compressions.map((comp) => (
            <button
              key={comp.value}
              onClick={() =>
                setCompression(compression === comp.value ? null : comp.value)
              }
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                compression === comp.value
                  ? "bg-rosa text-white shadow-md"
                  : "bg-rosa-light/30 text-gray-700 hover:bg-rosa-light/50"
              )}
            >
              {comp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className={cn(showSort ? "border-b border-rosa-light/30 pb-4 mb-4" : "pb-2")}>
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          {t("filters.colorHeading")}
        </h4>
        <div className="flex flex-wrap gap-3">
          {colorOptions.map((c) => (
            <button
              key={c}
              onClick={() => setColor(color === c ? null : c)}
              className={cn(
                "w-8 h-8 rounded-full transition-all duration-200 cursor-pointer border-2 flex-shrink-0",
                color === c
                  ? "ring-2 ring-rosa ring-offset-2 border-rosa scale-110"
                  : "border-gray-200 hover:scale-110"
              )}
              style={{ backgroundColor: getColorHex(c) }}
              title={c.charAt(0).toUpperCase() + c.slice(1)}
              aria-label={`${t("filters.colorAriaLabel")} ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Sort by - only shown in mobile filter sheet */}
      {showSort && (
        <div className="pb-2">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
            {t("filters.sortHeading")}
          </h4>
          <div className="flex flex-col gap-1.5">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={cn(
                  "text-left rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                  sortBy === opt.value
                    ? "bg-rosa text-white"
                    : "text-gray-700 hover:bg-rosa-light/30"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Filters({ isOpen, onClose, mobileOnly = false }: FiltersProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* Desktop Sidebar - always visible on lg+ */}
      {!mobileOnly && (
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <h3 className="font-serif text-lg font-semibold text-gray-800 mb-6">
              {t("filters.heading")}
            </h3>
            <FilterContent showSort={false} />
          </div>
        </aside>
      )}

      {/* Mobile Bottom Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto p-6 z-50 lg:hidden"
            >
              {/* Drag Handle */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label={t("filters.closeFiltersAriaLabel")}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title */}
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-6">
                {t("filters.heading")}
              </h3>

              <FilterContent showSort />

              {/* Apply button for mobile */}
              <div className="mt-6 pt-4 border-t border-rosa-light/30">
                <button
                  onClick={onClose}
                  className="w-full bg-rosa text-white rounded-full py-3 font-semibold text-sm hover:bg-rosa-dark transition-colors cursor-pointer"
                >
                  {t("filters.applyFilters")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
