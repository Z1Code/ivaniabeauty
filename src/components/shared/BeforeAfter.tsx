"use client";

import { useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useInView } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Ease-in-out cubic
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function BeforeAfter() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const isDragging = useRef(false);
  const hasAutoPlayed = useRef(false);
  const rafId = useRef(0);
  const inViewRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(inViewRef, { once: true, margin: "-80px" });

  // Apply slider position directly to DOM (no React re-render)
  const applyPos = useCallback((pct: number) => {
    posRef.current = pct;
    if (clipRef.current) clipRef.current.style.clipPath = `inset(0 0 0 ${pct}%)`;
    if (lineRef.current) lineRef.current.style.left = `${pct}%`;
  }, []);

  // Animate between two values over `duration` ms
  const animateTo = useCallback(
    (from: number, to: number, duration: number): Promise<void> =>
      new Promise((resolve) => {
        const startTime = performance.now();

        const tick = (now: number) => {
          if (isDragging.current) {
            resolve();
            return;
          }
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const value = from + (to - from) * easeInOut(progress);
          applyPos(value);

          if (progress < 1) {
            rafId.current = requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };

        rafId.current = requestAnimationFrame(tick);
      }),
    [applyPos]
  );

  // Auto-animate sequence: 5→95 (3.5s) → pause 1s → 95→50 (3s)
  useEffect(() => {
    if (!isInView || hasAutoPlayed.current) return;
    hasAutoPlayed.current = true;

    let cancelled = false;

    const run = async () => {
      await animateTo(0, 100, 3500);
      if (cancelled || isDragging.current) return;

      await new Promise((r) => setTimeout(r, 1000));
      if (cancelled || isDragging.current) return;

      await animateTo(100, 0, 3500);
    };

    run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId.current);
    };
  }, [isInView, animateTo]);

  // Convert clientX → percentage and apply
  const updateFromPointer = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      applyPos(pct);
    },
    [applyPos]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      cancelAnimationFrame(rafId.current);
      updateFromPointer(e.clientX);

      const move = (ev: MouseEvent) => updateFromPointer(ev.clientX);
      const up = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    },
    [updateFromPointer]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDragging.current = true;
      cancelAnimationFrame(rafId.current);
      updateFromPointer(e.touches[0].clientX);
    },
    [updateFromPointer]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      updateFromPointer(e.touches[0].clientX);
    },
    [updateFromPointer]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        applyPos(Math.max(0, posRef.current - 2));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        applyPos(Math.min(100, posRef.current + 2));
      }
    },
    [applyPos]
  );

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
        aria-valuenow={Math.round(posRef.current)}
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
          ref={clipRef}
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 0%)` }}
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
          ref={lineRef}
          className="absolute top-0 bottom-0 z-10"
          style={{ left: "0%", transform: "translateX(-50%)" }}
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
