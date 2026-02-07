/**
 * Reseed script: Delete and re-insert products and collections in Firestore
 *
 * Run with: npx tsx scripts/reseed-products.ts
 *
 * Requires .env.local with Firebase Admin credentials.
 * Does NOT touch adminProfiles or storeSettings.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BilingualString {
  en: string;
  es: string;
}

interface BilingualArray {
  en: string[];
  es: string[];
}

interface ProductJSON {
  id: string;
  name: BilingualString;
  slug: string;
  price: number;
  originalPrice: number | null;
  category: string;
  colors: string[];
  sizes: string[];
  compression: string;
  occasion: string;
  badge: BilingualString | null;
  description: BilingualString;
  shortDescription: BilingualString;
  features: BilingualArray;
  materials: string;
  care: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

interface CollectionJSON {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

// ---------------------------------------------------------------------------
// English mappings for collections
// ---------------------------------------------------------------------------

const collectionNameEnMap: Record<string, string> = {
  fajas: "Shapewear",
  cinturillas: "Waist Cinchers & Vests",
  tops: "Tops & Brassieres",
  shorts: "Shorts",
  cuidado: "Personal Care",
};

const collectionDescEnMap: Record<string, string> = {
  fajas:
    "High compression shapers to sculpt your silhouette. For daily, post-surgical, and postpartum use.",
  cinturillas:
    "Waist cinchers and vests for extreme waist definition and targeted support.",
  tops: "Compression bras and bodies for bust, arm, and back shaping.",
  shorts:
    "Shaping shorts that enhance glutes and control abdomen invisibly.",
  cuidado:
    "Hair and body care products with natural rosemary and mint ingredients.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Delete every document in a Firestore collection using batched writes
 * (max 500 operations per batch).
 */
async function deleteCollection(collectionPath: string): Promise<number> {
  const collectionRef = db.collection(collectionPath);
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collectionRef.limit(500).get();

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    totalDeleted += snapshot.size;
    console.log(
      `  Deleted batch of ${snapshot.size} docs from "${collectionPath}" (${totalDeleted} total)`
    );
  }

  return totalDeleted;
}

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedProducts(): Promise<void> {
  console.log("\nInserting products...");

  const rawData = fs.readFileSync(
    path.join(__dirname, "../src/data/products.json"),
    "utf-8"
  );
  const products: ProductJSON[] = JSON.parse(rawData);

  // Firestore batch limit is 500 — split into chunks if needed
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const chunk = products.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const product of chunk) {
      const docRef = db.collection("products").doc();
      batch.set(docRef, {
        slug: product.slug,
        nameEn: product.name.en,
        nameEs: product.name.es,
        price: product.price,
        originalPrice: product.originalPrice,
        category: product.category,
        colors: product.colors,
        sizes: product.sizes,
        compression: product.compression,
        occasion: product.occasion,
        badgeEn: product.badge?.en || null,
        badgeEs: product.badge?.es || null,
        descriptionEn: product.description.en,
        descriptionEs: product.description.es,
        shortDescriptionEn: product.shortDescription.en,
        shortDescriptionEs: product.shortDescription.es,
        featuresEn: product.features.en,
        featuresEs: product.features.es,
        materials: product.materials,
        care: product.care,
        images: product.images,
        rating: product.rating,
        reviewCount: product.reviewCount,
        inStock: product.inStock,
        stockQuantity: 100,
        lowStockThreshold: 5,
        sku: product.id,
        isFeatured: product.badge?.en === "Bestseller",
        isActive: true,
        sortOrder: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    inserted += chunk.length;
    console.log(`  Inserted batch of ${chunk.length} products (${inserted} total)`);
  }

  console.log(`Inserted ${inserted} products`);
}

async function seedCollections(): Promise<void> {
  console.log("\nInserting collections...");

  const rawData = fs.readFileSync(
    path.join(__dirname, "../src/data/collections.json"),
    "utf-8"
  );
  const collections: CollectionJSON[] = JSON.parse(rawData);

  const batch = db.batch();

  for (const collection of collections) {
    const docRef = db.collection("collections").doc();
    batch.set(docRef, {
      slug: collection.slug,
      nameEn: collectionNameEnMap[collection.id] || collection.name,
      nameEs: collection.name,
      descriptionEn:
        collectionDescEnMap[collection.id] || collection.description,
      descriptionEs: collection.description,
      image: collection.image,
      productCount: collection.productCount,
      sortOrder: 0,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Inserted ${collections.length} collections`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  try {
    // 1. Delete existing products
    console.log("Deleting all documents from 'products'...");
    const deletedProducts = await deleteCollection("products");
    console.log(`Deleted ${deletedProducts} product documents`);

    // 2. Delete existing collections
    console.log("\nDeleting all documents from 'collections'...");
    const deletedCollections = await deleteCollection("collections");
    console.log(`Deleted ${deletedCollections} collection documents`);

    // 3. Re-seed products
    await seedProducts();

    // 4. Re-seed collections
    await seedCollections();

    console.log("\nReseed completed successfully!");
    console.log("(adminProfiles and storeSettings were NOT modified)");
  } catch (error) {
    console.error("Reseed failed:", error);
    process.exit(1);
  }
}

main();
