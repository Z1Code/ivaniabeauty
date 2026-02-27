"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSliderPos((prev) => Math.max(0, prev - 2));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSliderPos((prev) => Math.min(100, prev + 2));
      }
    },
    []
  );

  return (
    <motion.div
      ref={containerRef}
      className="relative aspect-video w-full select-none overflow-hidden rounded-2xl border border-black/10 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={Math.round(sliderPos)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t("beforeAfter.ariaLabel")}
    >
      {/* ===== BEFORE side (full background layer) ===== */}
      <div className="absolute inset-0">
        <Image
          src="/comparison/before.jpg"
          alt={t("beforeAfter.without")}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1100px"
          priority
        />

        {/* "Before" label */}
        <span className="absolute top-4 left-4 rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm">
          {t("beforeAfter.without")}
        </span>
      </div>

      {/* ===== AFTER side (clipped overlay) ===== */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
      >
        <Image
          src="/comparison/after.jpg"
          alt={t("beforeAfter.with")}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1100px"
          priority
        />

        {/* "After" label */}
        <span className="absolute top-4 right-4 rounded-full bg-rosa/80 px-4 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm">
          {t("beforeAfter.with")}
        </span>
      </div>

      {/* ===== Divider line + handle ===== */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
      >
        {/* Vertical line */}
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)]" />

        {/* Draggable handle */}
        <div className="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-white/50 active:cursor-grabbing transition-transform hover:scale-110">
          <ChevronLeft className="h-4 w-4 -mr-0.5 text-rosa-dark" />
          <ChevronRight className="h-4 w-4 -ml-0.5 text-rosa-dark" />
        </div>
      </div>
    </motion.div>
  );
}
