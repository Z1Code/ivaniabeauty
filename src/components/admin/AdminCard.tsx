"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export default function AdminCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: AdminCardProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-semibold",
                  trend.value >= 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-rosa-light/30 dark:bg-rosa/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-rosa" />
        </div>
      </div>
    </div>
  );
}
