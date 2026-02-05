import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

// GET: List all products (admin view - includes inactive)
export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let query: FirebaseFirestore.Query = adminDb
      .collection("products")
      .orderBy("sortOrder", "asc");

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.get();
    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    // Client-side search filter (Firestore doesn't support full-text search)
    if (search) {
      const term = search.toLowerCase();
      products = products.filter(
        (p: Record<string, unknown>) =>
          (p.nameEn as string)?.toLowerCase().includes(term) ||
          (p.nameEs as string)?.toLowerCase().includes(term) ||
          (p.sku as string)?.toLowerCase().includes(term)
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST: Create a new product
export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.nameEn || !body.nameEs || !body.slug || body.price == null) {
      return NextResponse.json(
        { error: "Missing required fields: nameEn, nameEs, slug, price" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await adminDb
      .collection("products")
      .where("slug", "==", body.slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const productData = {
      slug: body.slug,
      nameEn: body.nameEn,
      nameEs: body.nameEs,
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
      category: body.category || "diario",
      colors: body.colors || [],
      sizes: body.sizes || [],
      compression: body.compression || "media",
      occasion: body.occasion || "diario",
      badgeEn: body.badgeEn || null,
      badgeEs: body.badgeEs || null,
      descriptionEn: body.descriptionEn || "",
      descriptionEs: body.descriptionEs || "",
      shortDescriptionEn: body.shortDescriptionEn || "",
      shortDescriptionEs: body.shortDescriptionEs || "",
      featuresEn: body.featuresEn || [],
      featuresEs: body.featuresEs || [],
      materials: body.materials || "",
      care: body.care || "",
      images: body.images || [],
      rating: 0,
      reviewCount: 0,
      inStock: body.inStock !== false,
      stockQuantity: body.stockQuantity ?? 100,
      lowStockThreshold: body.lowStockThreshold ?? 5,
      sku: body.sku || null,
      isFeatured: body.isFeatured || false,
      isActive: body.isActive !== false,
      sortOrder: body.sortOrder ?? 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("products").add(productData);

    return NextResponse.json(
      { id: docRef.id, ...productData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
