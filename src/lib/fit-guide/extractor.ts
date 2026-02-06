import { createHash } from "node:crypto";
import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerationConfig,
} from "@google/generative-ai";
import type { FitGuideStatus, SizeChartMeasurement } from "@/lib/firebase/types";
import {
  normalizeRows,
  rowsToLegacyMeasurements,
  type FitGuideNormalizationResult,
} from "./utils";

type ModelUnit = "cm" | "in" | "unknown";

interface GeminiExtraMetric {
  key?: string;
  value?: string | null;
  confidence?: number | null;
  is_body_measurement?: boolean | null;
}

interface GeminiRow {
  size?: string;
  waist?: string | null;
  waist_cm?: string | null;
  hip?: string | null;
  hip_cm?: string | null;
  bust?: string | null;
  bust_cm?: string | null;
  length?: string | null;
  length_cm?: string | null;
  extra_metrics?: GeminiExtraMetric[];
}

interface GeminiResponse {
  rows?: GeminiRow[];
  notes?: string[];
  assumed_unit?: ModelUnit;
  confidence?: number;
}

export interface ExtractFitGuideResult extends FitGuideNormalizationResult {
  sourceImageUrl: string;
  sourceImageHash: string;
  measurements: SizeChartMeasurement[];
}

interface ImagePayload {
  base64: string;
  mimeType: string;
  hash: string;
}

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash",
].filter((value): value is string => Boolean(value && value.trim()));

const MODEL_CONFIG: GenerationConfig = {
  temperature: 0.15,
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      rows: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            size: { type: SchemaType.STRING },
            waist: { type: SchemaType.STRING, nullable: true },
            hip: { type: SchemaType.STRING, nullable: true },
            bust: { type: SchemaType.STRING, nullable: true },
            length: { type: SchemaType.STRING, nullable: true },
            extra_metrics: {
              type: SchemaType.ARRAY,
              nullable: true,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  key: { type: SchemaType.STRING },
                  value: { type: SchemaType.STRING, nullable: true },
                  confidence: { type: SchemaType.NUMBER, nullable: true },
                  is_body_measurement: {
                    type: SchemaType.BOOLEAN,
                    nullable: true,
                  },
                },
              },
            },
          },
          required: ["size"],
        },
      },
      notes: {
        type: SchemaType.ARRAY,
        nullable: true,
        items: { type: SchemaType.STRING },
      },
      assumed_unit: { type: SchemaType.STRING, nullable: true },
      confidence: { type: SchemaType.NUMBER, nullable: true },
    },
    required: ["rows"],
  },
};

const VISION_PROMPT = `You are extracting garment fit-guide measurements from a table image.

Output strict JSON with:
- rows: array of rows
- notes: optional warnings
- assumed_unit: "cm" | "in" | "unknown"
- confidence: number from 0 to 1

Rules:
1) Capture every size row shown in the table.
2) Keep body measurements in waist/hip/bust/length when present.
3) For extra body columns, add them to extra_metrics with key/value and is_body_measurement=true.
4) Ignore non-body sizing columns (for example pant size series 8/10/12) or flag them with is_body_measurement=false.
5) Return ranges exactly as seen if possible (e.g. "58-62", "58 a 62", "58").
6) Do not include markdown.`;

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    null;
  return key && key.trim().length > 0 ? key.trim() : null;
}

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

async function fetchImageAsPayload(url: string): Promise<ImagePayload> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch fit-guide image (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    base64: buffer.toString("base64"),
    mimeType: response.headers.get("content-type") || "image/jpeg",
    hash: createHash("sha256").update(buffer).digest("hex"),
  };
}

function safeParseJSON(text: string): GeminiResponse {
  const cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as GeminiResponse;
}

function buildRawRows(payload: GeminiResponse): Array<Record<string, unknown>> {
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  return rows.map((row) => {
    const normalized: Record<string, unknown> = {
      size: row.size || "",
      waist: row.waist ?? row.waist_cm ?? null,
      hip: row.hip ?? row.hip_cm ?? null,
      bust: row.bust ?? row.bust_cm ?? null,
      length: row.length ?? row.length_cm ?? null,
    };

    for (const extra of row.extra_metrics || []) {
      if (!extra?.key) continue;
      if (extra.is_body_measurement === false) continue;
      normalized[extra.key] = extra.value ?? null;
    }

    return normalized;
  });
}

function inferUnit(value: unknown): ModelUnit {
  if (value === "cm" || value === "in") return value;
  return "unknown";
}

function combineConfidence(
  normalizationScore: number,
  modelScore: number | null
): number {
  if (modelScore == null || Number.isNaN(modelScore)) {
    return normalizationScore;
  }
  return clamp(normalizationScore * 0.8 + clamp(modelScore) * 0.2);
}

function isModelNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { status?: number; message?: string };
  if (maybe.status === 404) return true;
  const message = String(maybe.message || "").toLowerCase();
  return (
    message.includes("not found") &&
    (message.includes("model") || message.includes("models/"))
  );
}

async function generateWithFallbackModel(
  genAI: GoogleGenerativeAI,
  image: ImagePayload
): Promise<{ text: string; modelUsed: string }> {
  const tried = new Set<string>();
  let lastError: unknown = null;

  for (const modelName of MODEL_CANDIDATES) {
    const normalizedModel = modelName.trim();
    if (!normalizedModel || tried.has(normalizedModel)) continue;
    tried.add(normalizedModel);

    try {
      const model = genAI.getGenerativeModel({
        model: normalizedModel,
        generationConfig: MODEL_CONFIG,
      });
      const result = await model.generateContent([
        VISION_PROMPT,
        {
          inlineData: {
            data: image.base64,
            mimeType: image.mimeType,
          },
        },
      ]);
      const text = result.response.text();
      if (!text) {
        throw new Error("Gemini returned an empty response");
      }
      return { text, modelUsed: normalizedModel };
    } catch (error) {
      lastError = error;
      if (isModelNotFoundError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("No compatible Gemini model candidate configured.");
}

export async function extractFitGuideFromImage(
  sourceImageUrl: string
): Promise<ExtractFitGuideResult> {
  const genAI = getGeminiClient();
  if (!genAI) {
    throw new Error("Gemini API key is not configured");
  }

  const image = await fetchImageAsPayload(sourceImageUrl);
  const { text, modelUsed } = await generateWithFallbackModel(genAI, image);

  const parsed = safeParseJSON(text);
  const unit = inferUnit(parsed.assumed_unit);
  const rawRows = buildRawRows(parsed);
  const normalized = normalizeRows(rawRows, {
    assumedUnit: unit === "unknown" ? "cm" : unit,
  });

  const confidenceScore = combineConfidence(
    normalized.confidenceScore,
    parsed.confidence ?? null
  );

  const warnings = [...normalized.warnings];
  for (const note of parsed.notes || []) {
    if (note && !warnings.includes(note)) {
      warnings.push(note);
    }
  }
  if (modelUsed !== MODEL_CANDIDATES[0]) {
    warnings.push(`Gemini model fallback used: ${modelUsed}`);
  }
  if (confidenceScore < 0.45) {
    warnings.push("Low confidence extraction. Manual review is recommended.");
  }

  const status: FitGuideStatus =
    normalized.status === "failed" ? "failed" : "draft";
  const measurements = rowsToLegacyMeasurements(normalized.rows);

  return {
    rows: normalized.rows,
    warnings,
    confidenceScore,
    status,
    availableSizesCanonical: normalized.availableSizesCanonical,
    sourceImageUrl,
    sourceImageHash: image.hash,
    measurements,
  };
}
