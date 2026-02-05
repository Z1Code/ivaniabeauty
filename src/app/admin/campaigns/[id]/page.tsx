import { requireAdmin } from "@/lib/firebase/auth-helpers";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import CampaignEditClient from "./CampaignEditClient";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const doc = await adminDb.collection("campaigns").doc(id).get();
  if (!doc.exists) notFound();

  const data = doc.data()!;
  const initialData = {
    id: doc.id,
    name: data.name || "",
    description: data.description || "",
    couponId: data.couponId || "",
    bannerImage: data.bannerImage || "",
    bannerTextEn: data.bannerTextEn || "",
    bannerTextEs: data.bannerTextEs || "",
    targetUrl: data.targetUrl || "/shop",
    startsAt: data.startsAt?.toDate?.()?.toISOString()?.slice(0, 16) || "",
    endsAt: data.endsAt?.toDate?.()?.toISOString()?.slice(0, 16) || "",
    isActive: data.isActive !== false,
  };

  return <CampaignEditClient initialData={initialData} />;
}
