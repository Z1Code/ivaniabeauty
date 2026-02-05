import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

// GET: Get a single product by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const doc = await adminDb.collection("products").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT: Update a product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const docRef = adminDb.collection("products").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (body.slug && body.slug !== doc.data()?.slug) {
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
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    const allowedFields = [
      "slug",
      "nameEn",
      "nameEs",
      "price",
      "originalPrice",
      "category",
      "colors",
      "sizes",
      "compression",
      "occasion",
      "badgeEn",
      "badgeEs",
      "descriptionEn",
      "descriptionEs",
      "shortDescriptionEn",
      "shortDescriptionEs",
      "featuresEn",
      "featuresEs",
      "materials",
      "care",
      "images",
      "inStock",
      "stockQuantity",
      "lowStockThreshold",
      "sku",
      "isFeatured",
      "isActive",
      "sortOrder",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Ensure numeric fields
    if (updateData.price != null) updateData.price = Number(updateData.price);
    if (updateData.originalPrice != null)
      updateData.originalPrice = Number(updateData.originalPrice);
    if (updateData.stockQuantity != null)
      updateData.stockQuantity = Number(updateData.stockQuantity);

    await docRef.update(updateData);

    const updated = await docRef.get();
    const updatedData = updated.data()!;

    return NextResponse.json({
      id: updated.id,
      ...updatedData,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE: Soft-delete a product (set isActive to false)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection("products").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await docRef.update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: "Product deactivated" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
