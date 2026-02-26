/**
 * Seed script: Migrate products.json and collections.json to Firestore
 *
 * Run with: npx tsx scripts/seed-firestore.ts
 *
 * Requires .env.local with Firebase Admin credentials
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

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

async function seedProducts() {
  console.log("Seeding products...");
  const rawData = fs.readFileSync(
    path.join(__dirname, "../src/data/products.json"),
    "utf-8"
  );
  const products: ProductJSON[] = JSON.parse(rawData);

  const batch = db.batch();

  for (const product of products) {
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
  console.log(`Seeded ${products.length} products`);
}

async function seedCollections() {
  console.log("Seeding collections...");
  const rawData = fs.readFileSync(
    path.join(__dirname, "../src/data/collections.json"),
    "utf-8"
  );
  const collections: CollectionJSON[] = JSON.parse(rawData);

  // English names mapping
  const nameEnMap: Record<string, string> = {
    playa: "Beach & Pool",
    diario: "Daily Wear",
    eventos: "Events & Parties",
    postparto: "Post-Partum",
  };

  const descEnMap: Record<string, string> = {
    playa: "Shapers designed to be invisible under your bikini or swimsuit.",
    diario: "Comfortable everyday shapers for work, errands, and daily life.",
    eventos:
      "Elegant sculpting solutions for special occasions and celebrations.",
    postparto: "Recovery shapers designed for the postpartum journey.",
  };

  const batch = db.batch();

  for (const collection of collections) {
    const docRef = db.collection("collections").doc();
    batch.set(docRef, {
      slug: collection.slug,
      nameEn: nameEnMap[collection.id] || collection.name,
      nameEs: collection.name,
      descriptionEn: descEnMap[collection.id] || collection.description,
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
  console.log(`Seeded ${collections.length} collections`);
}

async function seedSettings() {
  console.log("Seeding store settings...");

  const settings: Record<string, unknown> = {
    storeName: "Ivania Beauty",
    storeEmail: "hola@ivaniabeauty.com",
    storePhone: "+1 (234) 567-890",
    currency: "USD",
    shippingStandardRate: 0,
    shippingExpressRate: 12.99,
    freeShippingThreshold: 100,
    taxRate: 0,
    lowStockAlertThreshold: 5,
    homeSections: {
      showCollections: true,
      showFeaturedProduct: true,
      showSizeQuiz: true,
      showTikTok: true,
      showInstagram: true,
      heroEffectIntensity: "medium",
    },
    footerSettings: {
      whatsappNumber: "+1 (234) 567-890",
      whatsappMessage: "Hola! Quiero mas informacion sobre Ivania Beauty.",
      socialLinks: [
        {
          id: "instagram",
          platform: "instagram",
          label: "Instagram",
          href: "https://instagram.com",
        },
        {
          id: "tiktok",
          platform: "tiktok",
          label: "TikTok",
          href: "https://www.tiktok.com/@ivaniabeauty2",
        },
        {
          id: "facebook",
          platform: "facebook",
          label: "Facebook",
          href: "https://facebook.com",
        },
        {
          id: "x",
          platform: "x",
          label: "X",
          href: "https://x.com",
        },
      ],
    },
  };

  const batch = db.batch();

  for (const [key, value] of Object.entries(settings)) {
    const docRef = db.collection("storeSettings").doc(key);
    batch.set(docRef, {
      value,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log("Seeded store settings");
}

async function createAdminUser() {
  const adminEmail = "admin@ivaniabeauty.com";
  const adminPassword = "Admin123!";

  console.log(`Creating admin user: ${adminEmail}`);

  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log("Admin user already exists:", userRecord.uid);
    } catch {
      // Create the user
      userRecord = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: "Admin",
      });
      console.log("Created admin user:", userRecord.uid);
    }

    // Create admin profile in Firestore
    await db.collection("adminProfiles").doc(userRecord.uid).set(
      {
        email: adminEmail,
        fullName: "Admin",
        role: "super_admin",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("Admin profile created/updated in Firestore");
    console.log("");
    console.log("=== ADMIN LOGIN CREDENTIALS ===");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("================================");
    console.log("IMPORTANT: Change this password after first login!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

async function main() {
  try {
    await seedProducts();
    await seedCollections();
    await seedSettings();
    await createAdminUser();
    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

main();
