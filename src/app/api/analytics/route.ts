import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// POST: Track an analytics event (public, fire-and-forget)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.event_type) {
      return NextResponse.json(
        { error: "event_type required" },
        { status: 400 }
      );
    }

    // Fire and forget - don't wait for completion
    adminDb
      .collection("analyticsEvents")
      .add({
        eventType: body.event_type,
        eventData: body.event_data || {},
        sessionId: body.session_id || null,
        userAgent: null,
        createdAt: FieldValue.serverTimestamp(),
      })
      .catch((err) =>
        console.error("Failed to log analytics event:", err)
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
