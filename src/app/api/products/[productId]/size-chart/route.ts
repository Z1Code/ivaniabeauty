import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import type { SizeChartMeasurement, SizeChartDoc } from "@/lib/firebase/types";

// Lazy initialization to avoid errors during build when API key is not set
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

const VISION_PROMPT = `Analyze this size chart image and extract all measurements in centimeters.
Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "size": "XS",
    "waist_cm": "58-62",
    "hip_cm": "84-88",
    "bust_cm": null,
    "length_cm": null
  }
]

Rules:
- Extract ALL sizes shown in the image
- Use the exact size labels from the image (XS, S, M, L, XL, 2XL, etc.)
- Use null for measurements that are not present in the image
- Measurements should be in cm format, typically as ranges like "58-62"
- If a single value is shown instead of a range, use that value as a string
- Only return the JSON array, nothing else`;

// Fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");

  const contentType = response.headers.get("content-type") || "image/jpeg";
  return { data: base64, mimeType: contentType };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        { error: "Firebase not configured", measurements: null },
        { status: 503 }
      );
    }

    // 1. Check cache first
    const cacheRef = adminDb.collection("sizeCharts").doc(productId);
    const cacheDoc = await cacheRef.get();

    if (cacheDoc.exists) {
      const cached = cacheDoc.data() as SizeChartDoc;
      return NextResponse.json({
        measurements: cached.measurements,
        fromCache: true,
      });
    }

    // 2. Get product to find sizeChartImageUrl
    const productRef = adminDb.collection("products").doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { error: "Product not found", measurements: null },
        { status: 404 }
      );
    }

    const productData = productDoc.data();
    const sizeChartImageUrl = productData?.sizeChartImageUrl;

    if (!sizeChartImageUrl) {
      return NextResponse.json({
        measurements: null,
        message: "No size chart image configured for this product",
      });
    }

    // 3. Get Gemini client (lazy init)
    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json(
        { error: "Gemini API key not configured", measurements: null },
        { status: 503 }
      );
    }

    // 4. Fetch image and convert to base64
    const imageData = await fetchImageAsBase64(sizeChartImageUrl);

    // 5. Call Gemini Vision API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      VISION_PROMPT,
      {
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType,
        },
      },
    ]);

    const response = result.response;
    const content = response.text();

    if (!content) {
      return NextResponse.json(
        { error: "No response from Gemini", measurements: null },
        { status: 500 }
      );
    }

    // 6. Parse the JSON response
    let measurements: SizeChartMeasurement[];
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      measurements = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse Gemini response:", content);
      return NextResponse.json(
        { error: "Failed to parse size chart data", measurements: null },
        { status: 500 }
      );
    }

    // 7. Save to cache
    const sizeChartDoc: SizeChartDoc = {
      productId,
      measurements,
      extractedAt: new Date(),
      sourceImageUrl: sizeChartImageUrl,
    };

    await cacheRef.set({
      ...sizeChartDoc,
      extractedAt: new Date(),
    });

    return NextResponse.json({
      measurements,
      fromCache: false,
    });
  } catch (error) {
    console.error("Size chart extraction error:", error);
    return NextResponse.json(
      { error: "Internal server error", measurements: null },
      { status: 500 }
    );
  }
}
