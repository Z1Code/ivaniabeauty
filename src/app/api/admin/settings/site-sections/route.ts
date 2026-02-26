import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import {
  readSiteSectionsSettings,
  upsertSiteSectionsSettings,
} from "@/lib/store-settings";

export const dynamic = "force-dynamic";

interface UpdateSiteSectionsBody {
  homeSections?: unknown;
  footerSettings?: unknown;
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await readSiteSectionsSettings();
    return NextResponse.json({
      success: true,
      persisted: isFirebaseConfigured(),
      ...data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `No se pudieron cargar ajustes: ${error.message}`
            : "No se pudieron cargar ajustes",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as UpdateSiteSectionsBody;
    const hasHomeSections = body.homeSections !== undefined;
    const hasFooterSettings = body.footerSettings !== undefined;

    if (!hasHomeSections && !hasFooterSettings) {
      return NextResponse.json(
        { error: "No hay ajustes para actualizar." },
        { status: 400 }
      );
    }

    const updated = await upsertSiteSectionsSettings({
      ...(hasHomeSections ? { homeSections: body.homeSections } : {}),
      ...(hasFooterSettings ? { footerSettings: body.footerSettings } : {}),
      adminUid: admin.uid,
    });

    return NextResponse.json({
      success: true,
      persisted: true,
      ...updated,
    });
  } catch (error) {
    const typedError = error as Error & { status?: number };
    const status =
      typeof typedError.status === "number" &&
      typedError.status >= 400 &&
      typedError.status <= 599
        ? typedError.status
        : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `No se pudieron guardar ajustes: ${error.message}`
            : "No se pudieron guardar ajustes",
      },
      { status }
    );
  }
}
