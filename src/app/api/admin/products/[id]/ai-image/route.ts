import { randomInt, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { adminDb, adminStorage, isFirebaseConfigured } from "@/lib/firebase/admin";
import {
  generateProfessionalProductImage,
  getProductModelProfiles,
  isProductImageGenerationConfigured,
} from "@/lib/product-image-ai/generator";
import {
  getBackgroundRemovalConfiguration,
  isSpecializedBackgroundRemovalConfigured,
  type ProviderId,
} from "@/lib/product-image-ai/background-removal";

export const maxDuration = 120;

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
  variantCount?: number;
  angleMode?: "auto" | "front_only";
  placeFirst?: boolean;
  maxImages?: number;
}

interface GeneratedVariant {
  variantIndex: number;
  imageUrl: string;
  variantPrompt: string;
  generation: Awaited<ReturnType<typeof generateProfessionalProductImage>>;
}

interface VariantFailure {
  variantIndex: number;
  message: string;
  status?: number;
  code?: string;
}

type BackgroundRemovalProvider =
  | ProviderId
  | "gemini_transparency_pass"
  | "gemini_strict_pass";

function getGeminiEnvPresence() {
  const presence = {
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY?.trim()),
    GOOGLE_API_KEY: Boolean(process.env.GOOGLE_API_KEY?.trim()),
    GOOGLE_GENERATIVE_AI_API_KEY: Boolean(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    ),
    GEMINI_IMAGE_MODEL: Boolean(process.env.GEMINI_IMAGE_MODEL?.trim()),
  };

  const missingKeyCandidates = Object.entries(presence)
    .filter(([name, isSet]) => !isSet && name !== "GEMINI_IMAGE_MODEL")
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

function sanitizeVariantCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  const parsed = Math.floor(value);
  if (parsed < 1) return 1;
  if (parsed > 8) return 8;
  return parsed;
}

function sanitizeAngleMode(value: unknown): "auto" | "front_only" {
  if (value === "front_only") return "front_only";
  return "auto";
}

function pickProfileId(
  preferredProfileId: string | null
): { id: string | undefined; isAuto: boolean } {
  if (preferredProfileId) {
    return { id: preferredProfileId, isAuto: false };
  }
  const profiles = getProductModelProfiles();
  if (!profiles.length) {
    return { id: undefined, isAuto: true };
  }
  const profile = profiles[randomInt(0, profiles.length)];
  return { id: profile.id, isAuto: true };
}

const AUTO_ANGLE_INSTRUCTIONS = [
  "Front full-body camera angle, model facing camera directly.",
  "3/4 left camera angle (about 25 degrees), full body visible.",
  "Left side profile camera angle, full body visible.",
  "3/4 back-left camera angle, full body visible.",
  "Back full-body camera angle, full body visible.",
  "3/4 back-right camera angle, full body visible.",
  "Right side profile camera angle, full body visible.",
  "3/4 right camera angle (about 25 degrees), full body visible.",
];

function buildAngleInstruction(index: number, variantCount: number): string {
  if (variantCount <= 1) {
    return "Front full-body camera angle, model facing camera directly.";
  }
  const preset = AUTO_ANGLE_INSTRUCTIONS[index] || AUTO_ANGLE_INSTRUCTIONS[0];
  return `${preset} Keep garment details exact and keep the same model identity as previous generated variants.`;
}

function buildVariantPrompt({
  basePrompt,
  angleMode,
  variantIndex,
  variantCount,
}: {
  basePrompt: string | null;
  angleMode: "auto" | "front_only";
  variantIndex: number;
  variantCount: number;
}): string {
  const angleInstruction =
    angleMode === "front_only"
      ? "Front full-body camera angle, model facing camera directly. Keep garment details exact and keep the same model identity as previous generated variants."
      : buildAngleInstruction(variantIndex, variantCount);
  return [basePrompt, angleInstruction].filter(Boolean).join("\n");
}

function mergeGeneratedImages({
  existingImages,
  generatedUrls,
  placeFirst,
  sourceSizeChart,
  maxImages,
}: {
  existingImages: string[];
  generatedUrls: string[];
  placeFirst: boolean;
  sourceSizeChart: string | null;
  maxImages?: number;
}): string[] {
  const generatedSet = new Set(generatedUrls);
  const withoutDuplicate = existingImages.filter((url) => !generatedSet.has(url));
  const orderedImages = placeFirst
    ? [...generatedUrls, ...withoutDuplicate]
    : [...withoutDuplicate, ...generatedUrls];
  const filteredImages = sourceSizeChart
    ? orderedImages.filter((url) => url !== sourceSizeChart)
    : orderedImages;
  return limitImages(filteredImages, maxImages);
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

  const bgRemovalConfig = getBackgroundRemovalConfiguration();

  return NextResponse.json({
    productId: id,
    availableProfiles: getProductModelProfiles(),
    configured: isProductImageGenerationConfigured(),
    specializedBackgroundRemovalConfigured:
      isSpecializedBackgroundRemovalConfigured(),
    backgroundRemovalConfiguration: bgRemovalConfig,
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
    const variantCount = sanitizeVariantCount(body.variantCount);
    const angleMode = sanitizeAngleMode(body.angleMode);
    const preferredProfileId = sanitizeShortText(body.preferredProfileId, 80);
    const bgRemovalConfig = getBackgroundRemovalConfiguration();
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
    const generatedVariants: GeneratedVariant[] = [];
    const variantFailures: VariantFailure[] = [];
    const profileSelection = pickProfileId(preferredProfileId);
    let fixedProfileId = profileSelection.id;

    for (let index = 0; index < variantCount; index += 1) {
      const variantIndex = index + 1;
      const variantPrompt = buildVariantPrompt({
        basePrompt: customPrompt,
        angleMode,
        variantIndex: index,
        variantCount,
      });

      try {
        const generation = await generateProfessionalProductImage({
          sourceImageUrl: sourceImageUrls[0],
          sourceImageUrls,
          colorReferenceImageUrl: colorReferenceImageUrl || undefined,
          productName: product.nameEs || product.nameEn,
          productCategory: product.category,
          productColors: Array.isArray(product.colors) ? product.colors : [],
          preferredProfileId: fixedProfileId || undefined,
          customPrompt: variantPrompt || undefined,
          targetColor: targetColor || undefined,
        });

        if (!fixedProfileId) {
          fixedProfileId = generation.profile.id;
        }

        const ext = extensionFromMimeType(generation.mimeType);
        const fileName = `products/generated/${id}/${Date.now()}-v${variantIndex}-${randomUUID()}.${ext}`;
        const file = bucket.file(fileName);

        await file.save(generation.imageBuffer, {
          metadata: {
            contentType: generation.mimeType,
          },
        });
        await file.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        generatedVariants.push({
          variantIndex,
          imageUrl: publicUrl,
          variantPrompt,
          generation,
        });
      } catch (error) {
        const typed = error as Error & { status?: number; code?: string };
        variantFailures.push({
          variantIndex,
          message:
            typed.message ||
            `Variant ${variantIndex} could not be generated.`,
          status: typed.status,
          code: typed.code,
        });
      }
    }

    if (!generatedVariants.length) {
      const primaryFailure = variantFailures[0];
      const failed = new Error(
        primaryFailure?.message ||
          "No image variants could be generated with current references."
      ) as Error & { status?: number; code?: string; attempts?: unknown };
      failed.status = primaryFailure?.status || 502;
      failed.code = primaryFailure?.code || "NO_VARIANTS_GENERATED";
      failed.attempts = variantFailures;
      throw failed;
    }

    const generatedImageUrls = generatedVariants.map((item) => item.imageUrl);
    const placeFirst = body.placeFirst !== false;
    const sourceSizeChart = sanitizeUrl(product.sizeChartImageUrl);
    const limitedImages = mergeGeneratedImages({
      existingImages,
      generatedUrls: generatedImageUrls,
      placeFirst,
      sourceSizeChart,
      maxImages: body.maxImages ?? undefined,
    });

    await docRef.update({
      images: limitedImages,
      updatedAt: FieldValue.serverTimestamp(),
    });

    for (const variant of generatedVariants) {
      await adminDb.collection("productImageGenerations").add({
        productId: id,
        variantIndex: variant.variantIndex,
        variantCount,
        angleMode,
        generatedImageUrl: variant.imageUrl,
        sourceImageUrl: sourceImageUrls[0],
        sourceImageUrls,
        sourceImageHash: variant.generation.sourceImageHash,
        sourceImageHashes: variant.generation.sourceImageHashes,
        colorReferenceImageUrl: colorReferenceImageUrl || null,
        colorReferenceImageHash: variant.generation.colorReferenceImageHash,
        profileId: variant.generation.profile.id,
        profileLabel: variant.generation.profile.label,
        profileDescription: variant.generation.profile.description,
        modelUsed: variant.generation.modelUsed,
        outputFormat: variant.generation.outputFormat,
        quality: variant.generation.quality,
        inputFidelity: variant.generation.inputFidelity,
        backgroundRemovalApplied: variant.generation.backgroundRemovalApplied,
        backgroundRemovalProvider:
          (variant.generation.backgroundRemovalProvider as BackgroundRemovalProvider | null) ||
          null,
        backgroundRemovalError: variant.generation.backgroundRemovalError || null,
        backgroundRemovalAttempts: variant.generation.backgroundRemovalAttempts || [],
        backgroundRemovalConfiguredProviders:
          variant.generation.backgroundRemovalConfiguredProviders || [],
        backgroundRemovalProviderOrder:
          variant.generation.backgroundRemovalProviderOrder || [],
        prompt: variant.generation.prompt,
        revisedPrompt: variant.generation.revisedPrompt,
        targetColor: targetColor || null,
        customPrompt: customPrompt || null,
        variantPrompt: variant.variantPrompt || null,
        createdBy: admin.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    const primaryVariant = generatedVariants[0];
    const profile = primaryVariant.generation.profile;
    const warnings = variantFailures.map((failure) => ({
      variantIndex: failure.variantIndex,
      message: failure.message,
      status: failure.status || null,
      code: failure.code || null,
    }));

    return NextResponse.json({
      success: true,
      productId: id,
      generatedImageUrl: primaryVariant.imageUrl,
      generatedImageUrls,
      generatedCount: generatedVariants.length,
      requestedVariantCount: variantCount,
      failedVariantCount: variantFailures.length,
      warnings,
      profile,
      modelUsed: primaryVariant.generation.modelUsed,
      images: limitedImages,
      sourceImageUrl: sourceImageUrls[0],
      sourceImageUrls,
      colorReferenceImageUrl: colorReferenceImageUrl || null,
      targetColor: targetColor || null,
      customPrompt: customPrompt || null,
      angleMode,
      variantCount,
      specializedBackgroundRemovalConfigured: bgRemovalConfig.configured,
      backgroundRemovalConfiguration: bgRemovalConfig,
      backgroundRemoval: {
        applied: primaryVariant.generation.backgroundRemovalApplied,
        provider: primaryVariant.generation.backgroundRemovalProvider || null,
        error: primaryVariant.generation.backgroundRemovalError || null,
        attempts: primaryVariant.generation.backgroundRemovalAttempts || [],
        configuredProviders:
          primaryVariant.generation.backgroundRemovalConfiguredProviders || [],
        providerOrder:
          primaryVariant.generation.backgroundRemovalProviderOrder || [],
      },
      availableProfiles: getProductModelProfiles(),
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
