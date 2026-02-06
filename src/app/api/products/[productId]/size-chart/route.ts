import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import type {
  FitGuideRow,
  FitGuideStatus,
  SizeChartDoc,
  SizeChartMeasurement,
} from "@/lib/firebase/types";
import {
  extractFitGuideFromImage,
  isGeminiConfigured,
} from "@/lib/fit-guide/extractor";
import {
  getRowMetricKeys,
  measurementsToRows,
  normalizeRows,
  normalizeSizeList,
  rowsToDisplayRows,
  rowsToLegacyMeasurements,
} from "@/lib/fit-guide/utils";
import { FIT_GUIDE_VERSION } from "@/lib/fit-guide/constants";

interface ProductDocData {
  sizeChartImageUrl?: string | null;
  sizes?: string[];
}

interface ParsedBodyRows {
  rows: Array<Record<string, unknown>>;
}

function parseRowsPayload(body: unknown): ParsedBodyRows {
  if (!body || typeof body !== "object") return { rows: [] };
  const payload = body as {
    rows?: Array<Record<string, unknown>>;
    measurements?: SizeChartMeasurement[];
  };

  if (Array.isArray(payload.rows)) {
    return { rows: payload.rows };
  }

  if (Array.isArray(payload.measurements)) {
    const rows = measurementsToRows(payload.measurements) as Array<Record<string, unknown>>;
    return { rows };
  }

  return { rows: [] };
}

function nowDate(): Date {
  return new Date();
}

function normalizeSourceValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeRowsFromDoc(value: unknown): FitGuideRow[] {
  if (!Array.isArray(value)) return [];
  return value as FitGuideRow[];
}

function normalizeMeasurementsFromDoc(value: unknown, rows: FitGuideRow[]): SizeChartMeasurement[] {
  if (Array.isArray(value) && value.length > 0) {
    return value as SizeChartMeasurement[];
  }
  return rowsToLegacyMeasurements(rows);
}

function toResponsePayload(doc: SizeChartDoc, fromCache = true) {
  const rows = normalizeRowsFromDoc(doc.rows);
  const metricKeys = getRowMetricKeys(rows);

  return {
    status: doc.status,
    warnings: normalizeWarnings(doc.warnings),
    confidenceScore: Number(doc.confidenceScore || 0),
    availableSizes: normalizeSizeList(doc.availableSizesCanonical || []),
    metricKeys,
    displayRows: rowsToDisplayRows(rows),
    rows,
    measurements: normalizeMeasurementsFromDoc(doc.measurements, rows),
    fromCache,
    sourceImageUrl: normalizeSourceValue(doc.sourceImageUrl),
    extractedAt: doc.extractedAt || null,
    confirmedAt: doc.confirmedAt || null,
  };
}

function buildFailedPayload(
  status: FitGuideStatus,
  warnings: string[],
  availableSizes: string[] = []
) {
  return {
    status,
    warnings,
    confidenceScore: 0,
    availableSizes: normalizeSizeList(availableSizes),
    metricKeys: [] as string[],
    displayRows: [] as Array<{ size: string; metrics: Record<string, unknown> }>,
    rows: [] as FitGuideRow[],
    measurements: null,
    fromCache: false,
    sourceImageUrl: "",
    extractedAt: null,
    confirmedAt: null,
  };
}

async function getProduct(
  productId: string
): Promise<{ ref: FirebaseFirestore.DocumentReference; data: ProductDocData } | null> {
  const ref = adminDb.collection("products").doc(productId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  return {
    ref,
    data: snapshot.data() as ProductDocData,
  };
}

async function getSizeChartDoc(productId: string): Promise<SizeChartDoc | null> {
  const snapshot = await adminDb.collection("sizeCharts").doc(productId).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as SizeChartDoc;
}

function createDocBase(
  productId: string,
  sourceImageUrl: string,
  sourceImageHash: string
): Pick<SizeChartDoc, "productId" | "version" | "sourceImageUrl" | "sourceImageHash"> {
  return {
    productId,
    version: FIT_GUIDE_VERSION,
    sourceImageUrl,
    sourceImageHash,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        {
          ...buildFailedPayload("failed", ["Firebase is not configured."]),
        },
        { status: 503 }
      );
    }

    const product = await getProduct(productId);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const sizeChartDoc = await getSizeChartDoc(productId);
    if (!sizeChartDoc) {
      const warnings = product.data.sizeChartImageUrl
        ? ["Fit guide not analyzed yet. Analyze it from admin."]
        : ["No fit-guide image configured for this product."];
      return NextResponse.json(
        {
          ...buildFailedPayload("stale", warnings, product.data.sizes || []),
        },
        { status: 200 }
      );
    }

    const sourceImageUrl = normalizeSourceValue(product.data.sizeChartImageUrl);
    const existingSourceUrl = normalizeSourceValue(sizeChartDoc.sourceImageUrl);
    if (sourceImageUrl && sourceImageUrl !== existingSourceUrl) {
      const warnings = normalizeWarnings(sizeChartDoc.warnings);
      const staleWarning = "Source image changed. Re-analysis is required.";
      if (!warnings.includes(staleWarning)) warnings.push(staleWarning);

      await adminDb.collection("sizeCharts").doc(productId).set(
        {
          status: "stale",
          warnings,
          sourceImageUrl,
          extractedAt: nowDate(),
        },
        { merge: true }
      );

      sizeChartDoc.status = "stale";
      sizeChartDoc.warnings = warnings;
      sizeChartDoc.sourceImageUrl = sourceImageUrl;
    }

    return NextResponse.json(toResponsePayload(sizeChartDoc, true));
  } catch (error) {
    console.error("Size chart GET error:", error);
    return NextResponse.json(
      {
        ...buildFailedPayload("failed", ["Internal server error."]),
      },
      { status: 500 }
    );
  }
}

// POST: Analyze fit-guide image with Gemini and store draft.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        { error: "Firebase not configured" },
        { status: 503 }
      );
    }

    const product = await getProduct(productId);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const imageUrl = normalizeSourceValue(product.data.sizeChartImageUrl);
    if (!imageUrl) {
      const failedDoc: SizeChartDoc = {
        ...createDocBase(productId, "", ""),
        status: "failed",
        warnings: ["No fit-guide image configured for this product."],
        confidenceScore: 0,
        availableSizesCanonical: [],
        rows: [],
        measurements: [],
        extractedAt: nowDate(),
        confirmedAt: null,
        confirmedBy: null,
      };
      await adminDb.collection("sizeCharts").doc(productId).set(failedDoc);
      return NextResponse.json(toResponsePayload(failedDoc, false));
    }

    if (!isGeminiConfigured()) {
      const staleDoc: SizeChartDoc = {
        ...createDocBase(productId, imageUrl, ""),
        status: "stale",
        warnings: [
          "Gemini API key is missing. Configure GEMINI_API_KEY and retry analysis.",
        ],
        confidenceScore: 0,
        availableSizesCanonical: [],
        rows: [],
        measurements: [],
        extractedAt: nowDate(),
        confirmedAt: null,
        confirmedBy: null,
      };
      await adminDb.collection("sizeCharts").doc(productId).set(staleDoc);
      return NextResponse.json(toResponsePayload(staleDoc, false));
    }

    const extraction = await extractFitGuideFromImage(imageUrl);
    const doc: SizeChartDoc = {
      ...createDocBase(productId, extraction.sourceImageUrl, extraction.sourceImageHash),
      status: extraction.status,
      warnings: extraction.warnings,
      confidenceScore: extraction.confidenceScore,
      availableSizesCanonical: extraction.availableSizesCanonical,
      rows: extraction.rows,
      measurements: extraction.measurements,
      extractedAt: nowDate(),
      confirmedAt: null,
      confirmedBy: null,
    };

    await adminDb.collection("sizeCharts").doc(productId).set(doc);
    return NextResponse.json(toResponsePayload(doc, false));
  } catch (error) {
    console.error("Size chart POST error:", error);
    const message =
      error instanceof Error
        ? `Failed to analyze fit guide: ${error.message}`
        : "Failed to analyze fit guide";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// PUT: Save manual draft corrections.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await params;
    const body = await request.json();
    const parsedRows = parseRowsPayload(body);
    if (!parsedRows.rows.length) {
      return NextResponse.json(
        { error: "rows or measurements array is required" },
        { status: 400 }
      );
    }

    const product = await getProduct(productId);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const normalized = normalizeRows(parsedRows.rows, { assumedUnit: "cm" });
    const existing = await getSizeChartDoc(productId);

    const sourceImageUrl =
      normalizeSourceValue(product.data.sizeChartImageUrl) ||
      normalizeSourceValue(existing?.sourceImageUrl);
    const sourceImageHash = normalizeSourceValue(existing?.sourceImageHash);

    const doc: SizeChartDoc = {
      ...createDocBase(productId, sourceImageUrl, sourceImageHash),
      status: normalized.status,
      warnings: normalized.warnings,
      confidenceScore: normalized.confidenceScore,
      availableSizesCanonical: normalized.availableSizesCanonical,
      rows: normalized.rows,
      measurements: rowsToLegacyMeasurements(normalized.rows),
      extractedAt: nowDate(),
      confirmedAt: null,
      confirmedBy: null,
    };

    await adminDb.collection("sizeCharts").doc(productId).set(doc);
    return NextResponse.json(toResponsePayload(doc, false));
  } catch (error) {
    console.error("Size chart PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update fit guide draft" },
      { status: 500 }
    );
  }
}

// PATCH: Confirm fit-guide and sync canonical sizes with product.sizes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await params;
    const product = await getProduct(productId);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = parseRowsPayload(body);
    const existing = await getSizeChartDoc(productId);

    let rows: FitGuideRow[] = [];
    let warnings: string[] = [];
    let confidenceScore = 0;
    if (parsed.rows.length) {
      const normalized = normalizeRows(parsed.rows, { assumedUnit: "cm" });
      rows = normalized.rows;
      warnings = normalized.warnings;
      confidenceScore = normalized.confidenceScore;
    } else if (existing) {
      rows = normalizeRowsFromDoc(existing.rows);
      warnings = normalizeWarnings(existing.warnings);
      confidenceScore = Number(existing.confidenceScore || 0);
    }

    if (!rows.length) {
      return NextResponse.json(
        { error: "No fit-guide rows available to confirm" },
        { status: 400 }
      );
    }

    const availableSizesCanonical = normalizeSizeList(
      rows.map((row) => row.size)
    );
    const sourceImageUrl =
      normalizeSourceValue(product.data.sizeChartImageUrl) ||
      normalizeSourceValue(existing?.sourceImageUrl);
    const sourceImageHash = normalizeSourceValue(existing?.sourceImageHash);

    const doc: SizeChartDoc = {
      ...createDocBase(productId, sourceImageUrl, sourceImageHash),
      status: "confirmed",
      warnings,
      confidenceScore,
      availableSizesCanonical,
      rows,
      measurements: rowsToLegacyMeasurements(rows),
      extractedAt: nowDate(),
      confirmedAt: nowDate(),
      confirmedBy: admin.uid,
    };

    await adminDb.collection("sizeCharts").doc(productId).set(doc);
    await product.ref.update({
      sizes: availableSizesCanonical,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ...toResponsePayload(doc, false),
      syncedSizes: availableSizesCanonical,
      success: true,
    });
  } catch (error) {
    console.error("Size chart PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to confirm fit guide" },
      { status: 500 }
    );
  }
}

// DELETE: Clear fit-guide cache doc.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await params;
    await adminDb.collection("sizeCharts").doc(productId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Size chart DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete fit guide cache" },
      { status: 500 }
    );
  }
}
