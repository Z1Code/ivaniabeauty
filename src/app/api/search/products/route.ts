import { NextResponse } from "next/server";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";

export async function GET() {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ products: [] });
  }

  try {
    const snapshot = await adminDb
      .collection("products")
      .where("isActive", "==", true)
      .get();

    const products = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        slug: d.slug || "",
        nameEn: d.nameEn || "",
        nameEs: d.nameEs || "",
        descriptionEn: d.descriptionEn || "",
        descriptionEs: d.descriptionEs || "",
        shortDescriptionEn: d.shortDescriptionEn || "",
        shortDescriptionEs: d.shortDescriptionEs || "",
        category: d.category || "",
        price: Number(d.price) || 0,
        originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
        images: Array.isArray(d.images) ? d.images : [],
        inStock: d.inStock !== false,
        badgeEn: d.badgeEn || null,
        badgeEs: d.badgeEs || null,
      };
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Search products API error:", err);
    return NextResponse.json({ products: [] });
  }
}
