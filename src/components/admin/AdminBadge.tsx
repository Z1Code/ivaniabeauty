"use client";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "rosa";

const variants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  info: "bg-blue-50 text-blue-600",
  rosa: "bg-rosa-light/30 text-rosa-dark",
};

interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function AdminBadge({
  children,
  variant = "default",
  className,
}: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Helper for order status
export function getOrderStatusVariant(
  status: string
): BadgeVariant {
  switch (status) {
    case "pending":
      return "warning";
    case "confirmed":
    case "processing":
      return "info";
    case "shipped":
      return "rosa";
    case "delivered":
      return "success";
    case "cancelled":
    case "refunded":
      return "danger";
    default:
      return "default";
  }
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };
  return labels[status] || status;
}
