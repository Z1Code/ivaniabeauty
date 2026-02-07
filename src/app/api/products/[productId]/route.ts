import { NextRequest, NextResponse } from "next/server";
import { getProductById, getProductBySlug } from "@/lib/services/products";

// GET: Public endpoint - returns a single product by slug/productId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 }
      );
    }

    const productBySlug = await getProductBySlug(productId);
    const product = productBySlug ?? (await getProductById(productId));

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
