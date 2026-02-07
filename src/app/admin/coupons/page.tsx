import { adminDb } from "@/lib/firebase/admin";
import CouponsClient, { type CouponRow } from "./CouponsClient";

async function getInitialCoupons(): Promise<CouponRow[]> {
  const snapshot = await adminDb
    .collection("coupons")
    .select(
      "code",
      "description",
      "discountType",
      "discountValue",
      "minPurchase",
      "maxDiscount",
      "usageLimit",
      "usageCount",
      "startsAt",
      "expiresAt",
      "isActive",
      "createdAt"
    )
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      code: data.code || "",
      description: data.description || "",
      discountType: data.discountType === "fixed" ? "fixed" : "percentage",
      discountValue: Number(data.discountValue || 0),
      minPurchase: Number(data.minPurchase || 0),
      maxDiscount:
        typeof data.maxDiscount === "number" ? data.maxDiscount : null,
      usageLimit:
        typeof data.usageLimit === "number" ? data.usageLimit : null,
      usageCount: Number(data.usageCount || 0),
      startsAt: data.startsAt?.toDate?.()?.toISOString() || null,
      expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    };
  });
}

export default async function AdminCouponsPage() {
  const initialCoupons = await getInitialCoupons();
  return <CouponsClient initialCoupons={initialCoupons} />;
}
