import { NextRequest, NextResponse } from "next/server";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() || "";
  const lang = searchParams.get("lang") === "es" ? "es" : "en";

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required (min 2 characters)" },
      { status: 400 }
    );
  }

  if (!isFirebaseConfigured()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const snapshot = await adminDb
      .collection("products")
      .where("isActive", "==", true)
      .orderBy("sortOrder", "asc")
      .get();

    const lowerQ = q.toLowerCase();

    const results = snapshot.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          slug: d.slug || "",
          name: lang === "es" ? d.nameEs || "" : d.nameEn || "",
          description:
            lang === "es"
              ? d.shortDescriptionEs || ""
              : d.shortDescriptionEn || "",
          category: d.category || "",
          price: Number(d.price) || 0,
          originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
          image: Array.isArray(d.images) && d.images[0] ? d.images[0] : null,
          inStock: d.inStock !== false,
          // hidden scoring fields
          _nameEn: (d.nameEn || "").toLowerCase(),
          _nameEs: (d.nameEs || "").toLowerCase(),
          _descEn: (d.descriptionEn || "").toLowerCase(),
          _descEs: (d.descriptionEs || "").toLowerCase(),
          _cat: (d.category || "").toLowerCase(),
        };
      })
      .filter((p) => {
        return (
          p._nameEn.includes(lowerQ) ||
          p._nameEs.includes(lowerQ) ||
          p._descEn.includes(lowerQ) ||
          p._descEs.includes(lowerQ) ||
          p._cat.includes(lowerQ)
        );
      })
      .slice(0, 20)
      .map(({ _nameEn, _nameEs, _descEn, _descEs, _cat, ...rest }) => {
        void _nameEn, _nameEs, _descEn, _descEs, _cat;
        return rest;
      });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
