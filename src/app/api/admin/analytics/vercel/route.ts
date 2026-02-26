import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { fetchVercelAnalytics } from "@/lib/admin/vercel-analytics";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") as "7d" | "30d" | "90d" | null;

  const data = await fetchVercelAnalytics(range || "30d");
  return NextResponse.json(data);
}
