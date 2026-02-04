"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { SlidersHorizontal, PackageOpen } from "lucide-react";
import productsData from "@/data/products.json";
import useFilters from "@/hooks/useFilters";
import ProductCard from "@/components/ui/ProductCard";
import Filters from "@/components/shared/Filters";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  category: string;
  colors: string[];
  sizes: string[];
  compression: string;
  occasion: string;
  badge: string | null;
  description: string;
  shortDescription: string;
  features: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

const allProducts = productsData as Product[];

export default function ShopPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    category,
    size,
    compression,
    color,
    priceRange,
    sortBy,
    clearFilters,
  } = useFilters();

  const filteredProducts = useMemo(() => {
    let results = [...allProducts];

    // Filter by category
    if (category) {
      results = results.filter((p) => p.category === category);
    }

    // Filter by size
    if (size) {
      results = results.filter((p) => p.sizes.includes(size));
    }

    // Filter by compression
    if (compression) {
      results = results.filter((p) => p.compression === compression);
    }

    // Filter by color
    if (color) {
      results = results.filter((p) => p.colors.includes(color));
    }

    // Filter by price range
    results = results.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sort
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
          const badgePriority = (badge: string | null) =>
            badge === "Nuevo" ? 0 : 1;
          return badgePriority(a.badge) - badgePriority(b.badge);
        });
        break;
      case "featured":
      default:
        results.sort((a, b) => {
          const badgePriority = (badge: string | null) => {
            if (badge === "Bestseller") return 0;
            if (badge === "Oferta") return 1;
            if (badge === "Nuevo") return 2;
            return 3;
          };
          return badgePriority(a.badge) - badgePriority(b.badge);
        });
        break;
    }

    return results;
  }, [category, size, compression, color, priceRange, sortBy]);

  const hasActiveFilters =
    category !== null ||
    size !== null ||
    compression !== null ||
    color !== null ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 200 ||
    sortBy !== "featured";

  return (
    <main className="min-h-screen bg-perla">
      {/* Hero Banner */}
      <section className="pt-20 pb-10 bg-gradient-to-r from-rosa to-rosa-dark flex items-center justify-center relative overflow-hidden">
        {/* Decorative blurred circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />

        <div className="text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-4xl md:text-5xl text-white font-bold"
          >
            Nuestra Tienda
          </motion.h1>
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="mt-3 text-white/70 text-sm flex items-center justify-center gap-2"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="hover:text-white transition-colors"
            >
              Home
            </Link>
            <span>/</span>
            <span className="text-white">Tienda</span>
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
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6">
              <motion.p
                key={filteredProducts.length}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-gray-500"
              >
                <span className="font-semibold text-gray-800">
                  {filteredProducts.length}
                </span>{" "}
                {filteredProducts.length === 1
                  ? "producto encontrado"
                  : "productos encontrados"}
              </motion.p>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-rosa-light/40 text-sm font-medium text-gray-700 hover:border-rosa transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-rosa" />
                Filtros
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-rosa" />
                )}
              </button>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <LayoutGroup>
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                          opacity: { duration: 0.3 },
                          layout: { type: "spring", stiffness: 300, damping: 30 },
                        }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </LayoutGroup>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-rosa-light/30 flex items-center justify-center mb-6">
                  <PackageOpen className="w-10 h-10 text-rosa" />
                </div>
                <h3 className="font-serif text-2xl text-gray-800 mb-2">
                  No encontramos productos
                </h3>
                <p className="text-gray-500 text-sm max-w-md mb-6">
                  Intenta ajustar los filtros para encontrar lo que buscas. Tenemos
                  opciones perfectas esperando por ti.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 rounded-full bg-rosa text-white font-semibold text-sm hover:bg-rosa-dark transition-colors cursor-pointer shadow-md hover:shadow-lg"
                >
                  Limpiar filtros
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <Filters isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </main>
  );
}
