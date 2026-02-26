import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import { PDFDocument } from "pdf-lib";

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { labelUrls } = body;

    if (!Array.isArray(labelUrls) || labelUrls.length === 0) {
      return NextResponse.json(
        { error: "No label URLs provided" },
        { status: 400 }
      );
    }

    if (labelUrls.length > 50) {
      return NextResponse.json(
        { error: "Too many labels (max 50)" },
        { status: 400 }
      );
    }

    const mergedPdf = await PDFDocument.create();

    for (const url of labelUrls) {
      try {
        // Only allow fetching from goshippo.com domains
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.endsWith(".goshippo.com") && parsedUrl.hostname !== "goshippo.com") {
          console.warn(`Blocked fetch to non-allowed domain: ${parsedUrl.hostname}`);
          continue;
        }

        const res = await fetch(url);
        if (!res.ok) continue;

        const pdfBytes = await res.arrayBuffer();
        const sourcePdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices()
        );

        for (const page of pages) {
          mergedPdf.addPage(page);
        }
      } catch (err) {
        console.warn(`Failed to fetch/merge label: ${url}`, err);
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      return NextResponse.json(
        { error: "No labels could be merged" },
        { status: 400 }
      );
    }

    const mergedBytes = await mergedPdf.save();

    return new NextResponse(Buffer.from(mergedBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="labels-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error merging labels:", error);
    return NextResponse.json(
      { error: "Failed to merge labels" },
      { status: 500 }
    );
  }
}
