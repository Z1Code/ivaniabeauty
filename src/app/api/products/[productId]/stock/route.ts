import { NextResponse } from "next/server";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";

// Public GET endpoint — no auth required, read-only
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }

  try {
    const { productId } = await params;
    const doc = await adminDb
      .collection("products")
      .doc(productId)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const data = doc.data()!;

    return NextResponse.json({
      stockQuantity: data.stockQuantity ?? 0,
      sizeStock: data.sizeStock ?? {},
      lowStockThreshold: data.lowStockThreshold ?? 5,
      inStock: data.inStock !== false,
    });
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
