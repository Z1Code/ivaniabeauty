import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { adminStorage, isFirebaseConfigured } from "@/lib/firebase/admin";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const DEFAULT_LONG_EDGE = 1600;
const MIN_LONG_EDGE = 512;
const MAX_LONG_EDGE = 2400;
const FETCH_TIMEOUT_MS = 20_000;

interface CropRectInput {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface CropRequestBody {
  imageUrl?: string;
  crop?: CropRectInput;
  aspect?: string;
  targetLongEdge?: number;
}

function parseAspect(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === "original") return null;

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const numerator = Number.parseFloat(match[1]);
  const denominator = Number.parseFloat(match[2]);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (numerator <= 0 || denominator <= 0) return null;
  return numerator / denominator;
}

function parseTargetLongEdge(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_LONG_EDGE;
  const rounded = Math.round(value);
  return Math.min(MAX_LONG_EDGE, Math.max(MIN_LONG_EDGE, rounded));
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

function parseCropRect(value: unknown): CropRectInput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as CropRectInput;
  const keys: Array<keyof CropRectInput> = ["x", "y", "width", "height"];
  const parsed: CropRectInput = {};
  for (const key of keys) {
    const current = raw[key];
    if (typeof current !== "number" || !Number.isFinite(current)) {
      return null;
    }
    parsed[key] = current;
  }
  return parsed;
}

async function fetchSourceImage(imageUrl: string): Promise<Buffer> {
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
      const error = new Error(
        `Failed to fetch source image (${response.status})`
      ) as Error & { status?: number; code?: string };
      error.status = response.status === 404 ? 400 : 422;
      error.code = "IMAGE_FETCH_FAILED";
      throw error;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      const error = new Error("Source image is empty") as Error & {
        status?: number;
        code?: string;
      };
      error.status = 422;
      error.code = "IMAGE_EMPTY";
      throw error;
    }
    if (buffer.length > MAX_SOURCE_BYTES) {
      const error = new Error("Source image is too large for cropping") as Error & {
        status?: number;
        code?: string;
      };
      error.status = 413;
      error.code = "IMAGE_TOO_LARGE";
      throw error;
    }
    return buffer;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new Error(
        "Timed out while fetching source image"
      ) as Error & { status?: number; code?: string };
      timeoutError.status = 504;
      timeoutError.code = "IMAGE_FETCH_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveExtractRect({
  crop,
  sourceWidth,
  sourceHeight,
}: {
  crop: CropRectInput;
  sourceWidth: number;
  sourceHeight: number;
}) {
  const x = Math.floor(crop.x || 0);
  const y = Math.floor(crop.y || 0);
  const width = Math.floor(crop.width || 0);
  const height = Math.floor(crop.height || 0);

  const left = clamp(x, 0, Math.max(0, sourceWidth - 1));
  const top = clamp(y, 0, Math.max(0, sourceHeight - 1));
  const maxWidth = Math.max(1, sourceWidth - left);
  const maxHeight = Math.max(1, sourceHeight - top);
  const safeWidth = clamp(width, 1, maxWidth);
  const safeHeight = clamp(height, 1, maxHeight);

  return {
    left,
    top,
    width: safeWidth,
    height: safeHeight,
  };
}

function computeResizeOptions(
  aspect: number | null,
  targetLongEdge: number
): { width?: number; height?: number; fit?: "cover" | "inside" } {
  if (aspect && Number.isFinite(aspect) && aspect > 0) {
    if (aspect >= 1) {
      return {
        width: targetLongEdge,
        height: Math.max(1, Math.round(targetLongEdge / aspect)),
        fit: "cover",
      };
    }
    return {
      width: Math.max(1, Math.round(targetLongEdge * aspect)),
      height: targetLongEdge,
      fit: "cover",
    };
  }
  return {
    width: targetLongEdge,
    height: targetLongEdge,
    fit: "inside",
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
    const body = (await request.json().catch(() => ({}))) as CropRequestBody;
    const imageUrl = sanitizeImageUrl(body.imageUrl);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "A valid imageUrl is required" },
        { status: 400 }
      );
    }

    const crop = parseCropRect(body.crop);
    if (!crop) {
      return NextResponse.json(
        { error: "A valid crop rectangle is required" },
        { status: 400 }
      );
    }

    const aspect = parseAspect(body.aspect);
    const targetLongEdge = parseTargetLongEdge(body.targetLongEdge);
    const sourceBuffer = await fetchSourceImage(imageUrl);
    const sourceSharp = sharp(sourceBuffer, { failOn: "none" });
    const sourceMeta = await sourceSharp.metadata();
    if (!sourceMeta.width || !sourceMeta.height) {
      return NextResponse.json(
        { error: "Unable to read source image metadata" },
        { status: 422 }
      );
    }

    const extract = resolveExtractRect({
      crop,
      sourceWidth: sourceMeta.width,
      sourceHeight: sourceMeta.height,
    });

    let pipeline = sourceSharp.extract(extract);
    const resize = computeResizeOptions(aspect, targetLongEdge);
    if (resize.width || resize.height) {
      pipeline = pipeline.resize({
        width: resize.width,
        height: resize.height,
        fit: resize.fit || "inside",
        withoutEnlargement: false,
      });
    }

    const outputBuffer = await pipeline
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
      .toBuffer();

    const outputMeta = await sharp(outputBuffer, { failOn: "none" }).metadata();
    const bucket = adminStorage.bucket();
    const fileName = `products/crops/${Date.now()}-${randomUUID()}.png`;
    const file = bucket.file(fileName);

    await file.save(outputBuffer, {
      metadata: {
        contentType: "image/png",
      },
    });
    await file.makePublic();
    const croppedImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({
      success: true,
      croppedImageUrl,
      mimeType: "image/png",
      width: outputMeta.width || null,
      height: outputMeta.height || null,
      sourceImageUrl: imageUrl,
      crop: extract,
      aspect: body.aspect || null,
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
        error:
          typed.message || "Failed to crop image",
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
