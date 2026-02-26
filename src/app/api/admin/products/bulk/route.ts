import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, productIds } = body;

    if (!action || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "Missing action or productIds" },
        { status: 400 }
      );
    }

    if (!["activate", "deactivate"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'activate' or 'deactivate'" },
        { status: 400 }
      );
    }

    const isActive = action === "activate";
    const BATCH_SIZE = 500;
    let processed = 0;

    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const chunk = productIds.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();

      for (const id of chunk) {
        const ref = adminDb.collection("products").doc(id);
        batch.update(ref, {
          isActive,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      processed += chunk.length;
    }

    return NextResponse.json({
      success: true,
      processed,
      action,
    });
  } catch (error) {
    console.error("Error in bulk operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}
