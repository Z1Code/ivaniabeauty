"use client";

import React, { useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";
import { PackageOpen } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { type SectionConfig } from "@/app/shop/sections";

interface ProductSectionProps {
  section: SectionConfig;
  products: Product[];
  isActive?: boolean;
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

/* ── Animated gradient section title (Apple-inspired) ── */
function SectionTitle({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="mb-8 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: 50, filter: "blur(12px)" }}
        animate={
          isInView
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: 50, filter: "blur(12px)" }
        }
        transition={{
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="text-gradient-section text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight"
      >
        {text}
      </motion.h2>

      {/* Animated underline accent */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={
          isInView
            ? { scaleX: 1, opacity: 1 }
            : { scaleX: 0, opacity: 0 }
        }
        transition={{
          duration: 0.6,
          delay: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="mt-3 h-[3px] w-16 origin-left rounded-full bg-gradient-to-r from-rosa via-rosa-dark to-dorado/60"
      />
    </div>
  );
}

export default function ProductSection({
  section,
  products,
  isActive = false,
}: ProductSectionProps) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <section
      ref={sectionRef}
      id={section.id}
      data-shop-section
      className="relative py-10 scroll-mt-32"
    >
      {/* Section Title */}
      <SectionTitle text={t(section.titleKey)} />

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          <AnimatePresence>
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                className="h-full"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(index * 0.06, 0.3),
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
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
          className="flex flex-col items-center justify-center py-10 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-rosa-light/30 flex items-center justify-center mb-3">
            <PackageOpen className="w-6 h-6 text-rosa" />
          </div>
          <p className="text-gray-500 text-xs">
            {t("shop.emptyStateHeading")}
          </p>
        </motion.div>
      )}
    </section>
  );
}
