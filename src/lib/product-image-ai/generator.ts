import { createHash, randomInt } from "node:crypto";
import sharp from "sharp";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import {
  removeBackgroundSpecializedWithDiagnostics,
} from "./background-removal";

type OutputFormat = "png" | "webp" | "jpeg";
type Quality = "low" | "medium" | "high" | "auto";
type InputFidelity = "high" | "low";

interface SourceImagePayload {
  buffer: Buffer;
  base64: string;
  mimeType: string;
  hash: string;
}

interface GeminiInlineImagePart {
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
  inline_data?: {
    mime_type?: string;
    data?: string;
  };
}

interface GeminiTextPart {
  text?: string;
}

interface GeminiCandidate {
  finishReason?: string;
  content?: {
    parts?: Array<GeminiInlineImagePart & GeminiTextPart>;
  };
}

interface GeminiGenerateResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

interface GeminiImageResult {
  imageBuffer: Buffer;
  mimeType: string;
  textNotes: string[];
}

export interface ProductModelProfile {
  id: string;
  label: string;
  description: string;
}

export type ProductImageAngle =
  | "front"
  | "front_three_quarter_left"
  | "front_three_quarter_right"
  | "left_profile"
  | "right_profile"
  | "back";

interface ProductImageAnglePreset {
  id: ProductImageAngle;
  label: string;
  description: string;
  promptInstruction: string;
  cameraInstruction: string;
}

export interface ProductImageAngleOption {
  id: ProductImageAngle;
  label: string;
  description: string;
}

export interface GenerateProductImageInput {
  sourceImageUrl?: string;
  sourceImageUrls?: string[];
  colorReferenceImageUrl?: string;
  consistencyReferenceImageUrl?: string;
  productName?: string;
  productCategory?: string;
  productColors?: string[];
  preferredProfileId?: string;
  customPrompt?: string;
  targetColor?: string;
  targetAngle?: ProductImageAngle;
}

export interface GenerateProductImageResult {
  imageBuffer: Buffer;
  mimeType: string;
  prompt: string;
  revisedPrompt: string | null;
  modelUsed: string;
  profile: ProductModelProfile;
  sourceImageHash: string;
  sourceImageHashes: string[];
  colorReferenceImageHash: string | null;
  consistencyReferenceImageHash: string | null;
  outputFormat: OutputFormat;
  quality: Quality;
  inputFidelity: InputFidelity;
  targetAngle: ProductImageAngle;
}

function parseCsvEnvList(value: string | undefined): string[] {
  if (!value || !value.trim()) return [];
  const deduped = new Set<string>();
  for (const item of value.split(",")) {
    const normalized = item.trim();
    if (!normalized) continue;
    deduped.add(normalized);
  }
  return [...deduped];
}

const DEFAULT_IMAGE_MODEL_FALLBACKS = [
  // Gemini 3 Pro Image Preview — highest quality, supports up to 14 reference images.
  "gemini-3-pro-image-preview",
  // Stable Gemini 2.5 Flash Image (GA) — faster, lower quota cost.
  "gemini-2.5-flash-image",
  // NOTE: gemini-2.5-flash-image-preview was shut down January 15, 2026. Do NOT re-add.
];

const MODEL_CANDIDATES = (() => {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const push = (value: string | undefined | null): void => {
    if (!value || !value.trim()) return;
    const normalized = value.trim();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  // Optional primary override.
  push(process.env.GEMINI_IMAGE_MODEL);

  // Optional explicit ordered fallback list, comma-separated.
  for (const fallbackModel of parseCsvEnvList(
    process.env.GEMINI_IMAGE_FALLBACK_MODELS
  )) {
    push(fallbackModel);
  }

  for (const defaultModel of DEFAULT_IMAGE_MODEL_FALLBACKS) {
    push(defaultModel);
  }

  return candidates;
})();

const IMAGE_ASPECT_RATIO = process.env.GEMINI_IMAGE_ASPECT_RATIO || "3:4";
const IMAGE_SIZE = process.env.GEMINI_IMAGE_SIZE || "2K";
const MAX_REFERENCE_IMAGES = Number.parseInt(
  process.env.GEMINI_IMAGE_MAX_REFERENCE_IMAGES || "3",
  10
);
const MAX_TOTAL_REFERENCE_BYTES = Number.parseInt(
  process.env.GEMINI_IMAGE_MAX_TOTAL_BYTES || String(12 * 1024 * 1024),
  10
);
const SAFE_MAX_REFERENCE_IMAGES =
  Number.isFinite(MAX_REFERENCE_IMAGES) && MAX_REFERENCE_IMAGES > 0
    ? MAX_REFERENCE_IMAGES
    : 3;
const SAFE_MAX_TOTAL_REFERENCE_BYTES =
  Number.isFinite(MAX_TOTAL_REFERENCE_BYTES) && MAX_TOTAL_REFERENCE_BYTES > 0
    ? MAX_TOTAL_REFERENCE_BYTES
    : 12 * 1024 * 1024;
const TRANSPARENCY_PASS_ENABLED =
  (process.env.GEMINI_IMAGE_TRANSPARENCY_PASS || "true").toLowerCase() !==
  "false";
const LOCAL_CUTOUT_FALLBACK_ENABLED =
  (process.env.GEMINI_IMAGE_LOCAL_CUTOUT_FALLBACK || "false").toLowerCase() ===
  "true";
const OUTPUT_SCALE_FACTOR_RAW = Number.parseFloat(
  process.env.GEMINI_IMAGE_OUTPUT_SCALE_FACTOR || "2"
);
const OUTPUT_SCALE_FACTOR =
  Number.isFinite(OUTPUT_SCALE_FACTOR_RAW) && OUTPUT_SCALE_FACTOR_RAW >= 2
    ? OUTPUT_SCALE_FACTOR_RAW
    : 2;
const OUTPUT_MAX_LONG_EDGE_RAW = Number.parseInt(
  process.env.GEMINI_IMAGE_OUTPUT_MAX_LONG_EDGE || "0",
  10
);
const OUTPUT_MAX_LONG_EDGE =
  Number.isFinite(OUTPUT_MAX_LONG_EDGE_RAW) && OUTPUT_MAX_LONG_EDGE_RAW > 0
    ? OUTPUT_MAX_LONG_EDGE_RAW
    : 0;
const DEFAULT_TARGET_ANGLE: ProductImageAngle = "front";

const ANGLE_PRESETS: ProductImageAnglePreset[] = [
  {
    id: "front",
    label: "Frontal",
    description: "Vista frontal recta de catalogo",
    promptInstruction:
      "Frontal straight-on ecommerce pose, shoulders square to camera, hips square, both feet visible.",
    cameraInstruction:
      "Camera at chest height, no dutch angle, maintain neutral perspective.",
  },
  {
    id: "front_three_quarter_left",
    label: "3/4 Izquierdo",
    description: "Vista 3/4 orientada hacia la izquierda",
    promptInstruction:
      "Three-quarter front-left pose (about 35-45 degrees), torso and hips rotated together while preserving natural stance.",
    cameraInstruction:
      "Maintain same camera distance as canonical front shot; avoid zoom drift.",
  },
  {
    id: "front_three_quarter_right",
    label: "3/4 Derecho",
    description: "Vista 3/4 orientada hacia la derecha",
    promptInstruction:
      "Three-quarter front-right pose (about 35-45 degrees), torso and hips rotated together while preserving natural stance.",
    cameraInstruction:
      "Maintain same camera distance as canonical front shot; avoid zoom drift.",
  },
  {
    id: "left_profile",
    label: "Perfil Izquierdo",
    description: "Vista lateral izquierda completa",
    promptInstruction:
      "Strict left-side profile pose (about 85-95 degrees), both legs aligned naturally, arms relaxed.",
    cameraInstruction:
      "Keep full-body framing and equal head-to-feet scale relative to canonical shot.",
  },
  {
    id: "right_profile",
    label: "Perfil Derecho",
    description: "Vista lateral derecha completa",
    promptInstruction:
      "Strict right-side profile pose (about 85-95 degrees), both legs aligned naturally, arms relaxed.",
    cameraInstruction:
      "Keep full-body framing and equal head-to-feet scale relative to canonical shot.",
  },
  {
    id: "back",
    label: "Espalda",
    description: "Vista trasera completa",
    promptInstruction:
      "Back view pose (about 180 degrees), keep posture elegant and neutral with visible full body.",
    cameraInstruction:
      "Maintain same camera distance and vertical framing as canonical front shot.",
  },
];

const ANGLE_PRESET_MAP = new Map<ProductImageAngle, ProductImageAnglePreset>(
  ANGLE_PRESETS.map((preset) => [preset.id, preset])
);

const MODEL_PROFILES: ProductModelProfile[] = [
  {
    id: "model_01",
    label: "Model 01",
    description:
      "adult Latina woman with warm medium skin tone, shoulder-length dark brown hair, polished natural makeup",
  },
  {
    id: "model_02",
    label: "Model 02",
    description:
      "adult Black woman with deep skin tone, short natural curls, clean editorial makeup",
  },
  {
    id: "model_03",
    label: "Model 03",
    description:
      "adult woman with fair skin, straight ash-blonde hair, refined glam makeup",
  },
  {
    id: "model_04",
    label: "Model 04",
    description:
      "adult woman with olive skin, long wavy brunette hair, premium studio beauty look",
  },
  {
    id: "model_05",
    label: "Model 05",
    description:
      "adult East Asian woman with light skin, sleek black bob haircut, soft natural makeup",
  },
  {
    id: "model_06",
    label: "Model 06",
    description:
      "adult South Asian woman with medium-brown skin, long straight black hair, subtle luminous makeup",
  },
  {
    id: "model_07",
    label: "Model 07",
    description:
      "adult woman with tan skin, auburn wavy hair, professional daytime makeup",
  },
  {
    id: "model_08",
    label: "Model 08",
    description:
      "adult woman with deep tan skin, platinum-blonde curls, precise high-fashion makeup",
  },
  {
    id: "model_09",
    label: "Model 09",
    description:
      "adult woman with fair-to-light skin, long copper hair, defined but natural makeup",
  },
  {
    id: "model_10",
    label: "Model 10",
    description:
      "adult Afro-Latina woman with rich brown skin, shoulder-length curls, elegant studio makeup",
  },
];

function inferOutputFormat(mimeType: string): OutputFormat {
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpeg";
  return "png";
}

function inferQuality(modelUsed: string): Quality {
  if (modelUsed.includes("pro")) return "high";
  if (modelUsed.includes("flash")) return "medium";
  return "auto";
}

function inferInputFidelity(modelUsed: string): InputFidelity {
  if (modelUsed.includes("pro")) return "high";
  return "low";
}

function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    null;
  if (!key) return null;
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isProductImageGenerationConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getProductModelProfiles(): ProductModelProfile[] {
  return MODEL_PROFILES;
}

export function getProductImageAngleOptions(): ProductImageAngleOption[] {
  return ANGLE_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: preset.description,
  }));
}

export function isProductImageAngle(value: string): value is ProductImageAngle {
  return ANGLE_PRESET_MAP.has(value as ProductImageAngle);
}

export function normalizeProductImageAngles(
  values: unknown,
  fallback: ProductImageAngle[] = [DEFAULT_TARGET_ANGLE]
): ProductImageAngle[] {
  if (!Array.isArray(values)) return [...fallback];
  const deduped: ProductImageAngle[] = [];
  for (const item of values) {
    if (typeof item !== "string") continue;
    const normalized = item.trim().toLowerCase();
    if (!isProductImageAngle(normalized)) continue;
    if (!deduped.includes(normalized)) {
      deduped.push(normalized);
    }
  }
  return deduped.length ? deduped : [...fallback];
}

function resolveAnglePreset(targetAngle?: ProductImageAngle): ProductImageAnglePreset {
  if (targetAngle) {
    const explicit = ANGLE_PRESET_MAP.get(targetAngle);
    if (explicit) return explicit;
  }
  return ANGLE_PRESET_MAP.get(DEFAULT_TARGET_ANGLE) as ProductImageAnglePreset;
}

function getRandomProfile(preferredProfileId?: string): ProductModelProfile {
  if (preferredProfileId) {
    const match = MODEL_PROFILES.find((profile) => profile.id === preferredProfileId);
    if (match) return match;
  }
  const index = randomInt(0, MODEL_PROFILES.length);
  return MODEL_PROFILES[index];
}

function pickMimeType(contentType: string | null): string {
  if (!contentType) return "image/png";
  if (contentType.includes("png")) return "image/png";
  if (contentType.includes("webp")) return "image/webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "image/jpeg";
  return "image/png";
}

async function fetchSourceImage(sourceImageUrl: string): Promise<SourceImagePayload> {
  const response = await fetch(sourceImageUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok) {
    const error = new Error(
      `Failed to fetch source image (${response.status})`
    ) as Error & {
      status?: number;
      code?: string;
      sourceImageUrl?: string;
    };
    error.status = response.status;
    error.code = "SOURCE_IMAGE_FETCH_FAILED";
    error.sourceImageUrl = sourceImageUrl;
    throw error;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    buffer,
    base64: buffer.toString("base64"),
    mimeType: pickMimeType(response.headers.get("content-type")),
    hash: createHash("sha256").update(buffer).digest("hex"),
  };
}

function normalizeSourceImageUrls(input: GenerateProductImageInput): string[] {
  const normalized: string[] = [];
  const candidates: string[] = [];

  if (typeof input.sourceImageUrl === "string" && input.sourceImageUrl.trim()) {
    candidates.push(input.sourceImageUrl.trim());
  }
  if (Array.isArray(input.sourceImageUrls)) {
    for (const item of input.sourceImageUrls) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim();
      if (!trimmed) continue;
      candidates.push(trimmed);
    }
  }

  for (const url of candidates) {
    if (!normalized.includes(url)) {
      normalized.push(url);
    }
    if (normalized.length >= SAFE_MAX_REFERENCE_IMAGES) {
      break;
    }
  }

  return normalized;
}

async function fetchSourceImages(sourceImageUrls: string[]): Promise<SourceImagePayload[]> {
  const payloads: SourceImagePayload[] = [];
  let totalBytes = 0;
  const failures: Array<{ url: string; message: string; status?: number }> = [];

  for (const sourceImageUrl of sourceImageUrls) {
    let payload: SourceImagePayload;
    try {
      payload = await fetchSourceImage(sourceImageUrl);
    } catch (error) {
      const typed = error as Error & { status?: number };
      failures.push({
        url: sourceImageUrl,
        message: typed.message || "unknown source image fetch error",
        status: typed.status,
      });
      continue;
    }
    if (payloads.length === 0) {
      payloads.push(payload);
      totalBytes = payload.buffer.length;
      continue;
    }
    if (totalBytes + payload.buffer.length > SAFE_MAX_TOTAL_REFERENCE_BYTES) {
      continue;
    }
    payloads.push(payload);
    totalBytes += payload.buffer.length;
  }

  if (!payloads.length) {
    const detail = failures
      .map((item) => `${item.url}: ${item.message}`)
      .join(" | ");
    const status = failures.some((item) => item.status === 403 || item.status === 404)
      ? 400
      : 422;
    const error = new Error(
      `None of the selected source images could be used. ${detail || "No valid image references available."}`
    ) as Error & { status?: number; code?: string; failures?: unknown };
    error.status = status;
    error.code = "SOURCE_IMAGES_UNUSABLE";
    error.failures = failures;
    throw error;
  }

  return payloads;
}

function buildPrompt({
  profile,
  productName,
  productCategory,
  productColors,
  customPrompt,
  targetColor,
  targetAngle,
  referenceImageCount,
  hasColorReferenceImage,
  hasConsistencyReferenceImage,
}: {
  profile: ProductModelProfile;
  productName?: string;
  productCategory?: string;
  productColors?: string[];
  customPrompt?: string;
  targetColor?: string;
  targetAngle?: ProductImageAngle;
  referenceImageCount: number;
  hasColorReferenceImage: boolean;
  hasConsistencyReferenceImage: boolean;
}): string {
  const anglePreset = resolveAnglePreset(targetAngle);
  const contextParts = [
    productName ? `Product name: ${productName}.` : "",
    productCategory ? `Category: ${productCategory}.` : "",
    productColors?.length
      ? `Color hints from catalog: ${productColors.join(", ")}.`
      : "",
    targetColor
      ? `Target garment color for this generation: ${targetColor}. Prioritize this tone exactly.`
      : "",
    `Number of garment reference images provided: ${referenceImageCount}.`,
    hasColorReferenceImage
      ? "A separate color reference image is also provided. Use it only to match garment color tone."
      : "",
    `Target camera angle for this output: ${anglePreset.label}.`,
    hasConsistencyReferenceImage
      ? "A generated consistency anchor image is provided. Match body proportions, garment scale, and framing to that anchor."
      : "",
  ].filter(Boolean);

  const sanitizedCustomPrompt =
    customPrompt && customPrompt.trim().length > 0
      ? customPrompt.trim().slice(0, 1200)
      : "";

  return `You are an expert ecommerce fashion photographer and retoucher.
Generate one premium studio product image from the provided references.

Source fidelity rules (mandatory):
- Use the garment from all references as the exact same product.
- Treat reference image #1 as canonical and use other references only to recover missing details.
- Preserve exact construction details: panel cuts, seams, stitch lines, hook/zip closure rows, strap width/placement, leg length, edge trims, lace motifs, and compression zones.
- Preserve exact garment color family and tone. Do not shift hue or saturation beyond realistic studio lighting.
- Preserve textile realism: weave, micro-wrinkles, material sheen, and fabric thickness must look physically plausible.
- Do not redesign, simplify, or invent new garment features.
- If a person appears in reference, replace only the person using this model profile while keeping garment identity unchanged: ${profile.description}.

Model, pose, and framing rules:
- Exactly one adult female model, full body visible from head to feet, centered.
- ${anglePreset.promptInstruction}
- Keep anatomy natural and realistic: correct hands/fingers, shoulders, hips, limbs, and body proportions.
- Keep garment fit flattering but realistic; no extreme body warping.
- Maintain clean composition with padding around silhouette for storefront card cropping.

Lighting and camera rules:
- High-end studio look, soft key + fill lighting, controlled highlights, minimal harsh shadows.
- ${anglePreset.cameraInstruction}
- Sharp focus on garment texture and closures; avoid blur and over-smoothing.
- Photorealistic skin texture and face detail; avoid plastic skin.
- No cinematic color grading, no stylized filters.

Cross-angle consistency lock (mandatory):
- Keep garment scale, waistline height, hemline length, and strap placement consistent with references.
- Do not change garment size ratio relative to model torso/hips/legs across angle variants.
- Preserve same model identity, body proportions, and face identity across rerenders.
- Keep camera distance and crop scale stable so all angle outputs align as a coherent set.

Output constraints (mandatory):
- Background must be truly transparent (real alpha), with clean edges around hair, body, and garment.
- Return a transparent PNG suitable for ecommerce listing cards.
- No text, logos, watermark, props, furniture, extra people, mirrored duplicates, or collage layout.
- No checkerboard, no fake transparency pattern, no solid studio backdrop in final output.

Quality checklist before returning:
- Garment details match references and remain structurally consistent.
- Model anatomy looks natural (especially hands and feet).
- Product edges are clean with no jagged halos.
- Final render is marketing-ready, high-detail, and catalog quality.

${contextParts.join("\n")}
${sanitizedCustomPrompt ? `\nUser adjustment instructions:\n${sanitizedCustomPrompt}` : ""}`.trim();
}

async function upscaleImageToMinimumResolution(
  image: GeminiImageResult
): Promise<GeminiImageResult> {
  if (OUTPUT_SCALE_FACTOR < 2) {
    return image;
  }

  try {
    const source = sharp(image.imageBuffer, { failOn: "none" });
    const meta = await source.metadata();
    if (!meta.width || !meta.height) {
      return image;
    }

    let targetWidth = Math.max(1, Math.round(meta.width * OUTPUT_SCALE_FACTOR));
    let targetHeight = Math.max(1, Math.round(meta.height * OUTPUT_SCALE_FACTOR));

    if (OUTPUT_MAX_LONG_EDGE > 0) {
      const longEdge = Math.max(targetWidth, targetHeight);
      if (longEdge > OUTPUT_MAX_LONG_EDGE) {
        const scale = OUTPUT_MAX_LONG_EDGE / longEdge;
        targetWidth = Math.max(1, Math.round(targetWidth * scale));
        targetHeight = Math.max(1, Math.round(targetHeight * scale));
      }
    }

    if (targetWidth <= meta.width || targetHeight <= meta.height) {
      return image;
    }

    let pipeline = source.resize({
      width: targetWidth,
      height: targetHeight,
      fit: "fill",
      kernel: "lanczos3",
      withoutEnlargement: false,
    });

    let mimeType = image.mimeType;
    if (image.mimeType.includes("png")) {
      pipeline = pipeline.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
      mimeType = "image/png";
    } else if (image.mimeType.includes("webp")) {
      pipeline = pipeline.webp({
        quality: 100,
        lossless: true,
      });
      mimeType = "image/webp";
    } else if (
      image.mimeType.includes("jpeg") ||
      image.mimeType.includes("jpg")
    ) {
      pipeline = pipeline.jpeg({
        quality: 95,
        mozjpeg: true,
      });
      mimeType = "image/jpeg";
    } else {
      pipeline = pipeline.png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
      mimeType = "image/png";
    }

    return {
      imageBuffer: await pipeline.toBuffer(),
      mimeType,
      textNotes: image.textNotes,
    };
  } catch {
    return image;
  }
}

function isModelNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string; status?: number };
  if (maybe.status === 404) return true;
  const code = String(maybe.code || "").toLowerCase();
  if (code.includes("not_found") || code.includes("model_not_found")) return true;
  const message = String(maybe.message || "").toLowerCase();
  return message.includes("model") && message.includes("not found");
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string; status?: number };
  if (maybe.status === 429) return true;
  const code = String(maybe.code || "").toLowerCase();
  if (code.includes("resource_exhausted") || code.includes("quota")) return true;
  const message = String(maybe.message || "").toLowerCase();
  return message.includes("quota") || message.includes("rate limit");
}

function isNoImageDataError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  const code = String(maybe.code || "").toLowerCase();
  if (code.includes("no_image_data")) return true;
  if (code.includes("no_transparency")) return true;
  const message = String(maybe.message || "").toLowerCase();
  return (
    message.includes("did not return image data") ||
    message.includes("without real transparency")
  );
}

function isImageSafetyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: string };
  const message = String(maybe.message || "").toLowerCase();
  return (
    message.includes("image_safety") ||
    message.includes("safety") ||
    message.includes("blocked")
  );
}

function isRetryableModelError(error: unknown): boolean {
  if (isModelNotFoundError(error)) return true;
  if (isQuotaError(error)) return true;
  if (isNoImageDataError(error)) return true;
  if (!error || typeof error !== "object") return false;
  const maybe = error as { status?: number; message?: string; code?: string };
  const code = String(maybe.code || "").toLowerCase();
  if (code.includes("empty_response")) return true;
  const status = maybe.status || 0;
  if (status === 408 || status === 409 || status === 425) return true;
  if (status >= 500 && status <= 599) return true;
  const message = String(maybe.message || "").toLowerCase();
  if (status === 400) {
    if (message.includes("does not support the requested response modalities")) {
      return true;
    }
    if (message.includes("unable to process input image")) {
      return true;
    }
  }
  return message.includes("temporarily unavailable");
}

function isInputPayloadError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { status?: number; message?: string };
  const status = maybe.status || 0;
  if (status === 413) return true;
  if (status !== 400) return false;
  const message = String(maybe.message || "").toLowerCase();
  return (
    message.includes("payload") ||
    message.includes("too large") ||
    message.includes("request size") ||
    message.includes("request payload") ||
    message.includes("unable to process input image") ||
    message.includes("invalid argument")
  );
}

function extractGeminiPartImage(part: GeminiInlineImagePart): {
  data: string;
  mimeType: string;
} | null {
  if (part.inlineData?.data) {
    return {
      data: part.inlineData.data,
      mimeType: part.inlineData.mimeType || "image/png",
    };
  }
  if (part.inline_data?.data) {
    return {
      data: part.inline_data.data,
      mimeType: part.inline_data.mime_type || "image/png",
    };
  }
  return null;
}

function parseGeminiResponse(payload: unknown): GeminiImageResult {
  if (!payload || typeof payload !== "object") {
    const error = new Error("Gemini returned an empty or unparseable response payload") as Error & {
      code?: string;
      status?: number;
    };
    error.code = "EMPTY_RESPONSE";
    error.status = 500;
    throw error;
  }

  const response = payload as GeminiGenerateResponse;
  if (response.error) {
    throw Object.assign(new Error(response.error.message || "Gemini request failed"), {
      code: response.error.status || response.error.code,
      status: response.error.code,
    });
  }

  const candidates = Array.isArray(response.candidates) ? response.candidates : [];
  const textNotes: string[] = [];

  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      if (part.text) {
        textNotes.push(part.text.trim());
      }
      const imagePart = extractGeminiPartImage(part);
      if (!imagePart) continue;
      return {
        imageBuffer: Buffer.from(imagePart.data, "base64"),
        mimeType: imagePart.mimeType,
        textNotes,
      };
    }
  }

  const finishReasons = candidates
    .map((candidate) => candidate.finishReason || "")
    .filter(Boolean);
  const noteText = textNotes.filter(Boolean).join(" | ");
  const reasonText = finishReasons.length
    ? ` finishReasons=${finishReasons.join(",")}`
    : "";
  const details = noteText ? ` notes=${noteText}` : "";
  const error = new Error(
    `Gemini did not return image data.${reasonText}${details}`.trim()
  ) as Error & { code?: string };
  error.code = "NO_IMAGE_DATA";
  throw error;
}

function buildImageConfig(modelName: string): Record<string, unknown> {
  const config: Record<string, unknown> = {
    aspectRatio: IMAGE_ASPECT_RATIO,
  };
  if (modelName.includes("pro")) {
    config.imageSize = IMAGE_SIZE;
  }
  return config;
}

async function generateImageWithGemini({
  apiKey,
  modelName,
  prompt,
  sourceImages,
  colorReferenceImage,
  consistencyReferenceImage,
}: {
  apiKey: string;
  modelName: string;
  prompt: string;
  sourceImages: SourceImagePayload[];
  colorReferenceImage?: SourceImagePayload | null;
  consistencyReferenceImage?: SourceImagePayload | null;
}): Promise<GeminiImageResult> {
  const parts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [{ text: prompt }];

  for (const sourceImage of sourceImages) {
    parts.push({
      inline_data: {
        mime_type: sourceImage.mimeType,
        data: sourceImage.base64,
      },
    });
  }
  if (colorReferenceImage) {
    parts.push({
      text:
        "The next image is color reference only. Keep garment design from previous references and use this image only to match garment color tone.",
    });
    parts.push({
      inline_data: {
        mime_type: colorReferenceImage.mimeType,
        data: colorReferenceImage.base64,
      },
    });
  }
  if (consistencyReferenceImage) {
    parts.push({
      text:
        "The next image is a consistency anchor. Preserve model identity, garment scale, body proportions, and framing to match this anchor while applying the requested camera angle.",
    });
    parts.push({
      inline_data: {
        mime_type: consistencyReferenceImage.mimeType,
        data: consistencyReferenceImage.base64,
      },
    });
  }

  const payload = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: buildImageConfig(modelName),
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  const rawText = await response.text();
  let parsed: unknown = null;
  try {
    parsed = rawText ? (JSON.parse(rawText) as unknown) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      parsed && typeof parsed === "object" && "error" in parsed
        ? (parsed as GeminiGenerateResponse).error?.message ||
          `Gemini request failed (${response.status})`
        : `Gemini request failed (${response.status})`;
    const err = new Error(message) as Error & {
      status?: number;
      code?: string;
    };
    err.status = response.status;
    err.code =
      parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as GeminiGenerateResponse).error?.status || "")
        : undefined;
    throw err;
  }

  return parseGeminiResponse(parsed);
}

function pngHasAlphaChannel(buffer: Buffer): boolean {
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  if (buffer.length < 33) return false;
  if (!buffer.subarray(0, 8).equals(pngSignature)) return false;

  const ihdrType = buffer.subarray(12, 16).toString("ascii");
  if (ihdrType !== "IHDR") return false;

  const colorType = buffer[25];
  if (colorType === 4 || colorType === 6) return true;
  return buffer.includes(Buffer.from("tRNS", "ascii"));
}

function pngHasTransparentPixels(buffer: Buffer): boolean {
  try {
    const decoded = PNG.sync.read(buffer);
    for (let index = 3; index < decoded.data.length; index += 4) {
      if (decoded.data[index] < 255) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function decodePng(buffer: Buffer): ReturnType<typeof PNG.sync.read> | null {
  try {
    return PNG.sync.read(buffer);
  } catch {
    return null;
  }
}

function pngTransparencyQualityLooksHealthy(buffer: Buffer): boolean {
  const decoded = decodePng(buffer);
  if (!decoded) return false;

  const { width, height, data } = decoded;
  const totalPixels = width * height;
  if (totalPixels < 100) return false;

  let transparentCount = 0;
  let opaqueCount = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        transparentCount += 1;
        continue;
      }
      opaqueCount += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (opaqueCount === 0) return false;
  const transparentRatio = transparentCount / totalPixels;
  // Reject "almost opaque" PNGs where a few accidental transparent pixels exist.
  if (transparentRatio < 0.02) return false;
  if (minX > maxX || minY > maxY) return false;

  const bboxWidth = maxX - minX + 1;
  const bboxHeight = maxY - minY + 1;
  if (bboxWidth < 16 || bboxHeight < 24) return false;

  const sampleZeroRatio = (
    startX: number,
    endX: number,
    startY: number,
    endY: number
  ): number => {
    if (endX < startX || endY < startY) return 0;
    let total = 0;
    let zeros = 0;
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        total += 1;
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha === 0) zeros += 1;
      }
    }
    return total > 0 ? zeros / total : 0;
  };

  const innerMarginX = Math.max(6, Math.min(48, Math.floor(bboxWidth * 0.12)));
  const innerMarginY = Math.max(8, Math.min(56, Math.floor(bboxHeight * 0.1)));
  const innerStartX = minX + innerMarginX;
  const innerEndX = maxX - innerMarginX;
  const innerStartY = minY + innerMarginY;
  const innerEndY = maxY - innerMarginY;

  const innerZeroRatio = sampleZeroRatio(
    innerStartX,
    innerEndX,
    innerStartY,
    innerEndY
  );
  if (innerZeroRatio > 0.28) return false;

  const centerMarginX = Math.max(4, Math.floor(bboxWidth * 0.24));
  const centerMarginTop = Math.max(6, Math.floor(bboxHeight * 0.2));
  const centerMarginBottom = Math.max(6, Math.floor(bboxHeight * 0.22));
  const centerStartX = minX + centerMarginX;
  const centerEndX = maxX - centerMarginX;
  const centerStartY = minY + centerMarginTop;
  const centerEndY = maxY - centerMarginBottom;
  const centerZeroRatio = sampleZeroRatio(
    centerStartX,
    centerEndX,
    centerStartY,
    centerEndY
  );
  if (centerZeroRatio > 0.14) return false;

  return true;
}

function pngHasUsableTransparency(buffer: Buffer): boolean {
  if (!pngHasAlphaChannel(buffer)) return false;
  if (!pngHasTransparentPixels(buffer)) return false;
  return pngTransparencyQualityLooksHealthy(buffer);
}

function quantizeColorChannel(value: number, step = 12): number {
  return Math.round(value / step) * step;
}

function colorDistanceSquared(
  data: Buffer,
  pixelOffset: number,
  color: readonly [number, number, number]
): number {
  const dr = data[pixelOffset] - color[0];
  const dg = data[pixelOffset + 1] - color[1];
  const db = data[pixelOffset + 2] - color[2];
  return dr * dr + dg * dg + db * db;
}

function collectDominantBorderColors(decoded: {
  width: number;
  height: number;
  data: Buffer;
}): Array<[number, number, number]> {
  const { width, height, data } = decoded;
  if (width < 2 || height < 2) return [];

  const borderPixelIndexes: number[] = [];
  for (let x = 0; x < width; x += 1) {
    borderPixelIndexes.push(x);
    borderPixelIndexes.push((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    borderPixelIndexes.push(y * width);
    borderPixelIndexes.push(y * width + (width - 1));
  }

  const buckets = new Map<
    string,
    { count: number; rSum: number; gSum: number; bSum: number }
  >();

  for (const pixelIndex of borderPixelIndexes) {
    const offset = pixelIndex * 4;
    if (data[offset + 3] < 240) continue;

    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const key = `${quantizeColorChannel(r)},${quantizeColorChannel(
      g
    )},${quantizeColorChannel(b)}`;
    const bucket = buckets.get(key);
    if (!bucket) {
      buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b });
      continue;
    }
    bucket.count += 1;
    bucket.rSum += r;
    bucket.gSum += g;
    bucket.bSum += b;
  }

  const minBucketSize = Math.max(8, Math.floor(borderPixelIndexes.length * 0.04));
  return [...buckets.values()]
    .filter((bucket) => bucket.count >= minBucketSize)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((bucket) => [
      Math.round(bucket.rSum / bucket.count),
      Math.round(bucket.gSum / bucket.count),
      Math.round(bucket.bSum / bucket.count),
    ]);
}

function decodeImageForBorderCutout(
  mimeType: string,
  buffer: Buffer
): { width: number; height: number; data: Buffer } | null {
  if (mimeType.includes("png")) {
    try {
      const decoded = PNG.sync.read(buffer);
      return {
        width: decoded.width,
        height: decoded.height,
        data: Buffer.from(decoded.data),
      };
    } catch {
      return null;
    }
  }

  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    try {
      const decoded = jpeg.decode(buffer, {
        useTArray: true,
        formatAsRGBA: true,
      });
      return {
        width: decoded.width,
        height: decoded.height,
        data: Buffer.from(decoded.data),
      };
    } catch {
      return null;
    }
  }

  return null;
}

function applyBorderBackgroundCutout(
  mimeType: string,
  buffer: Buffer
): { imageBuffer: Buffer; mimeType: string } | null {
  const decoded = decodeImageForBorderCutout(mimeType, buffer);
  if (!decoded) {
    return null;
  }

  const { width, height, data } = decoded;
  if (width < 32 || height < 32) return null;

  const backgroundColors = collectDominantBorderColors(decoded);
  if (!backgroundColors.length) return null;

  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const toleranceSq = 30 * 30;
  const minAlpha = 240;
  let head = 0;
  let tail = 0;

  const isBackgroundPixel = (pixelIndex: number): boolean => {
    const offset = pixelIndex * 4;
    if (data[offset + 3] < minAlpha) return false;
    for (const color of backgroundColors) {
      if (colorDistanceSquared(data, offset, color) <= toleranceSq) {
        return true;
      }
    }
    return false;
  };

  const push = (pixelIndex: number): void => {
    if (visited[pixelIndex]) return;
    visited[pixelIndex] = 1;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    const topIndex = x;
    const bottomIndex = (height - 1) * width + x;
    if (isBackgroundPixel(topIndex)) push(topIndex);
    if (isBackgroundPixel(bottomIndex)) push(bottomIndex);
  }
  for (let y = 1; y < height - 1; y += 1) {
    const leftIndex = y * width;
    const rightIndex = y * width + (width - 1);
    if (isBackgroundPixel(leftIndex)) push(leftIndex);
    if (isBackgroundPixel(rightIndex)) push(rightIndex);
  }

  while (head < tail) {
    const pixelIndex = queue[head];
    head += 1;

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    if (x > 0) {
      const left = pixelIndex - 1;
      if (!visited[left] && isBackgroundPixel(left)) push(left);
    }
    if (x + 1 < width) {
      const right = pixelIndex + 1;
      if (!visited[right] && isBackgroundPixel(right)) push(right);
    }
    if (y > 0) {
      const up = pixelIndex - width;
      if (!visited[up] && isBackgroundPixel(up)) push(up);
    }
    if (y + 1 < height) {
      const down = pixelIndex + width;
      if (!visited[down] && isBackgroundPixel(down)) push(down);
    }
  }

  const removedPixels = tail;
  const minRemovedPixels = Math.floor(pixelCount * 0.02);
  const maxRemovedPixels = Math.floor(pixelCount * 0.995);
  if (removedPixels < minRemovedPixels || removedPixels > maxRemovedPixels) {
    return null;
  }

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (!visited[pixelIndex]) continue;
    data[pixelIndex * 4 + 3] = 0;
  }

  // Feather subject boundary by softening alpha on pixels touching removed background.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      if (visited[pixelIndex]) continue;
      const alphaOffset = pixelIndex * 4 + 3;
      if (data[alphaOffset] === 0) continue;

      let neighborBackgroundCount = 0;
      for (let ny = y - 1; ny <= y + 1; ny += 1) {
        if (ny < 0 || ny >= height) continue;
        for (let nx = x - 1; nx <= x + 1; nx += 1) {
          if (nx < 0 || nx >= width) continue;
          if (nx === x && ny === y) continue;
          const neighborIndex = ny * width + nx;
          if (visited[neighborIndex]) {
            neighborBackgroundCount += 1;
          }
        }
      }
      if (neighborBackgroundCount === 0) continue;

      const currentAlpha = data[alphaOffset];
      const softenedAlpha =
        neighborBackgroundCount >= 4
          ? 150
          : neighborBackgroundCount >= 2
            ? 190
            : 220;
      if (currentAlpha > softenedAlpha) {
        data[alphaOffset] = softenedAlpha;
      }
    }
  }

  const output = new PNG({ width, height });
  output.data = data;
  const outputBuffer = PNG.sync.write(output);
  if (!pngHasUsableTransparency(outputBuffer)) return null;
  return {
    imageBuffer: outputBuffer,
    mimeType: "image/png",
  };
}

function shouldRunTransparencyPass(mimeType: string, buffer: Buffer): boolean {
  if (!TRANSPARENCY_PASS_ENABLED) return false;
  if (!mimeType.includes("png")) return true;
  return !pngHasUsableTransparency(buffer);
}

async function runTransparencyPass({
  apiKey,
  modelName,
  imageBuffer,
  mimeType,
}: {
  apiKey: string;
  modelName: string;
  imageBuffer: Buffer;
  mimeType: string;
}): Promise<GeminiImageResult> {
  const passPrompt = `Remove the entire background from this image and keep only the model with the garment.
Return a high-quality transparent PNG with clean and precise alpha edges.
Do not alter body pose, facial expression, garment details, color, or proportions.
No text, no shadows, no props, no extra objects.
Keep original sharpness and texture detail; do not apply beauty smoothing or style changes.`;

  const sourceImage: SourceImagePayload = {
    buffer: imageBuffer,
    base64: imageBuffer.toString("base64"),
    mimeType,
    hash: "",
  };

  return generateImageWithGemini({
    apiKey,
    modelName,
    prompt: passPrompt,
    sourceImages: [sourceImage],
    colorReferenceImage: null,
  });
}

function lacksRequiredTransparency(mimeType: string, buffer: Buffer): boolean {
  if (!mimeType.includes("png")) {
    return true;
  }
  return !pngHasUsableTransparency(buffer);
}

async function runStrictTransparencyPass({
  apiKey,
  modelName,
  imageBuffer,
  mimeType,
}: {
  apiKey: string;
  modelName: string;
  imageBuffer: Buffer;
  mimeType: string;
}): Promise<GeminiImageResult> {
  const passPrompt = `Remove every background element and return only the model with garment.
If there is a checkerboard, textured, studio, or any solid background, remove it completely.
The output must be a transparent PNG with real alpha channel (RGBA), not a fake checkerboard.
Keep body pose, face, garment shape, seams, and color exactly the same.
No text, no watermark, no props, no extra objects.
Preserve edge detail around hair, straps, and lace without blurring.`;

  const sourceImage: SourceImagePayload = {
    buffer: imageBuffer,
    base64: imageBuffer.toString("base64"),
    mimeType,
    hash: "",
  };

  return generateImageWithGemini({
    apiKey,
    modelName,
    prompt: passPrompt,
    sourceImages: [sourceImage],
    colorReferenceImage: null,
  });
}

async function enforceTransparency({
  apiKey,
  modelName,
  initialImage,
}: {
  apiKey: string;
  modelName: string;
  initialImage: GeminiImageResult;
}): Promise<GeminiImageResult> {
  if (!shouldRunTransparencyPass(initialImage.mimeType, initialImage.imageBuffer)) {
    return initialImage;
  }

  let candidate = initialImage;
  try {
    candidate = await runTransparencyPass({
      apiKey,
      modelName,
      imageBuffer: initialImage.imageBuffer,
      mimeType: initialImage.mimeType,
    });
  } catch {
    candidate = initialImage;
  }

  if (!lacksRequiredTransparency(candidate.mimeType, candidate.imageBuffer)) {
    return candidate;
  }

  let strict = candidate;
  try {
    strict = await runStrictTransparencyPass({
      apiKey,
      modelName,
      imageBuffer: candidate.imageBuffer,
      mimeType: candidate.mimeType,
    });
  } catch {
    strict = candidate;
  }

  if (!lacksRequiredTransparency(strict.mimeType, strict.imageBuffer)) {
    return strict;
  }

  try {
    const specialized = await removeBackgroundSpecializedWithDiagnostics({
      imageBuffer: strict.imageBuffer,
      mimeType: strict.mimeType,
    });
    if (
      specialized.result &&
      !lacksRequiredTransparency(
        specialized.result.mimeType,
        specialized.result.imageBuffer
      )
    ) {
      return {
        imageBuffer: specialized.result.imageBuffer,
        mimeType: specialized.result.mimeType,
        textNotes: [
          ...strict.textNotes,
          `specialized_background_removal:${specialized.result.provider}`,
        ],
      };
    }
  } catch {
    // Keep local fallback path when specialized providers fail.
  }

  if (LOCAL_CUTOUT_FALLBACK_ENABLED) {
    const locallyCut =
      applyBorderBackgroundCutout(strict.mimeType, strict.imageBuffer) ||
      applyBorderBackgroundCutout(candidate.mimeType, candidate.imageBuffer) ||
      applyBorderBackgroundCutout(initialImage.mimeType, initialImage.imageBuffer);
    if (locallyCut) {
      return {
        imageBuffer: locallyCut.imageBuffer,
        mimeType: locallyCut.mimeType,
        textNotes: [...strict.textNotes, "local_background_cutout"],
      };
    }
  }

  return {
    imageBuffer: initialImage.imageBuffer,
    mimeType: initialImage.mimeType,
    textNotes: [...strict.textNotes, "transparency_fallback_original"],
  };
}

async function generateWithFallback({
  apiKey,
  sourceImages,
  colorReferenceImage,
  consistencyReferenceImage,
  prompt,
}: {
  apiKey: string;
  sourceImages: SourceImagePayload[];
  colorReferenceImage?: SourceImagePayload | null;
  consistencyReferenceImage?: SourceImagePayload | null;
  prompt: string;
}): Promise<{
  imageBuffer: Buffer;
  mimeType: string;
  revisedPrompt: string | null;
  modelUsed: string;
}> {
  let lastError: unknown = null;
  const attempts: Array<{ model: string; message: string }> = [];
  let sawQuotaError = false;
  let sawNoImageData = false;
  let sawSafetyBlock = false;
  const triedModels = new Set<string>();

  for (const modelName of MODEL_CANDIDATES) {
    const normalizedModel = modelName.trim();
    if (!normalizedModel) continue;
    if (triedModels.has(normalizedModel)) continue;
    triedModels.add(normalizedModel);

    try {
      const initial = await generateImageWithGemini({
        apiKey,
        modelName: normalizedModel,
        prompt,
        sourceImages,
        colorReferenceImage,
        consistencyReferenceImage,
      });

      const finalImage = await enforceTransparency({
        apiKey,
        modelName: normalizedModel,
        initialImage: initial,
      });
      const upscaled = await upscaleImageToMinimumResolution(finalImage);

      const revisedPrompt = [...initial.textNotes, ...upscaled.textNotes]
        .filter(Boolean)
        .join(" | ");

      return {
        imageBuffer: upscaled.imageBuffer,
        mimeType: upscaled.mimeType,
        revisedPrompt: revisedPrompt || null,
        modelUsed: normalizedModel,
      };
    } catch (error) {
      if (sourceImages.length > 1 && isInputPayloadError(error)) {
        try {
          const initial = await generateImageWithGemini({
            apiKey,
            modelName: normalizedModel,
            prompt,
            sourceImages: [sourceImages[0]],
            colorReferenceImage,
            consistencyReferenceImage,
          });

          const finalImage = await enforceTransparency({
            apiKey,
            modelName: normalizedModel,
            initialImage: initial,
          });
          const upscaled = await upscaleImageToMinimumResolution(finalImage);

          const revisedPrompt = [...initial.textNotes, ...upscaled.textNotes]
            .filter(Boolean)
            .join(" | ");

          return {
            imageBuffer: upscaled.imageBuffer,
            mimeType: upscaled.mimeType,
            revisedPrompt: revisedPrompt || null,
            modelUsed: normalizedModel,
          };
        } catch (singleImageError) {
          lastError = singleImageError;
          const singleMessage = String(
            (singleImageError as Error).message || "unknown single image fallback error"
          );
          attempts.push({
            model: `${normalizedModel} (single-fallback)`,
            message: singleMessage,
          });
          if (isNoImageDataError(singleImageError)) {
            sawNoImageData = true;
          }
          if (isImageSafetyError(singleImageError)) {
            sawSafetyBlock = true;
          }
          if (isQuotaError(singleImageError)) {
            sawQuotaError = true;
          }
          if (isRetryableModelError(singleImageError)) {
            continue;
          }
          throw singleImageError;
        }
      }

      lastError = error;
      const message = String((error as Error).message || "unknown model error");
      attempts.push({ model: normalizedModel, message });
      if (isNoImageDataError(error)) {
        sawNoImageData = true;
      }
      if (isImageSafetyError(error)) {
        sawSafetyBlock = true;
      }
      if (isQuotaError(error)) {
        sawQuotaError = true;
      }
      if (isRetryableModelError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (sawQuotaError) {
    const quotaError = new Error(
      "Gemini image generation quota is exhausted for this project/key. Enable billing or request image-model quota in Google AI Studio/Google Cloud."
    ) as Error & { status?: number; code?: string; attempts?: unknown };
    quotaError.status = 429;
    quotaError.code = "RESOURCE_EXHAUSTED";
    quotaError.attempts = attempts;
    throw quotaError;
  }

  if (attempts.length > 0) {
    if (sawNoImageData || sawSafetyBlock) {
      const detail = attempts
        .map((attempt) => `${attempt.model}: ${attempt.message}`)
        .join(" | ");
      const noImageError = new Error(
        sawSafetyBlock
          ? "Gemini blocked this generation for safety policies. Try a different base image angle, add a garment-only reference image, or adjust prompt to be less revealing."
          : "Gemini could not return image output for these references. Try different base image(s) or add a cleaner garment reference."
      ) as Error & { status?: number; code?: string; attempts?: unknown };
      noImageError.status = 422;
      noImageError.code = sawSafetyBlock
        ? "IMAGE_SAFETY_BLOCK"
        : "NO_IMAGE_DATA";
      noImageError.attempts = detail;
      throw noImageError;
    }

    const detail = attempts
      .map((attempt) => `${attempt.model}: ${attempt.message}`)
      .join(" | ");
    const fallbackError = new Error(
      `No Gemini image model succeeded. Attempts: ${detail}`
    ) as Error & { attempts?: unknown; status?: number; code?: string };
    fallbackError.status = 502;
    fallbackError.code = "GENERATION_FAILED";
    fallbackError.attempts = attempts;
    throw fallbackError;
  }

  if (lastError) throw lastError;
  throw new Error("No compatible Gemini image model configured");
}

export async function generateProfessionalProductImage(
  input: GenerateProductImageInput
): Promise<GenerateProductImageResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const error = new Error("Gemini API key is not configured") as Error & {
      status?: number;
      code?: string;
    };
    error.status = 503;
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const sourceImageUrls = normalizeSourceImageUrls(input);
  if (!sourceImageUrls.length) {
    const error = new Error("At least one source image is required") as Error & {
      status?: number;
      code?: string;
    };
    error.status = 400;
    error.code = "MISSING_SOURCE_IMAGES";
    throw error;
  }

  const sourceImages = await fetchSourceImages(sourceImageUrls);
  if (!sourceImages.length) {
    const error = new Error("Failed to prepare source images") as Error & {
      status?: number;
      code?: string;
    };
    error.status = 422;
    error.code = "SOURCE_IMAGES_UNUSABLE";
    throw error;
  }
  const colorReferenceImageUrl =
    typeof input.colorReferenceImageUrl === "string"
      ? input.colorReferenceImageUrl.trim()
      : "";
  const consistencyReferenceImageUrl =
    typeof input.consistencyReferenceImageUrl === "string"
      ? input.consistencyReferenceImageUrl.trim()
      : "";
  const colorReferenceImage =
    colorReferenceImageUrl.length > 0
      ? await fetchSourceImage(colorReferenceImageUrl)
      : null;
  const consistencyReferenceImage =
    consistencyReferenceImageUrl.length > 0
      ? await fetchSourceImage(consistencyReferenceImageUrl)
      : null;
  const targetAngle = resolveAnglePreset(input.targetAngle).id;
  const profile = getRandomProfile(input.preferredProfileId);
  const prompt = buildPrompt({
    profile,
    productName: input.productName,
    productCategory: input.productCategory,
    productColors: input.productColors,
    customPrompt: input.customPrompt,
    targetColor: input.targetColor,
    targetAngle,
    referenceImageCount: sourceImages.length,
    hasColorReferenceImage: Boolean(colorReferenceImage),
    hasConsistencyReferenceImage: Boolean(consistencyReferenceImage),
  });

  const generated = await generateWithFallback({
    apiKey,
    sourceImages,
    colorReferenceImage,
    consistencyReferenceImage,
    prompt,
  });

  return {
    imageBuffer: generated.imageBuffer,
    mimeType: generated.mimeType || "image/png",
    prompt,
    revisedPrompt: generated.revisedPrompt,
    modelUsed: generated.modelUsed,
    profile,
    sourceImageHash: sourceImages[0].hash,
    sourceImageHashes: sourceImages.map((image) => image.hash),
    colorReferenceImageHash: colorReferenceImage?.hash || null,
    consistencyReferenceImageHash: consistencyReferenceImage?.hash || null,
    outputFormat: inferOutputFormat(generated.mimeType),
    quality: inferQuality(generated.modelUsed),
    inputFidelity: inferInputFidelity(generated.modelUsed),
    targetAngle,
  };
}
