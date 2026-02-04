"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCw,
  Star,
  Truck,
  RefreshCw,
  Shield,
} from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import useCart from "@/hooks/useCart";

/* ---------- hotspot data ---------- */
interface Hotspot {
  id: number;
  label: string;
  top: string;
  left: string;
}

const hotspots: Hotspot[] = [
  { id: 1, label: "Doble capa de compresion", top: "22%", left: "62%" },
  { id: 2, label: "Costuras invisibles", top: "48%", left: "65%" },
  { id: 3, label: "Tela antibacterial", top: "74%", left: "60%" },
];

/* ---------- color / size options ---------- */
interface ColorOption {
  name: string;
  hex: string;
}

const colors: ColorOption[] = [
  { name: "Nude", hex: "#E8C4A0" },
  { name: "Negro", hex: "#1A1A1A" },
  { name: "Champagne", hex: "#F7E7CE" },
];

const sizes = ["XS", "S", "M", "L", "XL", "2XL"] as const;

/* =================================================================== */
/*  Viewer360                                                          */
/* =================================================================== */
function Viewer360() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  /* ---- pointer helpers ---- */
  const startDrag = useCallback((clientX: number) => {
    setIsDragging(true);
    lastX.current = clientX;
  }, []);

  const moveDrag = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const delta = clientX - lastX.current;
      setRotation((prev) => prev + delta * 0.8);
      lastX.current = clientX;
    },
    [isDragging]
  );

  const endDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  /* mouse events */
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => startDrag(e.clientX),
    [startDrag]
  );
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => moveDrag(e.clientX),
    [moveDrag]
  );
  const onMouseUp = useCallback(() => endDrag(), [endDrag]);

  /* touch events */
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => startDrag(e.touches[0].clientX),
    [startDrag]
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => moveDrag(e.touches[0].clientX),
    [moveDrag]
  );
  const onTouchEnd = useCallback(() => endDrag(), [endDrag]);

  const toggleHotspot = (id: number) => {
    setActiveHotspot((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative w-full aspect-square rounded-2xl bg-gradient-to-br from-rosa-light/30 via-rosa/10 to-rosa-dark/20 overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        {/* Rotating gradient disc */}
        <div
          className="absolute inset-[15%] rounded-full"
          style={{
            background: `conic-gradient(from ${rotation}deg, #FFB8D0, #FF6B9D, #E91E63, #FFB8D0, #FF6B9D)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        />

        {/* Inner highlight */}
        <div className="absolute inset-[25%] rounded-full bg-perla/60 backdrop-blur-sm" />

        {/* Rotation angle indicator */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-sans text-gray-600">
          {Math.round(((rotation % 360) + 360) % 360)}&deg;
        </div>

        {/* Hotspots */}
        {hotspots.map((spot) => (
          <div
            key={spot.id}
            className="absolute z-10"
            style={{ top: spot.top, left: spot.left }}
          >
            <button
              type="button"
              onClick={() => toggleHotspot(spot.id)}
              className="relative w-6 h-6 rounded-full bg-white shadow-lg border-2 border-rosa flex items-center justify-center"
            >
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-full border-2 border-rosa animate-ping opacity-40" />
              <span className="w-2 h-2 rounded-full bg-rosa" />
            </button>

            {/* Tooltip */}
            <AnimatePresence>
              {activeHotspot === spot.id && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap bg-white shadow-xl rounded-lg px-3 py-2 text-xs font-sans text-gray-700 border border-rosa-light/40"
                >
                  {spot.label}
                  {/* Arrow */}
                  <span className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-white border-b border-r border-rosa-light/40 rotate-45 -mt-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Drag instruction */}
      <p className="flex items-center gap-2 text-sm text-gray-400 font-sans">
        <RotateCw className="w-4 h-4" />
        Arrastra para rotar
      </p>
    </div>
  );
}

/* =================================================================== */
/*  FeaturedProduct                                                     */
/* =================================================================== */
export default function FeaturedProduct() {
  const [selectedColor, setSelectedColor] = useState<string>(colors[0].name);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const addItem = useCart((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      id: "gala-sculpt-001",
      name: "Faja Gala Sculpt",
      price: 129.99,
      image: "/products/gala-sculpt.jpg",
      color: selectedColor,
      size: selectedSize,
      quantity: 1,
    });
  };

  return (
    <section className="py-24 bg-gradient-to-b from-arena to-perla">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center">
          <ScrollReveal direction="up">
            <h2 className="font-serif text-4xl text-center">
              Producto Estrella
            </h2>
            <div className="mx-auto mt-4 w-24 h-1 bg-gradient-to-r from-rosa-light via-rosa to-rosa-dark rounded-full" />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <p className="font-script text-2xl text-rosa-dark mt-4">
              Nuestra faja mas vendida
            </p>
          </ScrollReveal>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 mt-16 gap-12 items-start">
        {/* Left: 360 viewer */}
        <ScrollReveal direction="left" delay={0.2}>
          <Viewer360 />
        </ScrollReveal>

        {/* Right: Product info */}
        <ScrollReveal direction="right" delay={0.3}>
          <div className="flex flex-col gap-6">
            {/* Bestseller badge */}
            <span className="self-start bg-rosa text-white rounded-full px-4 py-1 text-sm font-sans font-medium">
              Bestseller
            </span>

            {/* Name */}
            <h3 className="font-serif text-3xl">Faja Gala Sculpt</h3>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i <= 4
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-yellow-400/80 text-yellow-400/80"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-sans text-gray-500">
                4.9 (312 rese&ntilde;as)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl text-rosa-dark font-bold font-sans">
                $129.99
              </span>
              <span className="text-gray-400 line-through font-sans">
                $159.99
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 font-sans leading-relaxed">
              Nuestra faja estrella combina la maxima compresion con una comodidad
              excepcional. Disenada con doble capa de compresion, costuras
              invisibles y tela antibacterial premium. Moldea tu silueta de forma
              natural y segura, ideal para uso diario o eventos especiales.
            </p>

            {/* Color selector */}
            <div>
              <span className="text-sm font-sans font-medium text-gray-700 mb-2 block">
                Color: {selectedColor}
              </span>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-9 h-9 rounded-full transition-all duration-200 ${
                      selectedColor === color.name
                        ? "ring-2 ring-offset-2 ring-rosa"
                        : "ring-1 ring-gray-200 hover:ring-rosa-light"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div>
              <span className="text-sm font-sans font-medium text-gray-700 mb-2 block">
                Talla: {selectedSize}
              </span>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg text-sm font-sans font-medium transition-all duration-200 ${
                      selectedSize === size
                        ? "bg-rosa text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-rosa-light"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to cart */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              className="bg-rosa text-white rounded-full py-3 px-8 w-full font-sans font-semibold text-lg shadow-lg hover:bg-rosa-dark transition-colors duration-300 cursor-pointer"
            >
              Agregar al Carrito
            </motion.button>

            {/* Trust icons */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { icon: Truck, label: "Envio Gratis" },
                { icon: RefreshCw, label: "30 Dias Devolucion" },
                { icon: Shield, label: "Pago Seguro" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 text-center"
                >
                  <Icon className="w-5 h-5 text-rosa" />
                  <span className="text-xs font-sans text-gray-500">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
