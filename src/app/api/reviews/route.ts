import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/security/rate-limiter";

// GET: Public endpoint - list approved reviews (optionally filtered by productId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    let query: FirebaseFirestore.Query = adminDb
      .collection("reviews")
      .where("status", "==", "approved")
      .limit(100);

    if (productId) {
      query = query.where("productId", "==", productId);
    }

    const snapshot = await query.get();

    const reviews = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const createdAtIso = data.createdAt?.toDate?.()?.toISOString() || null;
        return {
          id: doc.id,
          productId: data.productId || "",
          productName: data.productName || "",
          customerName: data.customerName || "",
          rating: Number(data.rating || 0),
          title: data.title || "",
          body: data.body || "",
          isVerifiedPurchase: data.isVerifiedPurchase === true,
          createdAt: createdAtIso,
        };
      })
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt < b.createdAt ? 1 : -1;
      });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST: Submit a review (public)
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(ip, "/api/reviews");
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body.productId || !body.name || !body.rating || !body.body) {
      return NextResponse.json(
        { error: "productId, name, rating, and body are required" },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (body.name?.length > 100 || body.title?.length > 200 || body.body?.length > 2000) {
      return NextResponse.json(
        { error: "Input too long" },
        { status: 400 }
      );
    }

    await adminDb.collection("reviews").add({
      productId: body.productId,
      productName: body.productName || "",
      customerId: null,
      customerName: body.name,
      customerEmail: body.email || "",
      rating: body.rating,
      title: body.title || "",
      body: body.body,
      status: "pending",
      isVerifiedPurchase: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Resena enviada para aprobacion",
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
