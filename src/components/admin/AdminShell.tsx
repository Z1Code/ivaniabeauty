"use client";

import { Profiler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminPerformanceReporter from "./AdminPerformanceReporter";
import useAdminTheme from "@/hooks/useAdminTheme";
import { trackEvent } from "@/lib/analytics";
import { isAdminPerfSampledSession } from "@/lib/admin/perf-sampling";

interface AdminShellProps {
  admin: {
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  children: React.ReactNode;
}

export default function AdminShell({ admin, children }: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { isDark, toggleDark, theme } = useAdminTheme();
  const sentCommitEventsRef = useRef(0);
  const hasPrefetchedRoutesRef = useRef(false);
  const perfMonitoringEnabled =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ADMIN_PERF_ALWAYS_ON === "1";
  const stableAdmin = useMemo(
    () => ({
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      avatarUrl: admin.avatarUrl || null,
    }),
    [admin.fullName, admin.email, admin.role, admin.avatarUrl]
  );

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const onProfilerRender = useCallback(
    (
      id: string,
      phase: "mount" | "update" | "nested-update",
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      if (!perfMonitoringEnabled) return;
      if (!isAdminPerfSampledSession()) return;
      const route =
        typeof window !== "undefined" ? window.location.pathname : "";
      if (!route.startsWith("/admin")) return;
      if (actualDuration < 8) return;
      if (sentCommitEventsRef.current >= 24) return;

      sentCommitEventsRef.current += 1;
      trackEvent("admin_react_commit", {
        profilerId: id,
        route,
        phase,
        actualDurationMs: Math.round(actualDuration * 100) / 100,
        baseDurationMs: Math.round(baseDuration * 100) / 100,
        startTimeMs: Math.round(startTime * 100) / 100,
        commitTimeMs: Math.round(commitTime * 100) / 100,
        sampled: true,
      });
    },
    [perfMonitoringEnabled]
  );

  useEffect(() => {
    if (hasPrefetchedRoutesRef.current) return;
    hasPrefetchedRoutesRef.current = true;

    const routesToPrefetch = [
      "/admin",
      "/admin/products",
      "/admin/orders",
      "/admin/customers",
      "/admin/reviews",
      "/admin/analytics",
      "/admin/settings",
    ];

    const prefetch = () => {
      routesToPrefetch.forEach((route) => {
        router.prefetch(route);
      });
    };

    const perfWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (perfWindow.requestIdleCallback) {
      const idleId = perfWindow.requestIdleCallback(() => prefetch(), {
        timeout: 1500,
      });
      return () => {
        perfWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(prefetch, 900);
    return () => window.clearTimeout(timeoutId);
  }, [router]);

  const mainContent = <main className="flex-1 p-4 lg:p-6">{children}</main>;

  return (
    <div className="flex min-h-screen bg-arena dark:bg-gray-950 transition-colors duration-300">
      {perfMonitoringEnabled && <AdminPerformanceReporter />}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={closeMobileMenu}
        themeGradient={theme.gradient}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          admin={stableAdmin}
          onMenuToggle={toggleMobileMenu}
          isDark={isDark}
          onToggleDark={toggleDark}
        />
        {perfMonitoringEnabled ? (
          <Profiler id="admin-main" onRender={onProfilerRender}>
            {mainContent}
          </Profiler>
        ) : (
          mainContent
        )}
      </div>
    </div>
  );
}
