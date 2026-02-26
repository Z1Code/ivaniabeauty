import { NextResponse } from "next/server";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { computeTotalStock } from "@/lib/stock-helpers";

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
    const sizeStock: Record<string, number> = data.sizeStock ?? {};
    const colorSizeStock: Record<string, Record<string, number>> | undefined =
      data.colorSizeStock && typeof data.colorSizeStock === "object"
        ? (data.colorSizeStock as Record<string, Record<string, number>>)
        : undefined;
    const totalStock = computeTotalStock(colorSizeStock, sizeStock);

    return NextResponse.json({
      sizeStock,
      colorSizeStock: colorSizeStock || null,
      totalStock,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      inStock: totalStock > 0,
    });
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
