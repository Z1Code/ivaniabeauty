import { NextResponse } from "next/server";

// POST: Direct order creation is disabled.
// Orders are created through /api/checkout and confirmed via Stripe webhooks.
export async function POST() {
  return NextResponse.json(
    { error: "Direct order creation is not allowed. Use /api/checkout." },
    { status: 403 }
  );
}
