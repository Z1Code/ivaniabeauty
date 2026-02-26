import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";
import type { SizeChartDoc } from "@/lib/firebase/types";
import { FIT_GUIDE_VERSION } from "@/lib/fit-guide/constants";
import { extractFitGuideFromImage, isGeminiConfigured } from "@/lib/fit-guide/extractor";

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
    const fitGuideStatus = searchParams.get("fitGuideStatus");

    let query: FirebaseFirestore.Query = adminDb
      .collection("products")
      .select(
        "nameEn",
        "nameEs",
        "slug",
        "sku",
        "price",
        "originalPrice",
        "category",
        "stockQuantity",
        "isActive",
        "images",
        "sizeChartImageUrl",
        "sizeStock",
        "colorSizeStock",
        "createdAt",
        "updatedAt",
        "sortOrder"
      )
      .orderBy("sortOrder", "asc");

    if (category) {
      query = query.where("category", "==", category);
    }

    const [snapshot, fitGuidesSnap] = await Promise.all([
      query.get(),
      adminDb.collection("sizeCharts").select("status", "warnings").get(),
    ]);
    const fitGuideMap = new Map(
      fitGuidesSnap.docs.map((doc) => [doc.id, doc.data() as SizeChartDoc])
    );
    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      fitGuideStatus:
        fitGuideMap.get(doc.id)?.status ||
        (doc.data().sizeChartImageUrl ? "stale" : "failed"),
      fitGuideWarnings: fitGuideMap.get(doc.id)?.warnings || [],
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

    if (fitGuideStatus) {
      products = products.filter(
        (p: Record<string, unknown>) => p.fitGuideStatus === fitGuideStatus
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
    const sizeChartImageUrl = toOptionalImageUrl(body.sizeChartImageUrl);
    const images = sanitizeGalleryImages(body.images, sizeChartImageUrl);
    const requestedProductPageImageSourceUrl = toOptionalImageUrl(
      body.productPageImageSourceUrl
    );
    const requestedProductPageImageUrl = toOptionalImageUrl(body.productPageImageUrl);
    const productPageImageSourceUrl =
      requestedProductPageImageSourceUrl && images.includes(requestedProductPageImageSourceUrl)
        ? requestedProductPageImageSourceUrl
        : images[0] || null;
    const productPageImageUrl =
      requestedProductPageImageUrl && productPageImageSourceUrl
        ? requestedProductPageImageUrl
        : null;
    const imageCropSourceMap = sanitizeImageSourceMap(
      body.imageCropSourceMap,
      images
    );
    const imageEnhanceSourceMap = sanitizeImageSourceMap(
      body.imageEnhanceSourceMap,
      images
    );

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
      images,
      imageCropSourceMap,
      imageEnhanceSourceMap,
      sizeChartImageUrl,
      productPageImageUrl,
      productPageImageSourceUrl,
      rating: 0,
      reviewCount: 0,
      inStock: body.inStock !== false,
      stockQuantity: body.stockQuantity ?? 100,
      lowStockThreshold: body.lowStockThreshold ?? 5,
      sku: body.sku || null,
      isFeatured: body.isFeatured || false,
      isActive: body.isActive !== false,
      sizeStock: body.sizeStock && typeof body.sizeStock === "object" ? body.sizeStock : {},
      colorSizeStock: body.colorSizeStock && typeof body.colorSizeStock === "object" ? body.colorSizeStock : {},
      sortOrder: body.sortOrder ?? 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("products").add(productData);

    if (productData.sizeChartImageUrl) {
      if (isGeminiConfigured()) {
        try {
          const extraction = await extractFitGuideFromImage(productData.sizeChartImageUrl);
          await adminDb.collection("sizeCharts").doc(docRef.id).set({
            productId: docRef.id,
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
          console.warn("Automatic fit-guide extraction failed on product create:", fitGuideError);
          await adminDb.collection("sizeCharts").doc(docRef.id).set({
            productId: docRef.id,
            version: FIT_GUIDE_VERSION,
            status: "failed",
            warnings: ["Automatic extraction failed. Run manual analysis from admin."],
            confidenceScore: 0,
            availableSizesCanonical: [],
            rows: [],
            measurements: [],
            sourceImageUrl: productData.sizeChartImageUrl,
            sourceImageHash: "",
            extractedAt: new Date(),
            confirmedAt: null,
            confirmedBy: null,
          });
        }
      } else {
        await adminDb.collection("sizeCharts").doc(docRef.id).set({
          productId: docRef.id,
          version: FIT_GUIDE_VERSION,
          status: "stale",
          warnings: ["Gemini API key is missing. Analyze manually when available."],
          confidenceScore: 0,
          availableSizesCanonical: [],
          rows: [],
          measurements: [],
          sourceImageUrl: productData.sizeChartImageUrl,
          sourceImageHash: "",
          extractedAt: new Date(),
          confirmedAt: null,
          confirmedBy: null,
        });
      }
    }

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
