import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { FieldValue } from "firebase-admin/firestore";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const docRef = adminDb.collection("banners").doc(id);

  const updateData: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  const fields = ["titleEn", "titleEs", "subtitleEn", "subtitleEs", "imageUrl", "linkUrl", "position", "sortOrder", "isActive", "startsAt", "endsAt"];
  for (const f of fields) {
    if (body[f] !== undefined) {
      if (f === "startsAt" || f === "endsAt") {
        updateData[f] = body[f] ? new Date(body[f]) : null;
      } else {
        updateData[f] = body[f];
      }
    }
  }

  await docRef.update(updateData);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await adminDb.collection("banners").doc(id).update({
    isActive: false,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ success: true });
}
