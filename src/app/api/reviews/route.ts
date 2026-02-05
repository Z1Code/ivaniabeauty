import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// POST: Submit a review (public)
export async function POST(request: Request) {
  try {
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
