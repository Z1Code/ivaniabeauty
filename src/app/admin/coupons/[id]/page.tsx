import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import CouponEditClient from "./CouponEditClient";

interface CouponData {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const doc = await adminDb.collection("coupons").doc(id).get();
  if (!doc.exists) notFound();

  const data = doc.data()!;

  // Serialize Firestore timestamps to ISO strings
  const coupon: CouponData = {
    id: doc.id,
    code: data.code || "",
    description: data.description || "",
    discountType: data.discountType || "percentage",
    discountValue: data.discountValue || 0,
    minPurchase: data.minPurchase || 0,
    maxDiscount: data.maxDiscount ?? null,
    usageLimit: data.usageLimit ?? null,
    usageCount: data.usageCount || 0,
    startsAt: data.startsAt?.toDate?.()?.toISOString() || null,
    expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
    isActive: data.isActive !== false,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
  };

  return <CouponEditClient coupon={coupon} />;
}
