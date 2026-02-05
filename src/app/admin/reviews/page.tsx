"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  Package,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBadge from "@/components/admin/AdminBadge";

interface ReviewRow {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  isVerifiedPurchase: boolean;
  createdAt: string | null;
}

const STATUS_TABS = [
  { value: "", label: "Todas", icon: Star },
  { value: "pending", label: "Pendientes", icon: Clock },
  { value: "approved", label: "Aprobadas", icon: CheckCircle },
  { value: "rejected", label: "Rechazadas", icon: XCircle },
];

function getStatusVariant(
  status: string
): "warning" | "success" | "danger" | "default" {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
  };
  return labels[status] || status;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews");
      if (!res.ok) throw new Error("Error al cargar resenas");
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("No se pudieron cargar las resenas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStatusChange = async (
    reviewId: string,
    newStatus: "approved" | "rejected"
  ) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Error updating review:", err);
      setError("No se pudo actualizar la resena. Intenta de nuevo.");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = statusFilter
    ? reviews.filter((r) => r.status === statusFilter)
    : reviews;

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  return (
    <>
      <AdminPageHeader
        title="Resenas"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Resenas" },
        ]}
      />

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.value === ""
              ? counts.all
              : counts[tab.value as keyof typeof counts];
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-rosa text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.value
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-2 border-rosa border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando resenas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No hay resenas en esta categoria</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Left: Review content */}
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <StarRating rating={review.rating} />
                    <AdminBadge variant={getStatusVariant(review.status)}>
                      {getStatusLabel(review.status)}
                    </AdminBadge>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Compra verificada
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  {review.title && (
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {review.title}
                    </h3>
                  )}

                  {/* Body */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {review.body}
                  </p>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {review.customerName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      {review.productName}
                    </span>
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                  {review.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleStatusChange(review.id, "approved")}
                        disabled={actionLoading === review.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading === review.id ? (
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleStatusChange(review.id, "rejected")}
                        disabled={actionLoading === review.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {actionLoading === review.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Rechazar
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      {review.status === "approved" && (
                        <button
                          onClick={() =>
                            handleStatusChange(review.id, "rejected")
                          }
                          disabled={actionLoading === review.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </button>
                      )}
                      {review.status === "rejected" && (
                        <button
                          onClick={() =>
                            handleStatusChange(review.id, "approved")
                          }
                          disabled={actionLoading === review.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprobar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
