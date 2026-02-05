import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { adminDb, isFirebaseConfigured } from "@/lib/firebase/admin";
import type { SizeChartMeasurement, SizeChartDoc } from "@/lib/firebase/types";

// Lazy initialization to avoid errors during build when API key is not set
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
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

    // 3. Get OpenAI client (lazy init)
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: "OpenAI API key not configured", measurements: null },
        { status: 503 }
      );
    }

    // 4. Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: sizeChartImageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from OpenAI", measurements: null },
        { status: 500 }
      );
    }

    // 5. Parse the JSON response
    let measurements: SizeChartMeasurement[];
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      measurements = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse OpenAI response:", content);
      return NextResponse.json(
        { error: "Failed to parse size chart data", measurements: null },
        { status: 500 }
      );
    }

    // 6. Save to cache
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
