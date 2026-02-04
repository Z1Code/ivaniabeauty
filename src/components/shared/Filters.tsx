"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import useFilters from "@/hooks/useFilters";
import { getColorHex, cn } from "@/lib/utils";

interface FiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = [
  { label: "Todas", value: null },
  { label: "Playa", value: "playa" },
  { label: "Diario", value: "diario" },
  { label: "Eventos", value: "eventos" },
  { label: "Post-Parto", value: "postparto" },
];

const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const compressions = [
  { label: "Suave", value: "suave" },
  { label: "Media", value: "media" },
  { label: "Firme", value: "firme" },
];

const colorOptions = ["nude", "negro", "rosa", "champagne", "coral", "turquesa"];

const pricePresets = [
  { label: "Menos de $80", value: [0, 80] as [number, number] },
  { label: "$80 - $120", value: [80, 120] as [number, number] },
  { label: "Mas de $120", value: [120, 200] as [number, number] },
];

const sortOptions = [
  { label: "Destacados", value: "featured" },
  { label: "Precio: Menor a Mayor", value: "price-asc" },
  { label: "Precio: Mayor a Menor", value: "price-desc" },
  { label: "Mejor Valorados", value: "rating" },
  { label: "Nuevos", value: "newest" },
];

function FilterContent() {
  const {
    category,
    size,
    compression,
    color,
    priceRange,
    sortBy,
    setCategory,
    setSize,
    setCompression,
    setColor,
    setPriceRange,
    setSortBy,
    clearFilters,
  } = useFilters();

  return (
    <div className="space-y-0">
      {/* Categoria */}
      <div className="border-b border-rosa-light/30 pb-4 mb-4">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          Categoria
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

      {/* Talla */}
      <div className="border-b border-rosa-light/30 pb-4 mb-4">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          Talla
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

      {/* Compresion */}
      <div className="border-b border-rosa-light/30 pb-4 mb-4">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          Compresion
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
      <div className="border-b border-rosa-light/30 pb-4 mb-4">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          Color
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
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Precio */}
      <div className="border-b border-rosa-light/30 pb-4 mb-4">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          Precio
        </h4>
        <p className="text-xs text-gray-400 mb-2">
          ${priceRange[0]} - ${priceRange[1]}
        </p>
        <div className="flex flex-wrap gap-2">
          {pricePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setPriceRange(preset.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                priceRange[0] === preset.value[0] &&
                  priceRange[1] === preset.value[1]
                  ? "bg-rosa text-white shadow-md"
                  : "bg-rosa-light/30 text-gray-700 hover:bg-rosa-light/50"
              )}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => setPriceRange([0, 200])}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
              priceRange[0] === 0 && priceRange[1] === 200
                ? "bg-rosa text-white shadow-md"
                : "bg-rosa-light/30 text-gray-700 hover:bg-rosa-light/50"
            )}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Ordenar por */}
      <div className="border-b border-rosa-light/30 pb-4 mb-4">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3">
          Ordenar por
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

      {/* Limpiar Filtros */}
      <div className="pt-2">
        <button
          onClick={clearFilters}
          className="text-rosa underline text-sm font-medium hover:text-rosa-dark transition-colors cursor-pointer"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}

export default function Filters({ isOpen, onClose }: FiltersProps) {
  return (
    <>
      {/* Desktop Sidebar - always visible on lg+ */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <h3 className="font-serif text-lg font-semibold text-gray-800 mb-6">
            Filtros
          </h3>
          <FilterContent />
        </div>
      </aside>

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
                aria-label="Cerrar filtros"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title */}
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-6">
                Filtros
              </h3>

              <FilterContent />

              {/* Apply button for mobile */}
              <div className="mt-6 pt-4 border-t border-rosa-light/30">
                <button
                  onClick={onClose}
                  className="w-full bg-rosa text-white rounded-full py-3 font-semibold text-sm hover:bg-rosa-dark transition-colors cursor-pointer"
                >
                  Aplicar Filtros
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
