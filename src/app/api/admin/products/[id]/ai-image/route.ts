import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { adminDb, adminStorage, isFirebaseConfigured } from "@/lib/firebase/admin";
import {
  generateProfessionalProductImage,
  getProductImageAngleOptions,
  getProductModelProfiles,
  normalizeProductImageAngles,
  type ProductImageAngle,
  isProductImageGenerationConfigured,
} from "@/lib/product-image-ai/generator";
import {
  getBackgroundRemovalConfigurationRuntime,
} from "@/lib/product-image-ai/background-removal";

export const maxDuration = 300;

interface ProductRecord {
  nameEs?: string;
  nameEn?: string;
  category?: string;
  colors?: string[];
  images?: string[];
  sizeChartImageUrl?: string | null;
}

interface GenerationRequestBody {
  sourceImageUrl?: string;
  sourceImageUrls?: string[];
  colorReferenceImageUrl?: string;
  preferredProfileId?: string;
  customPrompt?: string;
  targetColor?: string;
  targetAngle?: string;
  angles?: string[];
  placeFirst?: boolean;
  maxImages?: number;
}

function getGeminiEnvPresence() {
  const presence = {
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY?.trim()),
    GOOGLE_API_KEY: Boolean(process.env.GOOGLE_API_KEY?.trim()),
    GOOGLE_GENERATIVE_AI_API_KEY: Boolean(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    ),
    GEMINI_IMAGE_MODEL: Boolean(process.env.GEMINI_IMAGE_MODEL?.trim()),
    GEMINI_IMAGE_FALLBACK_MODELS: Boolean(
      process.env.GEMINI_IMAGE_FALLBACK_MODELS?.trim()
    ),
  };

  const missingKeyCandidates = Object.entries(presence)
    .filter(
      ([name, isSet]) =>
        !isSet &&
        name !== "GEMINI_IMAGE_MODEL" &&
        name !== "GEMINI_IMAGE_FALLBACK_MODELS"
    )
    .map(([name]) => name);

  return {
    presence,
    missingKeyCandidates,
  };
}

function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

function sanitizeImageArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const deduped: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (!deduped.includes(trimmed)) deduped.push(trimmed);
  }
  return deduped;
}

function sanitizeUrlArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const deduped: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (!deduped.includes(trimmed)) deduped.push(trimmed);
  }
  return deduped;
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

function limitImages(images: string[], maxImages?: number): string[] {
  if (!Number.isFinite(maxImages) || !maxImages || maxImages <= 0) {
    return images;
  }
  return images.slice(0, maxImages);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const docSnap = await adminDb.collection("products").doc(id).get();
  if (!docSnap.exists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const bgConfig = await getBackgroundRemovalConfigurationRuntime();

  return NextResponse.json({
    productId: id,
    availableProfiles: getProductModelProfiles(),
    availableAngles: getProductImageAngleOptions(),
    configured: isProductImageGenerationConfigured(),
    specializedBackgroundRemovalConfigured: bgConfig.configured,
    backgroundRemovalConfiguration: bgConfig,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (!isProductImageGenerationConfigured()) {
    const envInfo = getGeminiEnvPresence();
    return NextResponse.json(
      {
        error:
          "Gemini image generation is not configured. Set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY) in server environment and restart dev server.",
        ...(process.env.NODE_ENV !== "production"
          ? {
              debug: {
                envPresence: envInfo.presence,
                missingKeyCandidates: envInfo.missingKeyCandidates,
              },
            }
          : {}),
      },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as GenerationRequestBody;
    const customPrompt = sanitizePrompt(body.customPrompt);
    const targetColor = sanitizeShortText(body.targetColor, 60);
    const docRef = adminDb.collection("products").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = docSnap.data() as ProductRecord;
    const existingImages = sanitizeImageArray(product.images);
    const defaultSource = existingImages[0] || sanitizeUrl(product.sizeChartImageUrl) || null;
    const explicitSourceUrls = sanitizeUrlArray(body.sourceImageUrls);
    const singleSourceUrl = sanitizeUrl(body.sourceImageUrl);
    const sourceImageUrls = [
      ...(singleSourceUrl ? [singleSourceUrl] : []),
      ...explicitSourceUrls,
    ].filter((value, idx, arr) => arr.indexOf(value) === idx);
    if (!sourceImageUrls.length && defaultSource) {
      sourceImageUrls.push(defaultSource);
    }

    if (!sourceImageUrls.length) {
      return NextResponse.json(
        {
          error:
            "No source image available. Add at least one product image or pass sourceImageUrl/sourceImageUrls.",
        },
        { status: 400 }
      );
    }
    const colorReferenceImageUrl = sanitizeUrl(body.colorReferenceImageUrl);
    const bucket = adminStorage.bucket();
    const requestedAngles = normalizeProductImageAngles(
      Array.isArray(body.angles) && body.angles.length > 0
        ? body.angles
        : body.targetAngle
          ? [body.targetAngle]
          : [],
      ["front"]
    );
    const generationBatchId = randomUUID();
    const angleErrors: Array<{
      angle: ProductImageAngle;
      message: string;
      status: number | null;
      code: string | null;
    }> = [];
    const generatedEntries: Array<{
      angle: ProductImageAngle;
      imageUrl: string;
      generation: Awaited<ReturnType<typeof generateProfessionalProductImage>>;
      consistencyReferenceImageUrl: string | null;
    }> = [];
    let lockedProfileId = sanitizeUrl(body.preferredProfileId) || undefined;
    let consistencyAnchorUrl: string | null = null;

    for (const angle of requestedAngles) {
      try {
        const generation = await generateProfessionalProductImage({
          sourceImageUrl: sourceImageUrls[0],
          sourceImageUrls,
          colorReferenceImageUrl: colorReferenceImageUrl || undefined,
          consistencyReferenceImageUrl: consistencyAnchorUrl || undefined,
          productName: product.nameEs || product.nameEn,
          productCategory: product.category,
          productColors: Array.isArray(product.colors) ? product.colors : [],
          preferredProfileId: lockedProfileId,
          customPrompt: customPrompt || undefined,
          targetColor: targetColor || undefined,
          targetAngle: angle,
        });
        if (!lockedProfileId) {
          lockedProfileId = generation.profile.id;
        }

        const ext = extensionFromMimeType(generation.mimeType);
        const fileName = `products/generated/${id}/${Date.now()}-${angle}-${randomUUID()}.${ext}`;
        const file = bucket.file(fileName);

        await file.save(generation.imageBuffer, {
          metadata: {
            contentType: generation.mimeType,
          },
        });
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        await adminDb.collection("productImageGenerations").add({
          productId: id,
          generationBatchId,
          generatedImageUrl: publicUrl,
          sourceImageUrl: sourceImageUrls[0],
          sourceImageUrls,
          sourceImageHash: generation.sourceImageHash,
          sourceImageHashes: generation.sourceImageHashes,
          colorReferenceImageUrl: colorReferenceImageUrl || null,
          colorReferenceImageHash: generation.colorReferenceImageHash,
          consistencyReferenceImageUrl: consistencyAnchorUrl,
          consistencyReferenceImageHash: generation.consistencyReferenceImageHash,
          profileId: generation.profile.id,
          profileLabel: generation.profile.label,
          profileDescription: generation.profile.description,
          modelUsed: generation.modelUsed,
          outputFormat: generation.outputFormat,
          quality: generation.quality,
          inputFidelity: generation.inputFidelity,
          targetAngle: generation.targetAngle,
          requestedAngles,
          prompt: generation.prompt,
          revisedPrompt: generation.revisedPrompt,
          targetColor: targetColor || null,
          customPrompt: customPrompt || null,
          createdBy: admin.uid,
          createdAt: FieldValue.serverTimestamp(),
        });

        generatedEntries.push({
          angle,
          imageUrl: publicUrl,
          generation,
          consistencyReferenceImageUrl: consistencyAnchorUrl,
        });

        if (!consistencyAnchorUrl) {
          consistencyAnchorUrl = publicUrl;
        }
      } catch (error) {
        const typed = error as Error & { status?: number; code?: string };
        angleErrors.push({
          angle,
          message:
            error instanceof Error
              ? error.message
              : `Unknown generation error for angle ${angle}`,
          status: typeof typed.status === "number" ? typed.status : null,
          code: typeof typed.code === "string" ? typed.code : null,
        });
      }
    }

    if (!generatedEntries.length) {
      const detail = angleErrors
        .map((item) => `${item.angle}: ${item.message}`)
        .join(" | ");
      const error = new Error(
        `Failed to generate any requested angle. ${detail || "No successful generations."}`
      ) as Error & { status?: number; code?: string; attempts?: unknown };
      error.status = 502;
      error.code = "ANGLE_SET_GENERATION_FAILED";
      error.attempts = angleErrors;
      throw error;
    }

    const generatedImageUrls = generatedEntries.map((entry) => entry.imageUrl);
    const placeFirst = body.placeFirst !== false;
    const sourceSizeChart = sanitizeUrl(product.sizeChartImageUrl);

    const withoutDuplicate = existingImages.filter(
      (url) => !generatedImageUrls.includes(url)
    );
    const orderedImages = placeFirst
      ? [...generatedImageUrls, ...withoutDuplicate]
      : [...withoutDuplicate, ...generatedImageUrls];
    const filteredImages = sourceSizeChart
      ? orderedImages.filter((url) => url !== sourceSizeChart)
      : orderedImages;
    const limitedImages = limitImages(filteredImages, body.maxImages ?? undefined);

    await docRef.update({
      images: limitedImages,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const bgConfig = await getBackgroundRemovalConfigurationRuntime();
    const primary = generatedEntries[0];

    return NextResponse.json({
      success: true,
      partialSuccess: angleErrors.length > 0,
      productId: id,
      generatedImageUrl: primary.imageUrl,
      generatedImageUrls,
      generatedAngles: generatedEntries.map((entry) => entry.angle),
      failedAngles: angleErrors,
      profile: primary.generation.profile,
      modelUsed: primary.generation.modelUsed,
      images: limitedImages,
      sourceImageUrl: sourceImageUrls[0],
      sourceImageUrls,
      colorReferenceImageUrl: colorReferenceImageUrl || null,
      targetColor: targetColor || null,
      customPrompt: customPrompt || null,
      targetAngle: primary.generation.targetAngle,
      requestedAngles,
      availableProfiles: getProductModelProfiles(),
      availableAngles: getProductImageAngleOptions(),
      specializedBackgroundRemovalConfigured: bgConfig.configured,
      backgroundRemovalConfiguration: bgConfig,
    });
  } catch (error) {
    console.error("AI image generation error:", error);
    const typed = error as Error & {
      status?: number;
      code?: string;
      attempts?: unknown;
      failures?: unknown;
    };
    const status =
      typeof typed.status === "number" &&
      typed.status >= 400 &&
      typed.status <= 599
        ? typed.status
        : 500;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to generate image: ${error.message}`
            : "Failed to generate image",
        ...(process.env.NODE_ENV !== "production"
          ? {
              debug: {
                status: typed.status || null,
                code: typed.code || null,
                attempts: typed.attempts || null,
                failures: typed.failures || null,
              },
            }
          : {}),
      },
      { status }
    );
  }
}
