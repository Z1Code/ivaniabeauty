/**
 * Backfill fit-guide extraction for all products with sizeChartImageUrl.
 *
 * Run with:
 *   npx tsx scripts/backfill-fit-guides.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { FitGuideStatus } from "../src/lib/firebase/types";
import { FIT_GUIDE_VERSION } from "../src/lib/fit-guide/constants";
import { extractFitGuideFromImage, isGeminiConfigured } from "../src/lib/fit-guide/extractor";

interface ProductDocData {
  slug?: string;
  nameEs?: string;
  sizeChartImageUrl?: string | null;
}

interface BackfillItemResult {
  productId: string;
  slug: string;
  name: string;
  status: FitGuideStatus;
  confidenceScore: number;
  warnings: string[];
}

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

function now(): Date {
  return new Date();
}

function getProductName(data: ProductDocData, fallbackId: string): string {
  return data.nameEs || data.slug || fallbackId;
}

async function writeStaleDoc(
  productId: string,
  imageUrl: string,
  warning: string
): Promise<void> {
  await db.collection("sizeCharts").doc(productId).set({
    productId,
    version: FIT_GUIDE_VERSION,
    status: "stale",
    warnings: [warning],
    confidenceScore: 0,
    availableSizesCanonical: [],
    rows: [],
    measurements: [],
    sourceImageUrl: imageUrl,
    sourceImageHash: "",
    extractedAt: now(),
    confirmedAt: null,
    confirmedBy: null,
  });
}

async function writeFailedDoc(
  productId: string,
  imageUrl: string,
  warning: string
): Promise<void> {
  await db.collection("sizeCharts").doc(productId).set({
    productId,
    version: FIT_GUIDE_VERSION,
    status: "failed",
    warnings: [warning],
    confidenceScore: 0,
    availableSizesCanonical: [],
    rows: [],
    measurements: [],
    sourceImageUrl: imageUrl,
    sourceImageHash: "",
    extractedAt: now(),
    confirmedAt: null,
    confirmedBy: null,
  });
}

async function main(): Promise<void> {
  const productsSnap = await db.collection("products").get();
  const candidates = productsSnap.docs.filter((doc) => {
    const imageUrl = (doc.data() as ProductDocData).sizeChartImageUrl;
    return typeof imageUrl === "string" && imageUrl.trim().length > 0;
  });

  console.log(`Found ${productsSnap.size} products in total.`);
  console.log(`Backfill candidates with sizeChartImageUrl: ${candidates.length}`);

  if (!candidates.length) {
    console.log("No candidates found. Backfill finished.");
    return;
  }

  const results: BackfillItemResult[] = [];
  let draftCount = 0;
  let failedCount = 0;
  let staleCount = 0;
  const confirmedCount = 0;

  if (!isGeminiConfigured()) {
    console.warn("GEMINI_API_KEY is missing. Marking all candidates as stale.");

    for (const doc of candidates) {
      const data = doc.data() as ProductDocData;
      const imageUrl = (data.sizeChartImageUrl || "").trim();
      await writeStaleDoc(
        doc.id,
        imageUrl,
        "Backfill skipped: GEMINI_API_KEY is missing."
      );

      staleCount += 1;
      results.push({
        productId: doc.id,
        slug: data.slug || "",
        name: getProductName(data, doc.id),
        status: "stale",
        confidenceScore: 0,
        warnings: ["Backfill skipped: GEMINI_API_KEY is missing."],
      });
    }
  } else {
    for (let i = 0; i < candidates.length; i += 1) {
      const doc = candidates[i];
      const data = doc.data() as ProductDocData;
      const imageUrl = (data.sizeChartImageUrl || "").trim();
      const label = `${i + 1}/${candidates.length} ${getProductName(data, doc.id)}`;

      try {
        console.log(`Analyzing ${label}`);
        const extraction = await extractFitGuideFromImage(imageUrl);

        const status: FitGuideStatus =
          extraction.status === "failed" ? "failed" : "draft";

        await db.collection("sizeCharts").doc(doc.id).set({
          productId: doc.id,
          version: FIT_GUIDE_VERSION,
          status,
          warnings: extraction.warnings,
          confidenceScore: extraction.confidenceScore,
          availableSizesCanonical: extraction.availableSizesCanonical,
          rows: extraction.rows,
          measurements: extraction.measurements,
          sourceImageUrl: extraction.sourceImageUrl,
          sourceImageHash: extraction.sourceImageHash,
          extractedAt: now(),
          confirmedAt: null,
          confirmedBy: null,
        });

        if (status === "draft") draftCount += 1;
        if (status === "failed") failedCount += 1;

        results.push({
          productId: doc.id,
          slug: data.slug || "",
          name: getProductName(data, doc.id),
          status,
          confidenceScore: extraction.confidenceScore,
          warnings: extraction.warnings,
        });
      } catch (error) {
        const warning =
          error instanceof Error
            ? `Backfill extraction failed: ${error.message}`
            : "Backfill extraction failed.";

        console.error(`Failed ${label}:`, warning);
        await writeFailedDoc(doc.id, imageUrl, warning);
        failedCount += 1;

        results.push({
          productId: doc.id,
          slug: data.slug || "",
          name: getProductName(data, doc.id),
          status: "failed",
          confidenceScore: 0,
          warnings: [warning],
        });
      }
    }
  }

  const priority = [...results]
    .sort((a, b) => {
      if (a.status !== b.status) {
        if (a.status === "failed") return -1;
        if (b.status === "failed") return 1;
      }
      return a.confidenceScore - b.confidenceScore;
    })
    .slice(0, 25);

  console.log("");
  console.log("Backfill summary:");
  console.log(`confirmed=${confirmedCount}`);
  console.log(`draft=${draftCount}`);
  console.log(`failed=${failedCount}`);
  console.log(`stale=${staleCount}`);
  console.log("");
  console.log("Priority review queue:");
  for (const item of priority) {
    const firstWarning = item.warnings[0] || "-";
    console.log(
      `- [${item.status}] ${item.name} (${item.slug || item.productId}) score=${item.confidenceScore.toFixed(2)} warning=${firstWarning}`
    );
  }
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
