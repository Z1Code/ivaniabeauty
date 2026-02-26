"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, ArrowRight } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useTranslation } from "@/hooks/useTranslation";

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t, language } = useTranslation();

  const {
    results,
    isLoading,
    query,
    setQuery,
    recentSearches,
    addRecent,
    clearRecent,
    categories,
    categoryFilter,
    setCategoryFilter,
  } = useSearch();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setCategoryFilter(null);
    setActiveIndex(-1);
  }, [setQuery, setCategoryFilter]);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let the animation start
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Navigate to product
  const navigateTo = useCallback(
    (slug: string, term?: string) => {
      if (term) addRecent(term);
      close();
      router.push(`/shop/${slug}`);
    },
    [addRecent, close, router]
  );

  // Keyboard navigation inside modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        navigateTo(results[activeIndex].slug, query);
      }
    },
    [close, results, activeIndex, navigateTo, query]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-search-item]");
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const getName = (product: { nameEn: string; nameEs: string }) =>
    language === "es" ? product.nameEs : product.nameEn;

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-rosa-light/60 text-rosa-dark rounded px-0.5">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  // Expose open function globally for header button
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__openSearch = open;
    return () => {
      delete (window as unknown as Record<string, unknown>).__openSearch;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal content */}
          <motion.div
            className="relative mx-auto mt-[10vh] w-full max-w-2xl max-h-[75vh] flex flex-col bg-perla rounded-2xl shadow-2xl overflow-hidden mx-4 sm:mx-auto"
            initial={{ y: -20, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-rosa-light/40">
              <Search className="w-5 h-5 text-foreground/40 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="flex-1 bg-transparent text-foreground text-lg outline-none placeholder:text-foreground/40"
                aria-label={t("search.title")}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-full text-foreground/40 hover:text-foreground/70 hover:bg-rosa-light/30 transition-colors"
                  aria-label="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={close}
                className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-foreground/40 border border-rosa-light/50 rounded-md"
              >
                ESC
              </button>
            </div>

            {/* Category quick filters */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 px-5 py-3 border-b border-rosa-light/30 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    !categoryFilter
                      ? "bg-rosa text-white"
                      : "bg-rosa-light/30 text-foreground/60 hover:bg-rosa-light/50"
                  }`}
                >
                  {t("filters.categoryAll")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setCategoryFilter(categoryFilter === cat ? null : cat)
                    }
                    className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                      categoryFilter === cat
                        ? "bg-rosa text-white"
                        : "bg-rosa-light/30 text-foreground/60 hover:bg-rosa-light/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Results area */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto overscroll-contain px-2 py-2"
            >
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-rosa border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Results list */}
              {!isLoading && query.trim() && results.length > 0 && (
                <div className="space-y-1">
                  {results.map((product, index) => (
                    <button
                      key={product.id}
                      data-search-item
                      onClick={() => navigateTo(product.slug, query)}
                      className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-left transition-colors ${
                        index === activeIndex
                          ? "bg-rosa-light/40"
                          : "hover:bg-rosa-light/20"
                      }`}
                    >
                      {/* Product image */}
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-rosa-light/20 flex-shrink-0">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={getName(product)}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/20">
                            <Search className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {highlightMatch(getName(product), query)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-foreground/50 capitalize">
                            {product.category}
                          </span>
                          {!product.inStock && (
                            <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                              {t("shop.outOfStock")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-rosa-dark">
                          ${product.price.toFixed(2)}
                        </p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-xs text-foreground/40 line-through">
                            ${product.originalPrice.toFixed(2)}
                          </p>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-foreground/20 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {!isLoading && query.trim() && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="w-10 h-10 text-foreground/15 mb-3" />
                  <p className="text-foreground/50 text-sm">
                    {t("search.noResults")}
                  </p>
                </div>
              )}

              {/* Recent searches (when input is empty) */}
              {!query.trim() && recentSearches.length > 0 && (
                <div className="px-3 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
                      {t("search.recentSearches")}
                    </p>
                    <button
                      onClick={clearRecent}
                      className="text-xs text-foreground/40 hover:text-rosa-dark transition-colors"
                    >
                      {t("search.clearRecent")}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-foreground/70 hover:bg-rosa-light/20 transition-colors"
                      >
                        <Clock className="w-4 h-4 text-foreground/30 flex-shrink-0" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state: no query, no recent */}
              {!query.trim() && recentSearches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="w-10 h-10 text-foreground/15 mb-3" />
                  <p className="text-foreground/40 text-sm">
                    {t("search.shortcut")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
