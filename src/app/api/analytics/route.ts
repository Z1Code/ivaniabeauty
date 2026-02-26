import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/security/rate-limiter";

const ALLOWED_EVENT_TYPES = ["page_view", "add_to_cart", "purchase", "product_view"];
const MAX_EVENT_DATA_BYTES = 1024; // 1KB

// POST: Track an analytics event (public, fire-and-forget)
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = rateLimit(ip, "/api/analytics");
    if (!allowed) {
      return NextResponse.json({ success: true }); // Silent drop
    }

    const body = await request.json();

    if (!body.event_type || !ALLOWED_EVENT_TYPES.includes(body.event_type)) {
      return NextResponse.json(
        { error: "Invalid event_type" },
        { status: 400 }
      );
    }

    // Limit event_data payload size
    if (body.event_data) {
      const dataSize = new TextEncoder().encode(JSON.stringify(body.event_data)).length;
      if (dataSize > MAX_EVENT_DATA_BYTES) {
        return NextResponse.json(
          { error: "event_data too large" },
          { status: 400 }
        );
      }
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
