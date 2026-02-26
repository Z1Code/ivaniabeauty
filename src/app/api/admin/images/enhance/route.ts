import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { adminDb, adminStorage, isFirebaseConfigured } from "@/lib/firebase/admin";
import {
  generateProfessionalProductImage,
  isProductImageAngle,
  isProductImageGenerationConfigured,
  type ProductImageAngle,
} from "@/lib/product-image-ai/generator";
import {
  removeBackgroundSpecializedWithDiagnostics,
  type BackgroundRemovalDiagnostics,
  type ProviderId,
} from "@/lib/product-image-ai/background-removal";

export const maxDuration = 300;

const MAX_SOURCE_BYTES = 50 * 1024 * 1024;
const DEFAULT_SCALE_FACTOR = 4;
const MIN_SCALE_FACTOR = 2;
const MAX_SCALE_FACTOR = 4;
const MIN_LONG_EDGE = 1024;
const MAX_LONG_EDGE = 8192;
const DEFAULT_MAX_LONG_EDGE = 4096;
const FETCH_TIMEOUT_MS = 20_000;

const MIN_TRANSPARENT_RATIO = 0.03;
const MAX_TRANSPARENT_RATIO = 0.98;
const MIN_BORDER_TRANSPARENT_RATIO = 0.55;
const MAX_CENTER_TRANSPARENT_RATIO = 0.9;
const MIN_OPAQUE_RATIO = 0.02;
const MAX_BORDER_OPAQUE_RATIO = 0.08;
const MAX_BORDER_SEMI_TRANSPARENT_RATIO = 0.22;
const MAX_FOREGROUND_BBOX_AREA_RATIO = 0.95;
const ALPHA_TRANSPARENT_MAX = 5;
const ALPHA_NEAR_OPAQUE_MIN = 224;

interface EnhanceFallbackRequestBody {
  enabled?: boolean;
  productId?: string;
  sourceImageUrl?: string;
  sourceImageUrls?: string[];
  colorReferenceImageUrl?: string;
  preferredProfileId?: string;
  customPrompt?: string;
  targetColor?: string;
  targetAngle?: string;
}

interface EnhanceRequestBody {
  imageUrl?: string;
  scaleFactor?: number;
  maxLongEdge?: number;
  fallbackRegeneration?: EnhanceFallbackRequestBody;
}

interface ParsedFallbackRequest {
  enabled: boolean;
  productId: string | null;
  sourceImageUrl: string | null;
  sourceImageUrls: string[];
  colorReferenceImageUrl: string | null;
  preferredProfileId: string | null;
  customPrompt: string | null;
  targetColor: string | null;
  targetAngle: ProductImageAngle | null;
}

interface ProductRecord {
  nameEs?: string;
  nameEn?: string;
  category?: string;
  colors?: string[];
}

interface TransparencyAnalysis {
  hasAlphaChannel: boolean;
  transparentRatio: number;
  borderTransparentRatio: number;
  borderOpaqueRatio: number;
  borderSemiTransparentRatio: number;
  centerTransparentRatio: number;
  opaqueRatio: number;
  foregroundBoundingBoxAreaRatio: number;
  foregroundTouchesAllEdges: boolean;
  hasUsableTransparency: boolean;
}

interface HdRenderResult {
  outputBuffer: Buffer;
  outputMimeType: string;
  hasAlpha: boolean;
}

interface FallbackGenerationResult {
  imageBuffer: Buffer;
  mimeType: string;
  modelUsed: string;
  targetAngle: ProductImageAngle;
  sourceImageUrl: string;
  sourceImageUrls: string[];
}

interface SpecializedTransparencyRepairResult {
  hdResult: HdRenderResult | null;
  analysis: TransparencyAnalysis | null;
  provider: ProviderId | null;
  diagnostics: BackgroundRemovalDiagnostics;
}

function makeTypedError(
  message: string,
  status: number,
  code: string
): Error & { status?: number; code?: string } {
  const error = new Error(message) as Error & { status?: number; code?: string };
  error.status = status;
  error.code = code;
  return error;
}

function sanitizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return parsed.toString();
}

function sanitizeShortText(value: unknown, max = 80): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function sanitizePrompt(value: unknown, max = 1200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function sanitizeUrlArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const deduped: string[] = [];
  for (const item of value) {
    const url = sanitizeImageUrl(item);
    if (!url) continue;
    if (!deduped.includes(url)) deduped.push(url);
  }
  return deduped;
}

function parseScaleFactor(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_SCALE_FACTOR;
  }
  return Math.min(MAX_SCALE_FACTOR, Math.max(MIN_SCALE_FACTOR, value));
}

function parseMaxLongEdge(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_MAX_LONG_EDGE;
  }
  const rounded = Math.round(value);
  return Math.min(MAX_LONG_EDGE, Math.max(MIN_LONG_EDGE, rounded));
}

function parseTargetAngle(value: unknown): ProductImageAngle | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!isProductImageAngle(normalized)) return null;
  return normalized;
}

function inferAngleFromImageUrl(imageUrl: string): ProductImageAngle | null {
  const normalized = imageUrl.toLowerCase();
  const angleCandidates: ProductImageAngle[] = [
    "front_three_quarter_left",
    "front_three_quarter_right",
    "left_profile",
    "right_profile",
    "back",
    "front",
  ];
  for (const angle of angleCandidates) {
    if (
      normalized.includes(`-${angle}-`) ||
      normalized.includes(`_${angle}_`) ||
      normalized.includes(`/${angle}-`) ||
      normalized.includes(`/${angle}_`)
    ) {
      return angle;
    }
  }
  return null;
}

function looksLikeAiGeneratedStorageUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return (
    normalized.includes("/products/generated/") ||
    normalized.includes("/products/enhanced/")
  );
}

function parseFallbackRequest(value: unknown): ParsedFallbackRequest {
  if (!value || typeof value !== "object") {
    return {
      enabled: false,
      productId: null,
      sourceImageUrl: null,
      sourceImageUrls: [],
      colorReferenceImageUrl: null,
      preferredProfileId: null,
      customPrompt: null,
      targetColor: null,
      targetAngle: null,
    };
  }

  const raw = value as EnhanceFallbackRequestBody;
  const sourceImageUrls = sanitizeUrlArray(raw.sourceImageUrls);
  const sourceImageUrl = sanitizeImageUrl(raw.sourceImageUrl);
  if (sourceImageUrl && !sourceImageUrls.includes(sourceImageUrl)) {
    sourceImageUrls.unshift(sourceImageUrl);
  }

  return {
    enabled: raw.enabled !== false,
    productId: sanitizeShortText(raw.productId, 128),
    sourceImageUrl,
    sourceImageUrls,
    colorReferenceImageUrl: sanitizeImageUrl(raw.colorReferenceImageUrl),
    preferredProfileId: sanitizeShortText(raw.preferredProfileId, 64),
    customPrompt: sanitizePrompt(raw.customPrompt),
    targetColor: sanitizeShortText(raw.targetColor, 60),
    targetAngle: parseTargetAngle(raw.targetAngle),
  };
}

async function fetchSourceImage(imageUrl: string): Promise<{
  buffer: Buffer;
  mimeType: string | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
    if (!response.ok) {
      const error = makeTypedError(
        `Failed to fetch source image (${response.status})`,
        response.status === 404 ? 400 : 422,
        "IMAGE_FETCH_FAILED"
      );
      throw error;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw makeTypedError("Source image is empty", 422, "IMAGE_EMPTY");
    }
    if (buffer.length > MAX_SOURCE_BYTES) {
      throw makeTypedError(
        "Source image is too large for HD regeneration",
        413,
        "IMAGE_TOO_LARGE"
      );
    }

    return {
      buffer,
      mimeType: response.headers.get("content-type"),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw makeTypedError(
        "Timed out while fetching source image",
        504,
        "IMAGE_FETCH_TIMEOUT"
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function computeTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  scaleFactor: number,
  maxLongEdge: number
): { targetWidth: number; targetHeight: number } {
  let targetWidth = Math.max(1, Math.round(sourceWidth * scaleFactor));
  let targetHeight = Math.max(1, Math.round(sourceHeight * scaleFactor));
  if (maxLongEdge > 0) {
    const longEdge = Math.max(targetWidth, targetHeight);
    if (longEdge > maxLongEdge) {
      const ratio = maxLongEdge / longEdge;
      targetWidth = Math.max(1, Math.round(targetWidth * ratio));
      targetHeight = Math.max(1, Math.round(targetHeight * ratio));
    }
  }
  return { targetWidth, targetHeight };
}

async function renderHdImage({
  sourceBuffer,
  targetWidth,
  targetHeight,
}: {
  sourceBuffer: Buffer;
  targetWidth: number;
  targetHeight: number;
}): Promise<HdRenderResult> {
  const source = sharp(sourceBuffer, { failOn: "none" });
  const sourceMeta = await source.metadata();
  const hasAlpha = Boolean(sourceMeta.hasAlpha);

  const pipeline = source
    .resize({
      width: targetWidth,
      height: targetHeight,
      fit: "fill",
      kernel: "lanczos3",
      withoutEnlargement: false,
    })
    .median(1)
    .sharpen({
      sigma: 1.25,
      m1: 0.85,
      m2: 2.6,
      x1: 2,
      y2: 10,
      y3: 22,
    });

  if (hasAlpha) {
    return {
      outputBuffer: await pipeline
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        .toBuffer(),
      outputMimeType: "image/png",
      hasAlpha,
    };
  }

  return {
    outputBuffer: await pipeline
      .webp({
        quality: 100,
        lossless: true,
        effort: 6,
        nearLossless: true,
      })
      .toBuffer(),
    outputMimeType: "image/webp",
    hasAlpha,
  };
}

async function analyzeTransparency(buffer: Buffer): Promise<TransparencyAnalysis> {
  const meta = await sharp(buffer, { failOn: "none" }).metadata();
  if (!meta.width || !meta.height) {
    return {
      hasAlphaChannel: false,
      transparentRatio: 0,
      borderTransparentRatio: 0,
      borderOpaqueRatio: 0,
      borderSemiTransparentRatio: 0,
      centerTransparentRatio: 1,
      opaqueRatio: 0,
      foregroundBoundingBoxAreaRatio: 0,
      foregroundTouchesAllEdges: false,
      hasUsableTransparency: false,
    };
  }

  const hasAlphaChannel = Boolean(meta.hasAlpha);
  if (!hasAlphaChannel) {
    return {
      hasAlphaChannel: false,
      transparentRatio: 0,
      borderTransparentRatio: 0,
      borderOpaqueRatio: 1,
      borderSemiTransparentRatio: 0,
      centerTransparentRatio: 1,
      opaqueRatio: 1,
      foregroundBoundingBoxAreaRatio: 1,
      foregroundTouchesAllEdges: true,
      hasUsableTransparency: false,
    };
  }

  const {
    data,
    info,
  } = await sharp(buffer, { failOn: "none" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels < 4 || width <= 0 || height <= 0) {
    return {
      hasAlphaChannel,
      transparentRatio: 0,
      borderTransparentRatio: 0,
      borderOpaqueRatio: 0,
      borderSemiTransparentRatio: 0,
      centerTransparentRatio: 1,
      opaqueRatio: 0,
      foregroundBoundingBoxAreaRatio: 0,
      foregroundTouchesAllEdges: false,
      hasUsableTransparency: false,
    };
  }

  const totalPixels = width * height;
  const borderThickness = Math.max(2, Math.min(12, Math.floor(Math.min(width, height) * 0.03)));
  const centerMinX = Math.floor(width * 0.3);
  const centerMaxX = Math.ceil(width * 0.7);
  const centerMinY = Math.floor(height * 0.2);
  const centerMaxY = Math.ceil(height * 0.8);

  let transparentCount = 0;
  let opaqueCount = 0;
  let borderTransparentCount = 0;
  let borderOpaqueCount = 0;
  let borderSemiTransparentCount = 0;
  let borderCount = 0;
  let centerTransparentCount = 0;
  let centerCount = 0;
  let foregroundMinX = width;
  let foregroundMinY = height;
  let foregroundMaxX = -1;
  let foregroundMaxY = -1;
  let foregroundTouchesLeftEdge = false;
  let foregroundTouchesRightEdge = false;
  let foregroundTouchesTopEdge = false;
  let foregroundTouchesBottomEdge = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + 3];
      const isTransparent = alpha <= ALPHA_TRANSPARENT_MAX;
      const isNearOpaque = alpha >= ALPHA_NEAR_OPAQUE_MIN;
      const isSemiTransparent = !isTransparent && !isNearOpaque;

      if (isTransparent) {
        transparentCount += 1;
      } else {
        opaqueCount += 1;
      }

      if (isNearOpaque) {
        if (x < foregroundMinX) foregroundMinX = x;
        if (x > foregroundMaxX) foregroundMaxX = x;
        if (y < foregroundMinY) foregroundMinY = y;
        if (y > foregroundMaxY) foregroundMaxY = y;
        if (x === 0) foregroundTouchesLeftEdge = true;
        if (x === width - 1) foregroundTouchesRightEdge = true;
        if (y === 0) foregroundTouchesTopEdge = true;
        if (y === height - 1) foregroundTouchesBottomEdge = true;
      }

      const isBorder =
        x < borderThickness ||
        y < borderThickness ||
        x >= width - borderThickness ||
        y >= height - borderThickness;
      if (isBorder) {
        borderCount += 1;
        if (isTransparent) {
          borderTransparentCount += 1;
        } else if (isNearOpaque) {
          borderOpaqueCount += 1;
        } else if (isSemiTransparent) {
          borderSemiTransparentCount += 1;
        }
      }

      const isCenter =
        x >= centerMinX &&
        x < centerMaxX &&
        y >= centerMinY &&
        y < centerMaxY;
      if (isCenter) {
        centerCount += 1;
        if (isTransparent) centerTransparentCount += 1;
      }
    }
  }

  const transparentRatio = transparentCount / totalPixels;
  const opaqueRatio = opaqueCount / totalPixels;
  const borderTransparentRatio =
    borderCount > 0 ? borderTransparentCount / borderCount : 0;
  const borderOpaqueRatio = borderCount > 0 ? borderOpaqueCount / borderCount : 0;
  const borderSemiTransparentRatio =
    borderCount > 0 ? borderSemiTransparentCount / borderCount : 0;
  const centerTransparentRatio =
    centerCount > 0 ? centerTransparentCount / centerCount : 1;
  const foregroundTouchesAllEdges =
    foregroundTouchesLeftEdge &&
    foregroundTouchesRightEdge &&
    foregroundTouchesTopEdge &&
    foregroundTouchesBottomEdge;
  const foregroundBoundingBoxAreaRatio =
    foregroundMaxX >= foregroundMinX && foregroundMaxY >= foregroundMinY
      ? ((foregroundMaxX - foregroundMinX + 1) *
          (foregroundMaxY - foregroundMinY + 1)) /
        totalPixels
      : 0;

  const hasUsableTransparency =
    transparentRatio >= MIN_TRANSPARENT_RATIO &&
    transparentRatio <= MAX_TRANSPARENT_RATIO &&
    borderTransparentRatio >= MIN_BORDER_TRANSPARENT_RATIO &&
    borderOpaqueRatio <= MAX_BORDER_OPAQUE_RATIO &&
    borderSemiTransparentRatio <= MAX_BORDER_SEMI_TRANSPARENT_RATIO &&
    centerTransparentRatio <= MAX_CENTER_TRANSPARENT_RATIO &&
    opaqueRatio >= MIN_OPAQUE_RATIO &&
    foregroundBoundingBoxAreaRatio <= MAX_FOREGROUND_BBOX_AREA_RATIO &&
    !(
      foregroundTouchesAllEdges &&
      foregroundBoundingBoxAreaRatio >= MAX_FOREGROUND_BBOX_AREA_RATIO
    );

  return {
    hasAlphaChannel,
    transparentRatio,
    borderTransparentRatio,
    borderOpaqueRatio,
    borderSemiTransparentRatio,
    centerTransparentRatio,
    opaqueRatio,
    foregroundBoundingBoxAreaRatio,
    foregroundTouchesAllEdges,
    hasUsableTransparency,
  };
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

function emptyRepairDiagnostics(errorMessage: string): BackgroundRemovalDiagnostics {
  return {
    configured: false,
    providerOrder: [],
    configuredProviders: [],
    attempts: [],
    applied: false,
    provider: null,
    error: errorMessage,
  };
}

async function attemptSpecializedTransparencyRepair({
  sourceBuffer,
  sourceMimeType,
  targetWidth,
  targetHeight,
}: {
  sourceBuffer: Buffer;
  sourceMimeType: string;
  targetWidth: number;
  targetHeight: number;
}): Promise<SpecializedTransparencyRepairResult> {
  try {
    const specialized = await removeBackgroundSpecializedWithDiagnostics({
      imageBuffer: sourceBuffer,
      mimeType: sourceMimeType,
    });
    if (!specialized.result) {
      return {
        hdResult: null,
        analysis: null,
        provider: null,
        diagnostics: specialized.diagnostics,
      };
    }

    const repairedHd = await renderHdImage({
      sourceBuffer: specialized.result.imageBuffer,
      targetWidth,
      targetHeight,
    });
    const analysis = await analyzeTransparency(repairedHd.outputBuffer);
    return {
      hdResult: repairedHd,
      analysis,
      provider: specialized.result.provider,
      diagnostics: specialized.diagnostics,
    };
  } catch (error) {
    const typed = error as Error;
    return {
      hdResult: null,
      analysis: null,
      provider: null,
      diagnostics: emptyRepairDiagnostics(
        typed.message || "specialized transparency repair failed"
      ),
    };
  }
}

async function regenerateFromScratchWithAi({
  imageUrl,
  fallback,
}: {
  imageUrl: string;
  fallback: ParsedFallbackRequest;
}): Promise<FallbackGenerationResult> {
  if (!fallback.enabled) {
    throw makeTypedError(
      "Transparency validation failed and fallback regeneration is disabled",
      422,
      "TRANSPARENCY_VALIDATION_FAILED"
    );
  }
  if (!fallback.productId) {
    throw makeTypedError(
      "Fallback regeneration requires a valid productId",
      422,
      "FALLBACK_PRODUCT_ID_REQUIRED"
    );
  }
  if (!isProductImageGenerationConfigured()) {
    throw makeTypedError(
      "Transparency validation failed and Gemini generation fallback is not configured",
      503,
      "FALLBACK_GENERATION_NOT_CONFIGURED"
    );
  }

  const productDoc = await adminDb.collection("products").doc(fallback.productId).get();
  if (!productDoc.exists) {
    throw makeTypedError("Product not found for fallback regeneration", 404, "PRODUCT_NOT_FOUND");
  }

  const product = productDoc.data() as ProductRecord;
  const sourceImageUrls =
    fallback.sourceImageUrls.length > 0
      ? fallback.sourceImageUrls
      : fallback.sourceImageUrl
        ? [fallback.sourceImageUrl]
        : [imageUrl];
  const sourceImageUrl = sourceImageUrls[0];
  const targetAngle = fallback.targetAngle || inferAngleFromImageUrl(imageUrl) || "front";

  const generation = await generateProfessionalProductImage({
    sourceImageUrl,
    sourceImageUrls,
    colorReferenceImageUrl: fallback.colorReferenceImageUrl || undefined,
    preferredProfileId: fallback.preferredProfileId || undefined,
    customPrompt: fallback.customPrompt || undefined,
    targetColor: fallback.targetColor || undefined,
    targetAngle,
    productName: product.nameEs || product.nameEn,
    productCategory: product.category,
    productColors: Array.isArray(product.colors) ? product.colors : [],
  });

  return {
    imageBuffer: generation.imageBuffer,
    mimeType: generation.mimeType,
    modelUsed: generation.modelUsed,
    targetAngle: generation.targetAngle,
    sourceImageUrl,
    sourceImageUrls,
  };
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: "Firebase Storage not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as EnhanceRequestBody;
    const imageUrl = sanitizeImageUrl(body.imageUrl);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "A valid imageUrl is required" },
        { status: 400 }
      );
    }

    const scaleFactor = parseScaleFactor(body.scaleFactor);
    const maxLongEdge = parseMaxLongEdge(body.maxLongEdge);
    const fallback = parseFallbackRequest(body.fallbackRegeneration);

    const fetched = await fetchSourceImage(imageUrl);
    const sourceMeta = await sharp(fetched.buffer, { failOn: "none" }).metadata();
    if (!sourceMeta.width || !sourceMeta.height) {
      return NextResponse.json(
        { error: "Unable to read source image metadata" },
        { status: 422 }
      );
    }

    const targetDimensions = computeTargetDimensions(
      sourceMeta.width,
      sourceMeta.height,
      scaleFactor,
      maxLongEdge
    );

    let hdResult = await renderHdImage({
      sourceBuffer: fetched.buffer,
      targetWidth: targetDimensions.targetWidth,
      targetHeight: targetDimensions.targetHeight,
    });

    const expectsTransparency =
      looksLikeAiGeneratedStorageUrl(imageUrl) || fallback.enabled;
    let transparencyAnalysis = expectsTransparency
      ? await analyzeTransparency(hdResult.outputBuffer)
      : null;

    let fallbackRegenerated = false;
    let fallbackReason: string | null = null;
    let fallbackModelUsed: string | null = null;
    let fallbackTargetAngle: ProductImageAngle | null = null;
    const transparencyRepairAttempts: Array<{
      stage: "initial_validation_failed" | "post_fallback_validation_failed";
      provider: ProviderId | null;
      applied: boolean;
      passedValidation: boolean;
      diagnostics: BackgroundRemovalDiagnostics;
    }> = [];
    let transparencyRepairApplied = false;
    let transparencyRepairProvider: ProviderId | null = null;
    let transparencyRepairStage:
      | "initial_validation_failed"
      | "post_fallback_validation_failed"
      | null = null;

    if (expectsTransparency && !transparencyAnalysis?.hasUsableTransparency) {
      const repaired = await attemptSpecializedTransparencyRepair({
        sourceBuffer: hdResult.outputBuffer,
        sourceMimeType: hdResult.outputMimeType,
        targetWidth: targetDimensions.targetWidth,
        targetHeight: targetDimensions.targetHeight,
      });
      const passedValidation = Boolean(repaired.analysis?.hasUsableTransparency);
      transparencyRepairAttempts.push({
        stage: "initial_validation_failed",
        provider: repaired.provider,
        applied: Boolean(repaired.hdResult),
        passedValidation,
        diagnostics: repaired.diagnostics,
      });
      if (passedValidation && repaired.hdResult && repaired.analysis) {
        hdResult = repaired.hdResult;
        transparencyAnalysis = repaired.analysis;
        transparencyRepairApplied = true;
        transparencyRepairProvider = repaired.provider;
        transparencyRepairStage = "initial_validation_failed";
      }
    }

    if (expectsTransparency && !transparencyAnalysis?.hasUsableTransparency) {
      fallbackReason = "transparency_validation_failed";
      const regenerated = await regenerateFromScratchWithAi({
        imageUrl,
        fallback,
      });

      const regeneratedMeta = await sharp(regenerated.imageBuffer, {
        failOn: "none",
      }).metadata();
      if (!regeneratedMeta.width || !regeneratedMeta.height) {
        throw makeTypedError(
          "Fallback regeneration returned an invalid image",
          502,
          "FALLBACK_INVALID_IMAGE"
        );
      }

      const fallbackTargetDimensions = computeTargetDimensions(
        regeneratedMeta.width,
        regeneratedMeta.height,
        scaleFactor,
        maxLongEdge
      );
      hdResult = await renderHdImage({
        sourceBuffer: regenerated.imageBuffer,
        targetWidth: fallbackTargetDimensions.targetWidth,
        targetHeight: fallbackTargetDimensions.targetHeight,
      });
      transparencyAnalysis = await analyzeTransparency(hdResult.outputBuffer);

      fallbackRegenerated = true;
      fallbackModelUsed = regenerated.modelUsed;
      fallbackTargetAngle = regenerated.targetAngle;

      if (!transparencyAnalysis.hasUsableTransparency) {
        const postFallbackRepair = await attemptSpecializedTransparencyRepair({
          sourceBuffer: hdResult.outputBuffer,
          sourceMimeType: hdResult.outputMimeType,
          targetWidth: fallbackTargetDimensions.targetWidth,
          targetHeight: fallbackTargetDimensions.targetHeight,
        });
        const passedValidation = Boolean(
          postFallbackRepair.analysis?.hasUsableTransparency
        );
        transparencyRepairAttempts.push({
          stage: "post_fallback_validation_failed",
          provider: postFallbackRepair.provider,
          applied: Boolean(postFallbackRepair.hdResult),
          passedValidation,
          diagnostics: postFallbackRepair.diagnostics,
        });
        if (
          passedValidation &&
          postFallbackRepair.hdResult &&
          postFallbackRepair.analysis
        ) {
          hdResult = postFallbackRepair.hdResult;
          transparencyAnalysis = postFallbackRepair.analysis;
          transparencyRepairApplied = true;
          transparencyRepairProvider = postFallbackRepair.provider;
          transparencyRepairStage = "post_fallback_validation_failed";
        }
      }

      if (!transparencyAnalysis.hasUsableTransparency) {
        throw makeTypedError(
          "Fallback regeneration did not pass transparency validation",
          502,
          "FALLBACK_TRANSPARENCY_VALIDATION_FAILED"
        );
      }
    }

    const outputMeta = await sharp(hdResult.outputBuffer, { failOn: "none" }).metadata();
    const outputExt = extensionFromMimeType(hdResult.outputMimeType);

    const bucket = adminStorage.bucket();
    const fileName = `products/enhanced/${Date.now()}-${randomUUID()}.${outputExt}`;
    const file = bucket.file(fileName);
    await file.save(hdResult.outputBuffer, {
      metadata: {
        contentType: hdResult.outputMimeType,
      },
    });
    await file.makePublic();
    const enhancedImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({
      success: true,
      enhancedImageUrl,
      mimeType: hdResult.outputMimeType,
      width: outputMeta.width || null,
      height: outputMeta.height || null,
      sourceImageUrl: imageUrl,
      sourceMimeType: fetched.mimeType,
      scaleFactor,
      maxLongEdge,
      transparencyValidated: expectsTransparency
        ? Boolean(transparencyAnalysis?.hasUsableTransparency)
        : false,
      transparencyAnalysis,
      transparencyRepairApplied,
      transparencyRepairProvider,
      transparencyRepairStage,
      transparencyRepairAttempts,
      fallbackRegenerated,
      fallbackReason,
      fallbackModelUsed,
      fallbackTargetAngle,
    });
  } catch (error) {
    const typed = error as Error & { status?: number; code?: string };
    const status =
      typeof typed.status === "number" &&
      typed.status >= 400 &&
      typed.status <= 599
        ? typed.status
        : 500;

    return NextResponse.json(
      {
        error: typed.message || "Failed to regenerate image in HD",
        ...(process.env.NODE_ENV !== "production"
          ? {
              debug: {
                status: typed.status || null,
                code: typed.code || null,
              },
            }
          : {}),
      },
      { status }
    );
  }
}
