"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function BeforeAfter() {
  const { t } = useTranslation();
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Convert a clientX position into a slider percentage
  const updateSlider = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  // ---- Mouse handlers ----
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      updateSlider(e.clientX);

      const handleMouseMove = (ev: MouseEvent) => {
        if (isDragging.current) updateSlider(ev.clientX);
      };
      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [updateSlider]
  );

  // ---- Touch handlers ----
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      updateSlider(e.touches[0].clientX);
    },
    [updateSlider]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging.current) {
        updateSlider(e.touches[0].clientX);
      }
    },
    [updateSlider]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ===== BEFORE side (full background layer) ===== */}
      <div className="absolute inset-0 bg-gradient-to-br from-arena to-rosa-light/30">
        {/* Subtle silhouette SVG - before */}
        <svg
          className="absolute bottom-0 left-1/2 h-[85%] -translate-x-1/2 opacity-[0.08]"
          viewBox="0 0 200 400"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M100 10 C70 10 55 50 55 90 C55 120 50 140 48 170 C44 210 42 250 55 290 C60 310 62 340 60 370 C60 385 70 395 80 395 L90 395 C95 395 95 380 95 370 L95 290 C95 285 100 280 105 285 L105 370 C105 380 105 395 110 395 L120 395 C130 395 140 385 140 370 C138 340 140 310 145 290 C158 250 156 210 152 170 C150 140 145 120 145 90 C145 50 130 10 100 10Z" />
        </svg>

        {/* "Sin Faja" label */}
        <span className="absolute bottom-4 left-4 rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          {t("beforeAfter.without")}
        </span>
      </div>

      {/* ===== AFTER side (clipped overlay) ===== */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-rosa to-rosa-dark/50"
        style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
      >
        {/* Subtle silhouette SVG - after (slimmer) */}
        <svg
          className="absolute bottom-0 left-1/2 h-[85%] -translate-x-1/2 opacity-[0.10]"
          viewBox="0 0 200 400"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M100 10 C75 10 65 50 65 85 C65 110 62 135 60 160 C56 200 58 240 68 275 C72 295 74 335 72 365 C72 380 78 392 86 392 L93 392 C96 392 96 378 96 368 L96 280 C96 275 100 272 104 276 L104 368 C104 378 104 392 107 392 L114 392 C122 392 128 380 128 365 C126 335 128 295 132 275 C142 240 144 200 140 160 C138 135 135 110 135 85 C135 50 125 10 100 10Z" />
        </svg>

        {/* "Con Faja" label */}
        <span className="absolute right-4 bottom-4 rounded-full bg-white/80 px-4 py-1 text-sm font-medium text-rosa-dark shadow-sm backdrop-blur-sm">
          {t("beforeAfter.with")}
        </span>
      </div>

      {/* ===== Divider line + handle ===== */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
      >
        {/* Vertical line */}
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/90 shadow-sm" />

        {/* Draggable handle */}
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-white shadow-lg active:cursor-grabbing">
          <ChevronLeft className="h-4 w-4 -mr-1 text-rosa-dark" />
          <ChevronRight className="h-4 w-4 -ml-1 text-rosa-dark" />
        </div>
      </div>
    </motion.div>
  );
}
