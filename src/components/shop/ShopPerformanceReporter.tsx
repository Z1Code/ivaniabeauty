"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/analytics";

const PERF_SAMPLE_SESSION_KEY = "shop_perf_sample_v1";
const PERF_SAMPLE_RATE = 0.4;

function normalizeMetricValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

interface ShopPerformanceReporterProps {
  productCount: number;
  visibleSectionCount: number;
}

export default function ShopPerformanceReporter({
  productCount,
  visibleSectionCount,
}: ShopPerformanceReporterProps) {
  const pathname = usePathname();
  const sampledSessionRef = useRef<boolean | null>(null);
  const reportedMetricIdsRef = useRef<Set<string>>(new Set());
  const sentBootstrapRef = useRef(false);

  const isSampledSession = useCallback((): boolean => {
    if (sampledSessionRef.current !== null) {
      return sampledSessionRef.current;
    }
    if (typeof window === "undefined") return false;
    try {
      const cached = window.sessionStorage.getItem(PERF_SAMPLE_SESSION_KEY);
      if (cached === "1") {
        sampledSessionRef.current = true;
        return true;
      }
      if (cached === "0") {
        sampledSessionRef.current = false;
        return false;
      }
      const sampled = Math.random() < PERF_SAMPLE_RATE;
      window.sessionStorage.setItem(PERF_SAMPLE_SESSION_KEY, sampled ? "1" : "0");
      sampledSessionRef.current = sampled;
      return sampled;
    } catch {
      sampledSessionRef.current = false;
      return false;
    }
  }, []);

  useReportWebVitals((metric) => {
    if (!isSampledSession()) return;
    if (!pathname.startsWith("/shop")) return;
    if (reportedMetricIdsRef.current.has(metric.id)) return;
    reportedMetricIdsRef.current.add(metric.id);

    trackEvent("web_vital", {
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
    if (!isSampledSession()) return;
    if (!pathname.startsWith("/shop")) return;
    if (sentBootstrapRef.current) return;

    const startedAt = performance.now();
    const raf = window.requestAnimationFrame(() => {
      trackEvent("shop_bootstrap", {
        route: pathname,
        productCount,
        visibleSectionCount,
        uiReadyMs: normalizeMetricValue(performance.now() - startedAt),
        sampled: true,
      });
      sentBootstrapRef.current = true;
    });

    return () => window.cancelAnimationFrame(raf);
  }, [isSampledSession, pathname, productCount, visibleSectionCount]);

  return null;
}
