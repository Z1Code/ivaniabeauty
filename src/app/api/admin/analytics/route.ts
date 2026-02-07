import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { getAdminAnalyticsData } from "@/lib/admin/analytics-data";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await getAdminAnalyticsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
