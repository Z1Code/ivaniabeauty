"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, X } from "lucide-react";
import SectionChips from "@/components/shop/SectionChips";
import ProductSection from "@/components/shop/ProductSection";
import {
  SECTIONS,
  getSectionsByIds,
  parseShopSectionsSettings,
  SHOP_SECTIONS_STORAGE_KEY,
  SHOP_SECTIONS_UPDATED_EVENT,
  type SectionConfig,
} from "@/app/shop/sections";
import { useTranslation } from "@/hooks/useTranslation";
import { cn, getColorHex } from "@/lib/utils";
import { normalizeSizeList } from "@/lib/fit-guide/utils";

type BilingualString = { en: string; es: string };
type BilingualArray = { en: string[]; es: string[] };
type SortBy = "featured" | "price-asc" | "price-desc" | "rating" | "newest";
type CareFocus = "hair" | "body";
type CareFormat =
  | "duo"
  | "shampoo"
  | "conditioner"
  | "mask"
  | "scrub"
  | "oil"
  | "cream"
  | "other";

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

interface EnrichedProduct extends Product {
  careFocus: CareFocus;
  careFormat: CareFormat;
}

interface ShapewearFiltersState {
  size: string | null;
  compression: string | null;
  color: string | null;
}

interface CareFiltersState {
  focus: CareFocus | null;
  format: CareFormat | null;
}

const SHAPEWEAR_CATEGORIES = new Set(["fajas", "cinturillas", "tops", "shorts"]);
const COLOR_PRIORITY = ["cocoa", "negro", "beige", "brown", "rosado", "pink"];
const SORT_VALUES: SortBy[] = ["featured", "price-asc", "price-desc", "rating", "newest"];
const CARE_FOCUS_VALUES: CareFocus[] = ["hair", "body"];
const CARE_FORMAT_VALUES: CareFormat[] = [
  "duo",
  "shampoo",
  "conditioner",
  "mask",
  "scrub",
  "oil",
  "cream",
  "other",
];

function areSectionsEqual(a: SectionConfig[], b: SectionConfig[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((section, index) => section.id === b[index]?.id);
}

function getProductSearchText(product: Product): string {
  return `${product.slug} ${product.name.en} ${product.name.es}`.toLowerCase();
}

function inferCareFocus(product: Product): CareFocus {
  const text = getProductSearchText(product);
  const bodyKeywords = ["cream", "crema", "body", "corporal", "slim"];
  return bodyKeywords.some((keyword) => text.includes(keyword)) ? "body" : "hair";
}

function inferCareFormat(product: Product): CareFormat {
  const text = getProductSearchText(product);

  if (
    text.includes("shampoo") &&
    (text.includes("acondicionador") || text.includes("conditioner"))
  ) {
    return "duo";
  }
  if (text.includes("shampoo")) return "shampoo";
  if (text.includes("acondicionador") || text.includes("conditioner")) return "conditioner";
  if (text.includes("mascarilla") || text.includes("mask")) return "mask";
  if (text.includes("scrub")) return "scrub";
  if (text.includes("oil") || text.includes("aceite")) return "oil";
  if (text.includes("cream") || text.includes("crema")) return "cream";
  return "other";
}

function SortDropdown({
  sortBy,
  onChange,
}: {
  sortBy: SortBy;
  onChange: (value: SortBy) => void;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: Array<{ label: string; value: SortBy }> = [
    { label: t("filters.sortFeatured"), value: "featured" },
    { label: t("filters.sortPriceAsc"), value: "price-asc" },
    { label: t("filters.sortPriceDesc"), value: "price-desc" },
    { label: t("filters.sortTopRated"), value: "rating" },
    { label: t("filters.sortNewest"), value: "newest" },
  ];

  const currentLabel =
    sortOptions.find((option) => option.value === sortBy)?.label || sortOptions[0].label;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-rosa/40 transition-colors cursor-pointer shadow-sm"
      >
        <span className="text-gray-400 text-[10px] uppercase tracking-wide">
          {t("filters.sortHeading")}:
        </span>
        <span className="text-gray-800">{currentLabel}</span>
        <ChevronDown
          className={cn("w-3.5 h-3.5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-30"
          >
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                  sortBy === option.value ? "bg-rosa/10 text-rosa-dark" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShopPageContent() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState<SectionConfig[]>(SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0]?.id || "");
  const [sortBy, setSortBy] = useState<SortBy>("featured");
  const [shapewearFilters, setShapewearFilters] = useState<ShapewearFiltersState>({
    size: null,
    compression: null,
    color: null,
  });
  const [careFilters, setCareFilters] = useState<CareFiltersState>({
    focus: null,
    format: null,
  });

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
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncVisibleSections = () => {
      const parsed = parseShopSectionsSettings(
        window.localStorage.getItem(SHOP_SECTIONS_STORAGE_KEY)
      );
      const nextSections = getSectionsByIds(parsed.enabledSectionIds);
      setVisibleSections((prev) =>
        areSectionsEqual(prev, nextSections) ? prev : nextSections
      );
    };

    syncVisibleSections();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SHOP_SECTIONS_STORAGE_KEY) {
        syncVisibleSections();
      }
    };
    const handleSectionsUpdated = () => syncVisibleSections();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SHOP_SECTIONS_UPDATED_EVENT, handleSectionsUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SHOP_SECTIONS_UPDATED_EVENT, handleSectionsUpdated);
    };
  }, []);

  useEffect(() => {
    if (!visibleSections.length) return;

    setActiveSectionId((prev) =>
      visibleSections.some((section) => section.id === prev)
        ? prev
        : visibleSections[0].id
    );
  }, [visibleSections]);

  const enrichedProducts = useMemo<EnrichedProduct[]>(
    () =>
      allProducts.map((product) => ({
        ...product,
        careFocus: inferCareFocus(product),
        careFormat: inferCareFormat(product),
      })),
    [allProducts]
  );

  const sortedProducts = useMemo(() => {
    const results = [...enrichedProducts];

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
          const badgePriority = (badge: BilingualString | null) => (badge?.en === "New" ? 0 : 1);
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
  }, [enrichedProducts, sortBy]);

  const shapewearProducts = useMemo(
    () => sortedProducts.filter((product) => SHAPEWEAR_CATEGORIES.has(product.category)),
    [sortedProducts]
  );

  const careProducts = useMemo(
    () => sortedProducts.filter((product) => product.category === "cuidado"),
    [sortedProducts]
  );

  const sizeOptions = useMemo(
    () =>
      normalizeSizeList(
        shapewearProducts.flatMap((product) =>
          Array.isArray(product.sizes) ? product.sizes : []
        )
      ),
    [shapewearProducts]
  );

  const compressionOptions = useMemo(
    () =>
      [...new Set(shapewearProducts.map((product) => product.compression).filter(Boolean))].sort(),
    [shapewearProducts]
  );

  const colorOptions = useMemo(() => {
    const uniqueColors = [...new Set(shapewearProducts.flatMap((product) => product.colors || []))];
    return uniqueColors.sort((a, b) => {
      const priorityA = COLOR_PRIORITY.indexOf(a);
      const priorityB = COLOR_PRIORITY.indexOf(b);
      if (priorityA === -1 && priorityB === -1) return a.localeCompare(b);
      if (priorityA === -1) return 1;
      if (priorityB === -1) return -1;
      return priorityA - priorityB;
    });
  }, [shapewearProducts]);

  const careFocusOptions = useMemo(
    () => [...new Set(careProducts.map((product) => product.careFocus))],
    [careProducts]
  );

  const careFormatOptions = useMemo(
    () => [...new Set(careProducts.map((product) => product.careFormat))],
    [careProducts]
  );

  const sectionedProducts = useMemo(() => {
    return visibleSections.map((section) => {
      let products = sortedProducts.filter((product) => section.categories.includes(product.category));

      if (section.id === "shampoo-fragrance") {
        if (careFilters.focus) {
          products = products.filter((product) => product.careFocus === careFilters.focus);
        }
        if (careFilters.format) {
          products = products.filter((product) => product.careFormat === careFilters.format);
        }
      } else {
        if (shapewearFilters.size) {
          products = products.filter((product) => product.sizes?.includes(shapewearFilters.size as string));
        }
        if (shapewearFilters.compression) {
          products = products.filter((product) => product.compression === shapewearFilters.compression);
        }
        if (shapewearFilters.color) {
          products = products.filter((product) => product.colors?.includes(shapewearFilters.color as string));
        }
      }

      return { section, products };
    });
  }, [sortedProducts, careFilters.focus, careFilters.format, shapewearFilters.size, shapewearFilters.compression, shapewearFilters.color, visibleSections]);

  const totalVisibleProducts = useMemo(
    () => sectionedProducts.reduce((acc, group) => acc + group.products.length, 0),
    [sectionedProducts]
  );

  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (
      sectionParam &&
      visibleSections.some((section) => section.id === sectionParam)
    ) {
      setActiveSectionId((prev) => (prev === sectionParam ? prev : sectionParam));
    }

    const sortParam = searchParams.get("sort");
    const parsedSort: SortBy =
      sortParam && SORT_VALUES.includes(sortParam as SortBy)
        ? (sortParam as SortBy)
        : "featured";
    setSortBy((prev) => (prev === parsedSort ? prev : parsedSort));

    const parsedShapeFilters: ShapewearFiltersState = {
      size: searchParams.get("size"),
      compression: searchParams.get("compression"),
      color: searchParams.get("color"),
    };
    setShapewearFilters((prev) =>
      prev.size === parsedShapeFilters.size &&
      prev.compression === parsedShapeFilters.compression &&
      prev.color === parsedShapeFilters.color
        ? prev
        : parsedShapeFilters
    );

    const focusParam = searchParams.get("focus");
    const formatParam = searchParams.get("format");
    const parsedCareFilters: CareFiltersState = {
      focus:
        focusParam && CARE_FOCUS_VALUES.includes(focusParam as CareFocus)
          ? (focusParam as CareFocus)
          : null,
      format:
        formatParam && CARE_FORMAT_VALUES.includes(formatParam as CareFormat)
          ? (formatParam as CareFormat)
          : null,
    };
    setCareFilters((prev) =>
      prev.focus === parsedCareFilters.focus && prev.format === parsedCareFilters.format
        ? prev
        : parsedCareFilters
    );
  }, [searchParams, visibleSections]);

  useEffect(() => {
    if (isLoading) return;

    const elements = visibleSections.map((section) => document.getElementById(section.id)).filter(
      (element): element is HTMLElement => Boolean(element)
    );
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (!visibleEntries.length) return;

        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const nextSectionId = visibleEntries[0].target.id;
        setActiveSectionId((prev) => (prev === nextSectionId ? prev : nextSectionId));
      },
      {
        rootMargin: "-26% 0px -45% 0px",
        threshold: [0.15, 0.3, 0.5, 0.75],
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [isLoading, visibleSections]);

  const activeSection =
    visibleSections.find((section) => section.id === activeSectionId) ||
    visibleSections[0];
  const isCareSection = Boolean(activeSection?.categories.includes("cuidado"));

  useEffect(() => {
    if (
      !activeSectionId ||
      !visibleSections.some((section) => section.id === activeSectionId)
    ) {
      return;
    }

    const nextParams = new URLSearchParams();
    nextParams.set("section", activeSectionId);

    if (sortBy !== "featured") {
      nextParams.set("sort", sortBy);
    }

    if (isCareSection) {
      if (careFilters.focus) {
        nextParams.set("focus", careFilters.focus);
      }
      if (careFilters.format) {
        nextParams.set("format", careFilters.format);
      }
    } else {
      if (shapewearFilters.size) {
        nextParams.set("size", shapewearFilters.size);
      }
      if (shapewearFilters.compression) {
        nextParams.set("compression", shapewearFilters.compression);
      }
      if (shapewearFilters.color) {
        nextParams.set("color", shapewearFilters.color);
      }
    }

    const nextQueryString = nextParams.toString();
    if (nextQueryString === currentQueryString) return;

    const href = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(href, { scroll: false });
  }, [
    activeSectionId,
    careFilters.focus,
    careFilters.format,
    currentQueryString,
    isCareSection,
    pathname,
    router,
    shapewearFilters.color,
    shapewearFilters.compression,
    shapewearFilters.size,
    sortBy,
    visibleSections,
  ]);

  const activeContextualFilterCount = useMemo(() => {
    const baseCount =
      (isCareSection
        ? Number(Boolean(careFilters.focus)) + Number(Boolean(careFilters.format))
        : Number(Boolean(shapewearFilters.size)) +
          Number(Boolean(shapewearFilters.compression)) +
          Number(Boolean(shapewearFilters.color)));
    return baseCount;
  }, [careFilters.focus, careFilters.format, isCareSection, shapewearFilters.color, shapewearFilters.compression, shapewearFilters.size]);

  const clearActiveFilters = useCallback(() => {
    if (isCareSection) {
      setCareFilters({ focus: null, format: null });
      return;
    }
    setShapewearFilters({ size: null, compression: null, color: null });
  }, [isCareSection]);

  const handleSelectSection = useCallback(
    (id: string) => {
      if (!visibleSections.some((section) => section.id === id)) return;

      setActiveSectionId(id);
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [visibleSections]
  );

  const careFocusLabel = useCallback(
    (focus: CareFocus) => {
      if (focus === "hair") return language === "es" ? "Cabello" : "Hair";
      return language === "es" ? "Cuerpo" : "Body";
    },
    [language]
  );

  const careFormatLabel = useCallback(
    (format: CareFormat) => {
      const labelsEs: Record<CareFormat, string> = {
        duo: "Duo Shampoo + Acond.",
        shampoo: "Shampoo",
        conditioner: "Acondicionador",
        mask: "Mascarilla",
        scrub: "Scrub",
        oil: "Aceite",
        cream: "Crema",
        other: "Otros",
      };
      const labelsEn: Record<CareFormat, string> = {
        duo: "Shampoo + Cond. Duo",
        shampoo: "Shampoo",
        conditioner: "Conditioner",
        mask: "Mask",
        scrub: "Scrub",
        oil: "Oil",
        cream: "Cream",
        other: "Other",
      };
      return language === "es" ? labelsEs[format] : labelsEn[format];
    },
    [language]
  );

  const renderContextualFiltersCard = () => (
    <div className="rounded-xl border border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] px-3 py-3">
      <div className="mb-3.5">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
          {language === "es" ? "Secciones visibles" : "Visible sections"}
        </p>
        <div className="space-y-2">
          {visibleSections.map((section) => {
            const isActive = activeSectionId === section.id;
            return (
              <button
                key={section.id}
                onClick={() => handleSelectSection(section.id)}
                className={cn(
                  "w-full text-left rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all cursor-pointer border",
                  isActive
                    ? "bg-rosa/10 text-rosa-dark border-rosa/30"
                    : "bg-white text-gray-700 border-gray-200 hover:border-rosa/40"
                )}
              >
                {t(section.titleKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-start justify-between gap-2.5 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Sparkles className="w-3 h-3 text-rosa" />
          <span>
            {language === "es"
              ? `Filtros contextuales: ${activeSection ? t(activeSection.titleKey) : ""}`
              : `Contextual filters: ${activeSection ? t(activeSection.titleKey) : ""}`}
          </span>
        </div>

        {activeContextualFilterCount > 0 && (
          <button
            onClick={clearActiveFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rosa/10 text-rosa-dark text-[11px] font-semibold hover:bg-rosa/20 transition-colors cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
            {t("filters.clearFilters")}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={isCareSection ? "care" : "shapewear"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="grid gap-3 mt-3"
        >
          {isCareSection ? (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  {language === "es" ? "Enfoque" : "Focus"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {careFocusOptions.map((focus) => (
                    <button
                      key={focus}
                      onClick={() =>
                        setCareFilters((prev) => ({
                          ...prev,
                          focus: prev.focus === focus ? null : focus,
                        }))
                      }
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all cursor-pointer",
                        careFilters.focus === focus
                          ? "bg-turquesa text-white shadow-md"
                          : "bg-turquesa/10 text-gray-700 hover:bg-turquesa/20"
                      )}
                    >
                      {careFocusLabel(focus)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  {language === "es" ? "Tipo de producto" : "Product type"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {careFormatOptions.map((format) => (
                    <button
                      key={format}
                      onClick={() =>
                        setCareFilters((prev) => ({
                          ...prev,
                          format: prev.format === format ? null : format,
                        }))
                      }
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all cursor-pointer",
                        careFilters.format === format
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      )}
                    >
                      {careFormatLabel(format)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  {t("filters.sizeHeading")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setShapewearFilters((prev) => ({
                          ...prev,
                          size: prev.size === size ? null : size,
                        }))
                      }
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-all cursor-pointer min-w-[38px]",
                        shapewearFilters.size === size
                          ? "bg-rosa text-white shadow-md"
                          : "bg-rosa-light/30 text-gray-700 hover:bg-rosa-light/50"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  {t("filters.compressionHeading")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {compressionOptions.map((compression) => (
                    <button
                      key={compression}
                      onClick={() =>
                        setShapewearFilters((prev) => ({
                          ...prev,
                          compression: prev.compression === compression ? null : compression,
                        }))
                      }
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all cursor-pointer",
                        shapewearFilters.compression === compression
                          ? "bg-rosa text-white shadow-md"
                          : "bg-white border border-gray-200 text-gray-700 hover:border-rosa/40"
                      )}
                    >
                      {compression === "suave"
                        ? t("filters.compressionSoft")
                        : compression === "media"
                          ? t("filters.compressionMedium")
                          : t("filters.compressionFirm")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  {t("filters.colorHeading")}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        setShapewearFilters((prev) => ({
                          ...prev,
                          color: prev.color === color ? null : color,
                        }))
                      }
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all cursor-pointer",
                        shapewearFilters.color === color
                          ? "ring-2 ring-rosa ring-offset-2 border-rosa scale-110"
                          : "border-gray-200 hover:scale-110"
                      )}
                      style={{ backgroundColor: getColorHex(color) }}
                      aria-label={`${t("filters.colorAriaLabel")} ${color}`}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <main className="min-h-screen bg-perla">
      {/* Hero Banner */}
      <section className="pt-28 pb-8 bg-perla flex items-center justify-center">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-3xl md:text-4xl text-rosa-dark font-bold"
          >
            {t("shop.pageTitle")}
          </motion.h1>
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="mt-2 text-gray-500 text-xs flex items-center justify-center gap-2"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-rosa transition-colors">
              {t("shop.breadcrumbHome")}
            </Link>
            <span>/</span>
            <span className="text-rosa-dark">{t("shop.breadcrumbShop")}</span>
          </motion.nav>
        </div>
      </section>

      {/* Shop Content */}
      <div className="max-w-[86rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:flex lg:items-start lg:gap-4">
          <aside className="hidden lg:block lg:w-56 lg:flex-none">
            <div className="sticky top-20">
              {renderContextualFiltersCard()}
            </div>
          </aside>

          <div className="min-w-0 flex-1 lg:max-w-[66rem]">
            <div className="sticky top-16 z-30 mb-4">
              <div className="rounded-xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_32px_rgba(0,0,0,0.08)] px-3 py-3">
                {/* Mobile: 2-col grid with sort below */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-2 gap-1.5">
                    {visibleSections.map((section) => {
                      const isActive = activeSectionId === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => handleSelectSection(section.id)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 cursor-pointer text-center",
                            isActive
                              ? "bg-rosa text-white shadow-md shadow-rosa/20"
                              : "bg-white text-gray-600 border border-gray-200 hover:border-rosa/40 hover:text-rosa-dark"
                          )}
                        >
                          {t(section.titleKey)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-center mt-2">
                    <SortDropdown sortBy={sortBy} onChange={setSortBy} />
                  </div>
                </div>

                {/* Desktop: sort only (sections in sidebar) */}
                <div className="hidden lg:flex items-center justify-end">
                  <SortDropdown sortBy={sortBy} onChange={setSortBy} />
                </div>
              </div>
            </div>

            <div className="mb-4 lg:hidden">
              {renderContextualFiltersCard()}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {sectionedProducts.map(({ section, products }) => (
                  <ProductSection
                    key={section.id}
                    section={section}
                    products={products}
                    isActive={activeSectionId === section.id}
                  />
                ))}
              </div>
            )}

            {!isLoading && totalVisibleProducts === 0 && (
              <div className="mt-8 rounded-xl border border-rosa/20 bg-white p-6 text-center">
                <p className="text-base font-semibold text-gray-800 mb-1.5">{t("shop.emptyStateHeading")}</p>
                <p className="text-xs text-gray-500 mb-4">{t("shop.emptyStateText")}</p>
                <button
                  onClick={() => {
                    setShapewearFilters({ size: null, compression: null, color: null });
                    setCareFilters({ focus: null, format: null });
                    setSortBy("featured");
                  }}
                  className="px-4 py-2 rounded-full bg-rosa text-white font-semibold text-xs hover:bg-rosa-dark transition-colors cursor-pointer"
                >
                  {t("shop.clearFiltersButton")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <React.Suspense
      fallback={
        <main className="min-h-screen bg-perla flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ShopPageContent />
    </React.Suspense>
  );
}
