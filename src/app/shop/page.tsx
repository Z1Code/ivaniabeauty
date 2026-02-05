"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import useFilters from "@/hooks/useFilters";
import Filters from "@/components/shared/Filters";
import SectionChips from "@/components/shop/SectionChips";
import ProductSection from "@/components/shop/ProductSection";
import { SECTIONS } from "@/app/shop/sections";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

type BilingualString = { en: string; es: string };
type BilingualArray = { en: string[]; es: string[] };

interface Product {
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
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

function SortDropdown() {
  const { t } = useTranslation();
  const { sortBy, setSortBy } = useFilters();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { label: t("filters.sortFeatured"), value: "featured" },
    { label: t("filters.sortPriceAsc"), value: "price-asc" },
    { label: t("filters.sortPriceDesc"), value: "price-desc" },
    { label: t("filters.sortTopRated"), value: "rating" },
    { label: t("filters.sortNewest"), value: "newest" },
  ];

  const currentLabel = sortOptions.find((o) => o.value === sortBy)?.label || sortOptions[0].label;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-rosa/40 transition-colors cursor-pointer shadow-sm"
      >
        <span className="text-gray-400 text-xs uppercase tracking-wide">{t("filters.sortHeading")}:</span>
        <span className="text-gray-800">{currentLabel}</span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30"
          >
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSortBy(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  sortBy === opt.value
                    ? "bg-rosa/10 text-rosa-dark"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopPage() {
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSections, setActiveSections] = useState<Set<string>>(
    () => new Set(SECTIONS.map((s) => s.id))
  );

  const toggleSection = useCallback((id: string) => {
    setActiveSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Don't allow deactivating the last one
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data: Product[] = await res.json();
      setAllProducts(data);
    } catch {
      const fallback = await import("@/data/products.json");
      setAllProducts(fallback.default as Product[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const {
    size,
    compression,
    color,
    sortBy,
  } = useFilters();

  const filteredProducts = useMemo(() => {
    let results = [...allProducts];

    if (size) {
      results = results.filter((p) => p.sizes.includes(size));
    }
    if (compression) {
      results = results.filter((p) => p.compression === compression);
    }
    if (color) {
      results = results.filter((p) => p.colors.includes(color));
    }

    switch (sortBy) {
      case "price-asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        results.sort((a, b) => {
          const badgePriority = (badge: BilingualString | null) =>
            badge?.en === "New" ? 0 : 1;
          return badgePriority(a.badge) - badgePriority(b.badge);
        });
        break;
      case "featured":
      default:
        results.sort((a, b) => {
          const badgePriority = (badge: BilingualString | null) => {
            if (badge?.en === "Bestseller") return 0;
            if (badge?.en === "Sale") return 1;
            if (badge?.en === "New") return 2;
            return 3;
          };
          return badgePriority(a.badge) - badgePriority(b.badge);
        });
        break;
    }

    return results;
  }, [allProducts, size, compression, color, sortBy]);

  const hasActiveFilters =
    size !== null ||
    compression !== null ||
    color !== null ||
    sortBy !== "featured";

  /* Partition filtered products by active sections */
  const sectionedProducts = useMemo(() => {
    return SECTIONS
      .filter((section) => activeSections.has(section.id))
      .map((section) => ({
        section,
        products: filteredProducts.filter((p) =>
          section.categories.includes(p.category)
        ),
      }));
  }, [filteredProducts, activeSections]);

  return (
    <main className="min-h-screen bg-perla">
      {/* Hero Banner */}
      <section className="pt-20 pb-10 bg-gradient-to-r from-rosa to-rosa-dark flex items-center justify-center relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />

        <div className="text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-4xl md:text-5xl text-white font-bold"
          >
            {t("shop.pageTitle")}
          </motion.h1>
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="mt-3 text-white/70 text-sm flex items-center justify-center gap-2"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white transition-colors">
              {t("shop.breadcrumbHome")}
            </Link>
            <span>/</span>
            <span className="text-white">{t("shop.breadcrumbShop")}</span>
          </motion.nav>
        </div>
      </section>

      {/* Shop Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-0 lg:gap-8">
          {/* Sidebar Filters (Desktop) */}
          <div className="hidden lg:block w-64 shrink-0 pr-8">
            <Filters isOpen={false} onClose={() => {}} />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Top Bar: Section Chips + Sort/Filter */}
            <div className="sticky top-16 z-20 bg-perla/95 backdrop-blur-sm -mx-4 px-4 py-4 mb-4">
              <div className="flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                  <SectionChips sections={SECTIONS} activeSections={activeSections} onToggle={toggleSection} />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Sort dropdown - desktop only */}
                  <div className="hidden lg:block">
                    <SortDropdown />
                  </div>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:border-rosa/40 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-rosa" />
                    {t("shop.filtersButton")}
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-rosa" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sections */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {sectionedProducts.map(({ section, products }) => (
                  <ProductSection
                    key={section.id}
                    section={section}
                    products={products}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <Filters isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} mobileOnly />
    </main>
  );
}
