"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/analytics";
import { isAdminPerfSampledSession } from "@/lib/admin/perf-sampling";

function normalizeMetricValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export default function AdminPerformanceReporter() {
  const pathname = usePathname();
  const reportedMetricIdsRef = useRef<Set<string>>(new Set());
  const navigationStartRef = useRef<number | null>(null);
  const navigationTargetRef = useRef<string | null>(null);
  const lastPathnameRef = useRef<string | null>(null);
  const longTaskCountRef = useRef(0);
  const currentPathnameRef = useRef(pathname);

  useEffect(() => {
    currentPathnameRef.current = pathname;
  }, [pathname]);

  const isSampled = useCallback(() => isAdminPerfSampledSession(), []);

  useReportWebVitals((metric) => {
    if (!isSampled()) return;
    if (!pathname.startsWith("/admin")) return;
    if (reportedMetricIdsRef.current.has(metric.id)) return;
    reportedMetricIdsRef.current.add(metric.id);

    trackEvent("admin_web_vital", {
      route: pathname,
      metricName: metric.name,
      metricId: metric.id,
      metricValue: normalizeMetricValue(metric.value),
      metricDelta: normalizeMetricValue(metric.delta),
      rating: metric.rating,
      navigationType: metric.navigationType || null,
      sampled: true,
    });
  });

  useEffect(() => {
    if (!isSampled()) return;

    const handleClickCapture = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/admin")) return;

      navigationStartRef.current = performance.now();
      navigationTargetRef.current = href.split("?")[0] || href;
    };

    document.addEventListener("click", handleClickCapture, true);
    return () => {
      document.removeEventListener("click", handleClickCapture, true);
    };
  }, [isSampled]);

  useEffect(() => {
    if (!isSampled()) return;
    if (!pathname.startsWith("/admin")) return;

    const effectStart = performance.now();
    const fromRoute = lastPathnameRef.current;
    const navStartedAt = navigationStartRef.current;
    const navTarget = navigationTargetRef.current;
    const raf = window.requestAnimationFrame(() => {
      const paintMs = normalizeMetricValue(performance.now() - effectStart);
      const navigationMs =
        navStartedAt != null
          ? normalizeMetricValue(performance.now() - navStartedAt)
          : null;

      trackEvent("admin_route_ready", {
        route: pathname,
        fromRoute: fromRoute || null,
        clickedTarget: navTarget,
        navigationMs,
        paintMs,
        initialLoad: fromRoute == null,
        sampled: true,
      });

      navigationStartRef.current = null;
      navigationTargetRef.current = null;
      lastPathnameRef.current = pathname;
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isSampled, pathname]);

  useEffect(() => {
    if (!isSampled()) return;
    if (typeof PerformanceObserver === "undefined") return;

    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration < 120) continue;
          if (longTaskCountRef.current >= 10) break;
          longTaskCountRef.current += 1;

          trackEvent("admin_long_task", {
            route: currentPathnameRef.current,
            durationMs: normalizeMetricValue(entry.duration),
            startTimeMs: normalizeMetricValue(entry.startTime),
            sampled: true,
          });
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // Ignore unsupported browsers.
    }

    return () => {
      observer?.disconnect();
    };
  }, [isSampled]);

  return null;
}

