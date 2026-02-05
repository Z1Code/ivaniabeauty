import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import CollectionsClient from "./CollectionsClient";

export default async function CollectionsPage() {
  await requireAdmin();

  const snapshot = await adminDb
    .collection("collections")
    .orderBy("sortOrder", "asc")
    .get();

  const collections = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      slug: d.slug || "",
      nameEn: d.nameEn || "",
      nameEs: d.nameEs || "",
      descriptionEs: d.descriptionEs || "",
      image: d.image || "",
      productCount: d.productCount || 0,
      sortOrder: d.sortOrder || 0,
      isActive: d.isActive ?? true,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  });

  return <CollectionsClient collections={collections} />;
}
