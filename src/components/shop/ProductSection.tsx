"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PackageOpen } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { type SectionConfig } from "@/app/shop/sections";

interface ProductSectionProps {
  section: SectionConfig;
  products: Product[];
}

interface Product {
  id: string;
  name: { en: string; es: string };
  slug: string;
  price: number;
  originalPrice: number | null;
  category: string;
  colors: string[];
  sizes: string[];
  badge: { en: string; es: string } | null;
  images: string[];
  rating: number;
  reviewCount: number;
}

export default function ProductSection({ section, products }: ProductSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      id={section.id}
      className="relative py-12 scroll-mt-40 overflow-hidden"
    >
      {/* SVG Background Pattern */}
      <div
        className={cn("absolute inset-0 opacity-[0.06] pointer-events-none", section.svgColor)}
        dangerouslySetInnerHTML={{ __html: section.svgPattern }}
      />

      {/* Gradient Overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", section.bgGradient)} />

      {/* Content */}
      <div className="relative z-10">
        <ScrollReveal direction="up">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-800 mb-8">
            {t(section.titleKey)}
          </h2>
        </ScrollReveal>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence>
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  className="h-full"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-rosa-light/30 flex items-center justify-center mb-4">
              <PackageOpen className="w-7 h-7 text-rosa" />
            </div>
            <p className="text-gray-500 text-sm">
              {t("shop.emptyStateHeading")}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
