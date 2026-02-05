import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import BannerEditClient from "./BannerEditClient";

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const doc = await adminDb.collection("banners").doc(id).get();
  if (!doc.exists) {
    notFound();
  }

  const data = doc.data()!;
  const banner = {
    id: doc.id,
    titleEn: data.titleEn || "",
    titleEs: data.titleEs || "",
    subtitleEn: data.subtitleEn || "",
    subtitleEs: data.subtitleEs || "",
    imageUrl: data.imageUrl || "",
    linkUrl: data.linkUrl || "",
    position: data.position || "hero",
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive !== false,
    startsAt: data.startsAt?.toDate?.()?.toISOString()?.slice(0, 16) || "",
    endsAt: data.endsAt?.toDate?.()?.toISOString()?.slice(0, 16) || "",
  };

  return <BannerEditClient banner={banner} />;
}
