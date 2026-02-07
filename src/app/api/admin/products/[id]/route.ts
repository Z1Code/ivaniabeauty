import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";
import type { SizeChartDoc } from "@/lib/firebase/types";
import { FIT_GUIDE_VERSION } from "@/lib/fit-guide/constants";
import { extractFitGuideFromImage, isGeminiConfigured } from "@/lib/fit-guide/extractor";
import { areSameSizeSet } from "@/lib/fit-guide/utils";

function toOptionalImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function sanitizeGalleryImages(
  value: unknown,
  sizeChartImageUrl: string | null
): string[] {
  if (!Array.isArray(value)) return [];
  const blocked = sizeChartImageUrl || "";
  const deduped: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (blocked && trimmed === blocked) continue;
    if (!deduped.includes(trimmed)) deduped.push(trimmed);
  }
  return deduped;
}

function sanitizeImageSourceMap(
  value: unknown,
  images: string[]
): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const allowed = new Set(images);
  const next: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!allowed.has(key)) continue;
    if (typeof raw !== "string") continue;
    const sourceUrl = raw.trim();
    if (!sourceUrl || sourceUrl === key) continue;
    next[key] = sourceUrl;
  }
  return next;
}

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

    const existingData = doc.data()!;
    const fitGuideRef = adminDb.collection("sizeCharts").doc(id);
    const fitGuideSnap = await fitGuideRef.get();
    const fitGuideData = fitGuideSnap.exists
      ? (fitGuideSnap.data() as SizeChartDoc)
      : null;

    // If fit guide is confirmed, reject manual sizes outside the confirmed set.
    if (
      fitGuideData?.status === "confirmed" &&
      body.sizes !== undefined &&
      !areSameSizeSet(body.sizes || [], fitGuideData.availableSizesCanonical || [])
    ) {
      return NextResponse.json(
        {
          error:
            "Sizes are locked by confirmed fit guide. Confirm a new fit guide before changing sizes.",
          availableSizes: fitGuideData.availableSizesCanonical || [],
        },
        { status: 409 }
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
      "sizeChartImageUrl",
      "productPageImageUrl",
      "productPageImageSourceUrl",
      "imageCropSourceMap",
      "imageEnhanceSourceMap",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const previousImageUrl = (existingData.sizeChartImageUrl as string | null) || null;
    const hasImageUrlInPayload = Object.prototype.hasOwnProperty.call(
      body,
      "sizeChartImageUrl"
    );
    const nextImageUrl = hasImageUrlInPayload
      ? toOptionalImageUrl(body.sizeChartImageUrl)
      : previousImageUrl;
    const hasImagesInPayload = Object.prototype.hasOwnProperty.call(body, "images");
    const hasCropMapInPayload = Object.prototype.hasOwnProperty.call(
      body,
      "imageCropSourceMap"
    );
    const hasEnhanceMapInPayload = Object.prototype.hasOwnProperty.call(
      body,
      "imageEnhanceSourceMap"
    );
    const hasProductPageImageInPayload = Object.prototype.hasOwnProperty.call(
      body,
      "productPageImageUrl"
    );
    const hasProductPageSourceInPayload = Object.prototype.hasOwnProperty.call(
      body,
      "productPageImageSourceUrl"
    );
    const sourceImages = hasImagesInPayload ? body.images : existingData.images;
    const sanitizedImages = sanitizeGalleryImages(sourceImages, nextImageUrl);
    const effectiveCropMapSource = hasCropMapInPayload
      ? body.imageCropSourceMap
      : existingData.imageCropSourceMap;
    const effectiveEnhanceMapSource = hasEnhanceMapInPayload
      ? body.imageEnhanceSourceMap
      : existingData.imageEnhanceSourceMap;
    const sanitizedCropSourceMap = sanitizeImageSourceMap(
      effectiveCropMapSource,
      sanitizedImages
    );
    const sanitizedEnhanceSourceMap = sanitizeImageSourceMap(
      effectiveEnhanceMapSource,
      sanitizedImages
    );
    const requestedProductPageSourceUrl = hasProductPageSourceInPayload
      ? toOptionalImageUrl(body.productPageImageSourceUrl)
      : toOptionalImageUrl(existingData.productPageImageSourceUrl);
    const resolvedProductPageSourceUrl =
      requestedProductPageSourceUrl &&
      sanitizedImages.includes(requestedProductPageSourceUrl)
        ? requestedProductPageSourceUrl
        : sanitizedImages[0] || null;
    const requestedProductPageImageUrl = hasProductPageImageInPayload
      ? toOptionalImageUrl(body.productPageImageUrl)
      : toOptionalImageUrl(existingData.productPageImageUrl);
    const shouldResetProductPageImage =
      requestedProductPageImageUrl &&
      requestedProductPageSourceUrl &&
      requestedProductPageSourceUrl !== resolvedProductPageSourceUrl &&
      !hasProductPageImageInPayload;
    const resolvedProductPageImageUrl =
      requestedProductPageImageUrl &&
      resolvedProductPageSourceUrl &&
      !shouldResetProductPageImage
        ? requestedProductPageImageUrl
        : null;

    if (hasImageUrlInPayload) {
      updateData.sizeChartImageUrl = nextImageUrl;
    }
    if (hasImagesInPayload || hasImageUrlInPayload) {
      updateData.images = sanitizedImages;
    }
    if (hasCropMapInPayload || hasImagesInPayload || hasImageUrlInPayload) {
      updateData.imageCropSourceMap = sanitizedCropSourceMap;
    }
    if (hasEnhanceMapInPayload || hasImagesInPayload || hasImageUrlInPayload) {
      updateData.imageEnhanceSourceMap = sanitizedEnhanceSourceMap;
    }
    if (
      hasProductPageImageInPayload ||
      hasProductPageSourceInPayload ||
      hasImagesInPayload ||
      hasImageUrlInPayload
    ) {
      updateData.productPageImageUrl = resolvedProductPageImageUrl;
      updateData.productPageImageSourceUrl = resolvedProductPageSourceUrl;
    }

    // Ensure numeric fields
    if (updateData.price != null) updateData.price = Number(updateData.price);
    if (updateData.originalPrice != null)
      updateData.originalPrice = Number(updateData.originalPrice);
    if (updateData.stockQuantity != null)
      updateData.stockQuantity = Number(updateData.stockQuantity);

    await docRef.update(updateData);

    if (hasImageUrlInPayload && nextImageUrl !== previousImageUrl) {
      if (!nextImageUrl) {
        await fitGuideRef.delete();
      } else if (isGeminiConfigured()) {
        try {
          const extraction = await extractFitGuideFromImage(nextImageUrl);
          await fitGuideRef.set({
            productId: id,
            version: FIT_GUIDE_VERSION,
            status: extraction.status,
            warnings: extraction.warnings,
            confidenceScore: extraction.confidenceScore,
            availableSizesCanonical: extraction.availableSizesCanonical,
            rows: extraction.rows,
            measurements: extraction.measurements,
            sourceImageUrl: extraction.sourceImageUrl,
            sourceImageHash: extraction.sourceImageHash,
            extractedAt: new Date(),
            confirmedAt: null,
            confirmedBy: null,
          });
        } catch (fitGuideError) {
          console.warn("Automatic fit-guide extraction failed on image change:", fitGuideError);
          await fitGuideRef.set({
            productId: id,
            version: FIT_GUIDE_VERSION,
            status: "failed",
            warnings: ["Automatic extraction failed after image change. Analyze manually."],
            confidenceScore: 0,
            availableSizesCanonical: [],
            rows: [],
            measurements: [],
            sourceImageUrl: nextImageUrl,
            sourceImageHash: "",
            extractedAt: new Date(),
            confirmedAt: null,
            confirmedBy: null,
          });
        }
      } else {
        await fitGuideRef.set({
          productId: id,
          version: FIT_GUIDE_VERSION,
          status: "stale",
          warnings: ["Image changed. Pending analysis (Gemini key missing)."],
          confidenceScore: 0,
          availableSizesCanonical: [],
          rows: [],
          measurements: [],
          sourceImageUrl: nextImageUrl,
          sourceImageHash: "",
          extractedAt: new Date(),
          confirmedAt: null,
          confirmedBy: null,
        });
      }
    }

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
