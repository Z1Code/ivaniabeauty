"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useInView } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function BeforeAfter() {
  const { t } = useTranslation();
  const [sliderPos, setSliderPos] = useState(5);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasAutoPlayed = useRef(false);
  const inViewRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(inViewRef, { once: true, margin: "-80px" });

  // Auto-animate from left to right over 3s when first in view
  useEffect(() => {
    if (!isInView || hasAutoPlayed.current) return;
    hasAutoPlayed.current = true;

    const duration = 3000;
    const start = performance.now();
    const from = 5;
    const to = 95;

    const tick = (now: number) => {
      if (isDragging.current) return;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-in-out cubic
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setSliderPos(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView]);

  const updateSlider = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    setSliderPos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      updateSlider(e.clientX);

      const move = (ev: MouseEvent) => {
        if (isDragging.current) updateSlider(ev.clientX);
      };
      const up = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    },
    [updateSlider]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      updateSlider(e.touches[0].clientX);
    },
    [updateSlider]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging.current) updateSlider(e.touches[0].clientX);
    },
    [updateSlider]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderPos((p) => Math.max(0, p - 2));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderPos((p) => Math.min(100, p + 2));
    }
  }, []);

  return (
    <div ref={inViewRef}>
      <div
        ref={containerRef}
        className="relative aspect-video w-full select-none overflow-hidden rounded-2xl border border-black/10 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
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
        {/* BEFORE (without shaper) — full background */}
        <div className="absolute inset-0">
          <Image
            src="/comparison/after.webp"
            alt={t("beforeAfter.without")}
            fill
            className="object-cover"
            sizes="672px"
          />
          <span className="absolute top-4 left-4 rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {t("beforeAfter.without")}
          </span>
        </div>

        {/* AFTER (with shaper) — clipped overlay */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        >
          <Image
            src="/comparison/before.webp"
            alt={t("beforeAfter.with")}
            fill
            className="object-cover"
            sizes="672px"
          />
          <span className="absolute top-4 right-4 rounded-full bg-rosa/80 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {t("beforeAfter.with")}
          </span>
        </div>

        {/* Divider + handle */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
          <div className="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-white/50 active:cursor-grabbing transition-transform hover:scale-110">
            <ChevronLeft className="h-4 w-4 -mr-0.5 text-rosa-dark" />
            <ChevronRight className="h-4 w-4 -ml-0.5 text-rosa-dark" />
          </div>
        </div>
      </div>
    </div>
  );
}
