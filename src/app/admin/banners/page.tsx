import { adminDb } from "@/lib/firebase/admin";
import BannersClient, { type BannerRow } from "./BannersClient";

async function getInitialBanners(): Promise<BannerRow[]> {
  const snapshot = await adminDb
    .collection("banners")
    .select(
      "titleEn",
      "titleEs",
      "subtitleEn",
      "subtitleEs",
      "imageUrl",
      "linkUrl",
      "position",
      "sortOrder",
      "isActive",
      "startsAt",
      "endsAt",
      "createdAt"
    )
    .orderBy("sortOrder", "asc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      titleEn: data.titleEn || "",
      titleEs: data.titleEs || "",
      subtitleEn: data.subtitleEn || "",
      subtitleEs: data.subtitleEs || "",
      imageUrl: data.imageUrl || "",
      linkUrl: data.linkUrl || "",
      position: data.position || "hero",
      sortOrder: Number(data.sortOrder || 0),
      isActive: data.isActive !== false,
      startsAt: data.startsAt?.toDate?.()?.toISOString() || null,
      endsAt: data.endsAt?.toDate?.()?.toISOString() || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    };
  });
}

export default async function BannersPage() {
  const initialBanners = await getInitialBanners();
  return <BannersClient initialBanners={initialBanners} />;
}
