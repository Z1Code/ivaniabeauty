import { NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { readSiteSectionsSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export async function GET() {
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
            ? `No se pudieron cargar ajustes publicos: ${error.message}`
            : "No se pudieron cargar ajustes publicos",
      },
      { status: 500 }
    );
  }
}
