"use client";

import { Menu, Bell } from "lucide-react";
import type { AdminProfile } from "@/lib/firebase/types";

interface AdminTopbarProps {
  admin: {
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
  onMenuToggle: () => void;
}

export default function AdminTopbar({ admin, onMenuToggle }: AdminTopbarProps) {
  const initials = admin.fullName
    ? admin.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : admin.email[0].toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left: Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden lg:block" />

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rosa rounded-full" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-800">
              {admin.fullName || admin.email}
            </p>
            <p className="text-xs text-gray-400 capitalize">{admin.role}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rosa to-rosa-dark flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
