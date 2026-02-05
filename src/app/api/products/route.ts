import { NextResponse } from "next/server";
import { getProducts } from "@/lib/services/products";

// GET: Public endpoint - returns all active products
export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
