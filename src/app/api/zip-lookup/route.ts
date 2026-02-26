import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip");

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      next: { revalidate: 86400 }, // cache for 24 hours
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "ZIP code not found" },
        { status: 404 }
      );
    }

    const data = await res.json();
    const place = data.places?.[0];

    if (!place) {
      return NextResponse.json(
        { error: "No data for ZIP" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      city: place["place name"],
      state: place["state abbreviation"],
      stateFull: place.state,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
