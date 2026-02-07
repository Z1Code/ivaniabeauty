import { adminDb } from "@/lib/firebase/admin";
import ReviewsClient, { type ReviewRow } from "./ReviewsClient";

async function getInitialReviews(): Promise<ReviewRow[]> {
  const snapshot = await adminDb
    .collection("reviews")
    .select(
      "productId",
      "productName",
      "customerName",
      "customerEmail",
      "rating",
      "title",
      "body",
      "status",
      "isVerifiedPurchase",
      "createdAt"
    )
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const status =
      data.status === "approved" || data.status === "rejected"
        ? data.status
        : "pending";

    return {
      id: doc.id,
      productId: data.productId || "",
      productName: data.productName || "",
      customerName: data.customerName || "",
      customerEmail: data.customerEmail || "",
      rating: Number(data.rating || 0),
      title: data.title || "",
      body: data.body || "",
      status,
      isVerifiedPurchase: data.isVerifiedPurchase === true,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    };
  });
}

export default async function ReviewsPage() {
  const initialReviews = await getInitialReviews();
  return <ReviewsClient initialReviews={initialReviews} />;
}
