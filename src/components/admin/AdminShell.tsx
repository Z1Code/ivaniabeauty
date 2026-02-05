"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import useAdminTheme from "@/hooks/useAdminTheme";

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
  const { isDark, toggleDark, theme } = useAdminTheme();

  return (
    <div className="flex min-h-screen bg-arena dark:bg-gray-950 transition-colors duration-300">
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        themeGradient={theme.gradient}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          admin={admin}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          isDark={isDark}
          onToggleDark={toggleDark}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
