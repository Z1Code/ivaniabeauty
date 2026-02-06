"use client";

import { useEffect } from "react";

const LINE_DELTA_PX = 16;
const MIN_WHEEL_STEP = 24;
const MAX_WHEEL_STEP = 92;
const EASING = 0.14;
const STOP_THRESHOLD = 0.5;

function toPixelDelta(event: WheelEvent): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * LINE_DELTA_PX;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function findScrollableAncestor(start: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = start;

  while (node && node !== document.body) {
    const styles = window.getComputedStyle(node);
    const hasScrollableY =
      /(auto|scroll|overlay)/.test(styles.overflowY) && node.scrollHeight > node.clientHeight;

    if (hasScrollableY) {
      return node;
    }

    node = node.parentElement;
  }

  return null;
}

export default function UniformScrollController() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetY = window.scrollY;
    let rafId: number | null = null;

    const stopAnimation = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const maxScrollY = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const clampTarget = () => {
      targetY = Math.max(0, Math.min(targetY, maxScrollY()));
    };

    const animate = () => {
      const current = window.scrollY;
      const delta = targetY - current;

      if (Math.abs(delta) <= STOP_THRESHOLD) {
        window.scrollTo(window.scrollX, targetY);
        stopAnimation();
        return;
      }

      const nextY = current + delta * EASING;
      window.scrollTo(window.scrollX, nextY);
      rafId = window.requestAnimationFrame(animate);
    };

    const onWheel = (event: WheelEvent) => {
      if (!event.cancelable || event.ctrlKey || event.defaultPrevented) return;
      if (
        window.getComputedStyle(document.body).overflowY === "hidden" ||
        window.getComputedStyle(document.documentElement).overflowY === "hidden"
      ) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      const scrollableAncestor = findScrollableAncestor(target);

      if (scrollableAncestor) {
        const canScrollUp = scrollableAncestor.scrollTop > 0;
        const canScrollDown =
          scrollableAncestor.scrollTop + scrollableAncestor.clientHeight <
          scrollableAncestor.scrollHeight;

        if ((event.deltaY < 0 && canScrollUp) || (event.deltaY > 0 && canScrollDown)) {
          return;
        }
      }

      event.preventDefault();

      const pixelDelta = toPixelDelta(event);
      const direction = Math.sign(pixelDelta);
      if (!direction) return;

      const magnitude = Math.min(
        MAX_WHEEL_STEP,
        Math.max(MIN_WHEEL_STEP, Math.abs(pixelDelta))
      );

      targetY += direction * magnitude;
      clampTarget();

      if (rafId === null) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    const onResize = () => clampTarget();

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      stopAnimation();
    };
  }, []);

  return null;
}
