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

export interface GenerateCardBackgroundInput {
  customPrompt?: string;
  aspectRatio?: string;
}

export interface GenerateCardBackgroundResult {
  imageBuffer: Buffer;
  mimeType: string;
  prompt: string;
  revisedPrompt: string | null;
  modelUsed: string;
  aspectRatio: string;
}

const MODEL_CANDIDATES = [
  process.env.GEMINI_CARD_BACKGROUND_MODEL,
  process.env.GEMINI_IMAGE_MODEL,
  "gemini-3-pro-image-preview",
  "nano-banana-pro-preview",
  "gemini-2.5-flash-image",
].filter((value): value is string => Boolean(value && value.trim()));

const IMAGE_SIZE = process.env.GEMINI_IMAGE_SIZE || "2K";
const DEFAULT_ASPECT_RATIO = "3:4";
const ALLOWED_ASPECT_RATIOS = new Set(["1:1", "3:4", "4:5", "16:9", "4:3"]);

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

export function isCardBackgroundGenerationConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

function sanitizeAspectRatio(value?: string): string {
  if (!value) return DEFAULT_ASPECT_RATIO;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_ASPECT_RATIO;
  return ALLOWED_ASPECT_RATIOS.has(trimmed) ? trimmed : DEFAULT_ASPECT_RATIO;
}

function sanitizePrompt(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, 1200);
}

function buildPrompt(customPrompt?: string): string {
  const userPrompt = sanitizePrompt(customPrompt);
  const basePrompt = `Generate a premium ecommerce product-card background image.

Requirements:
- Abstract studio-style background only.
- No person, no body parts, no mannequin, no garment, no product, no text, no logo, no watermark.
- Clean high-end visual style suitable for fashion storefront cards.
- Soft gradients, subtle lighting bloom, controlled contrast, no heavy noise.
- Keep composition minimal and elegant with a clear center area where a product image can be placed.
- Do not include checkerboard pattern.
- Return only one final image.`;

  if (!userPrompt) {
    return `${basePrompt}

Color direction: soft neutral palette (white, pearl, warm gray), modern editorial look.`;
  }

  return `${basePrompt}

User style adjustments:
${userPrompt}`;
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
    throw new Error("Gemini returned an empty response payload");
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

function buildImageConfig(modelName: string, aspectRatio: string): Record<string, unknown> {
  const config: Record<string, unknown> = {
    aspectRatio,
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
  aspectRatio,
}: {
  apiKey: string;
  modelName: string;
  prompt: string;
  aspectRatio: string;
}): Promise<GeminiImageResult> {
  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: buildImageConfig(modelName, aspectRatio),
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
  const message = String(maybe.message || "").toLowerCase();
  return message.includes("did not return image data");
}

function isRetryableModelError(error: unknown): boolean {
  if (isModelNotFoundError(error)) return true;
  if (isQuotaError(error)) return true;
  if (isNoImageDataError(error)) return true;
  if (!error || typeof error !== "object") return false;
  const maybe = error as { status?: number; message?: string };
  const status = maybe.status || 0;
  if (status === 408 || status === 409 || status === 425) return true;
  if (status >= 500 && status <= 599) return true;
  const message = String(maybe.message || "").toLowerCase();
  if (status === 400) {
    if (message.includes("does not support the requested response modalities")) {
      return true;
    }
  }
  return message.includes("temporarily unavailable");
}

export async function generateCardBackgroundImage(
  input: GenerateCardBackgroundInput
): Promise<GenerateCardBackgroundResult> {
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

  const prompt = buildPrompt(input.customPrompt);
  const aspectRatio = sanitizeAspectRatio(input.aspectRatio);
  let lastError: unknown = null;
  const attempts: Array<{ model: string; message: string }> = [];
  const triedModels = new Set<string>();

  for (const modelName of MODEL_CANDIDATES) {
    const normalizedModel = modelName.trim();
    if (!normalizedModel) continue;
    if (triedModels.has(normalizedModel)) continue;
    triedModels.add(normalizedModel);
    try {
      const generated = await generateImageWithGemini({
        apiKey,
        modelName: normalizedModel,
        prompt,
        aspectRatio,
      });
      const revisedPrompt = generated.textNotes.filter(Boolean).join(" | ");
      return {
        imageBuffer: generated.imageBuffer,
        mimeType: generated.mimeType || "image/png",
        prompt,
        revisedPrompt: revisedPrompt || null,
        modelUsed: normalizedModel,
        aspectRatio,
      };
    } catch (error) {
      lastError = error;
      attempts.push({
        model: normalizedModel,
        message: String((error as Error).message || "unknown model error"),
      });
      if (isRetryableModelError(error)) {
        continue;
      }
      throw error;
    }
  }

  const detail = attempts.map((attempt) => `${attempt.model}: ${attempt.message}`).join(" | ");
  const exhausted = new Error(
    detail
      ? `No Gemini image model succeeded. Attempts: ${detail}`
      : "No compatible Gemini image model configured"
  ) as Error & { status?: number; code?: string; attempts?: unknown };
  exhausted.status = isQuotaError(lastError) ? 429 : 502;
  exhausted.code = isQuotaError(lastError) ? "RESOURCE_EXHAUSTED" : "GENERATION_FAILED";
  exhausted.attempts = attempts;
  throw exhausted;
}

