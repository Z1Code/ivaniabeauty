import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { adminStorage, isFirebaseConfigured } from "@/lib/firebase/admin";
import {
  generateCardBackgroundImage,
  isCardBackgroundGenerationConfigured,
} from "@/lib/card-background-ai/generator";

export const maxDuration = 120;

interface GenerateBackgroundBody {
  prompt?: string;
  label?: string;
  aspectRatio?: string;
}

function sanitizePrompt(value: unknown, max = 1200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function sanitizeLabel(value: unknown): string {
  if (typeof value !== "string") return "Fondo IA";
  const trimmed = value.trim();
  if (!trimmed) return "Fondo IA";
  return trimmed.slice(0, 40);
}

function sanitizeAspectRatio(value: unknown): string {
  if (typeof value !== "string") return "3:4";
  const trimmed = value.trim();
  return trimmed || "3:4";
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

function getGeminiEnvPresence() {
  const presence = {
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY?.trim()),
    GOOGLE_API_KEY: Boolean(process.env.GOOGLE_API_KEY?.trim()),
    GOOGLE_GENERATIVE_AI_API_KEY: Boolean(
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
    ),
    GEMINI_CARD_BACKGROUND_MODEL: Boolean(
      process.env.GEMINI_CARD_BACKGROUND_MODEL?.trim()
    ),
    GEMINI_IMAGE_MODEL: Boolean(process.env.GEMINI_IMAGE_MODEL?.trim()),
  };

  const missingKeyCandidates = Object.entries(presence)
    .filter(([name, isSet]) => !isSet && !name.includes("MODEL"))
    .map(([name]) => name);

  return {
    presence,
    missingKeyCandidates,
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

  if (!isCardBackgroundGenerationConfigured()) {
    const envInfo = getGeminiEnvPresence();
    return NextResponse.json(
      {
        error:
          "Gemini card background generation is not configured. Set GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY) and restart dev server.",
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
    const body = (await request.json().catch(() => ({}))) as GenerateBackgroundBody;
    const prompt = sanitizePrompt(body.prompt);
    const label = sanitizeLabel(body.label);
    const aspectRatio = sanitizeAspectRatio(body.aspectRatio);

    const generation = await generateCardBackgroundImage({
      customPrompt: prompt || undefined,
      aspectRatio,
    });

    const ext = extensionFromMimeType(generation.mimeType);
    const fileName = `products/card-backgrounds/${Date.now()}-${randomUUID()}.${ext}`;
    const bucket = adminStorage.bucket();
    const file = bucket.file(fileName);

    await file.save(generation.imageBuffer, {
      metadata: {
        contentType: generation.mimeType,
      },
    });
    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      preset: {
        id: `ai_${Date.now()}`,
        label,
        type: "image",
        imageUrl,
        builtIn: false,
        createdAt: Date.now(),
      },
      mimeType: generation.mimeType,
      prompt: generation.prompt,
      revisedPrompt: generation.revisedPrompt,
      modelUsed: generation.modelUsed,
      aspectRatio: generation.aspectRatio,
    });
  } catch (error) {
    const typed = error as Error & { status?: number; code?: string; attempts?: unknown };
    const status =
      typeof typed.status === "number" &&
      typed.status >= 400 &&
      typed.status <= 599
        ? typed.status
        : 500;

    return NextResponse.json(
      {
        error:
          typed.message || "Failed to generate card background",
        ...(process.env.NODE_ENV !== "production"
          ? {
              debug: {
                status: typed.status || null,
                code: typed.code || null,
                attempts: typed.attempts || null,
              },
            }
          : {}),
      },
      { status }
    );
  }
}

