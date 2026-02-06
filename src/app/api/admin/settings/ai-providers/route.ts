import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import {
  getBackgroundRemovalProviderStatus,
  upsertBackgroundRemovalSecrets,
  type ProviderId,
} from "@/lib/product-image-ai/background-removal";

interface UpdateProvidersBody {
  removebgApiKey?: string | null;
  clipdropApiKey?: string | null;
  providerOrder?: string[] | null;
}

function sanitizeOptionalApiKey(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeProviderOrder(value: unknown): ProviderId[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const order: ProviderId[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const normalized = item.trim().toLowerCase();
    if (normalized === "removebg" && !order.includes("removebg")) {
      order.push("removebg");
    }
    if (normalized === "clipdrop" && !order.includes("clipdrop")) {
      order.push("clipdrop");
    }
  }
  return order.length ? order : undefined;
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getBackgroundRemovalProviderStatus();
  return NextResponse.json(status);
}

export async function PUT(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as UpdateProvidersBody;
    const removebgApiKey = sanitizeOptionalApiKey(body.removebgApiKey);
    const clipdropApiKey = sanitizeOptionalApiKey(body.clipdropApiKey);
    const providerOrder = sanitizeProviderOrder(body.providerOrder);

    const updated = await upsertBackgroundRemovalSecrets({
      ...(removebgApiKey !== undefined ? { removebgApiKey } : {}),
      ...(clipdropApiKey !== undefined ? { clipdropApiKey } : {}),
      ...(providerOrder !== undefined ? { providerOrder } : {}),
    });

    return NextResponse.json({
      success: true,
      ...updated,
    });
  } catch (error) {
    const typed = error as Error & { status?: number; code?: string };
    const status =
      typeof typed.status === "number" && typed.status >= 400 && typed.status <= 599
        ? typed.status
        : 500;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to update AI provider settings: ${error.message}`
            : "Failed to update AI provider settings",
        ...(process.env.NODE_ENV !== "production"
          ? {
              debug: {
                code: typed.code || null,
                status: typed.status || null,
              },
            }
          : {}),
      },
      { status }
    );
  }
}
