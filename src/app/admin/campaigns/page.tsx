import { adminDb } from "@/lib/firebase/admin";
import CampaignsClient, { type CampaignRow } from "./CampaignsClient";

async function getInitialCampaigns(): Promise<CampaignRow[]> {
  const snapshot = await adminDb
    .collection("campaigns")
    .select(
      "name",
      "description",
      "couponId",
      "startsAt",
      "endsAt",
      "isActive",
      "bannerImage",
      "bannerTextEn",
      "bannerTextEs",
      "targetUrl",
      "createdAt"
    )
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || "",
      description: data.description || "",
      couponId: data.couponId || null,
      startsAt: data.startsAt?.toDate?.()?.toISOString() || null,
      endsAt: data.endsAt?.toDate?.()?.toISOString() || null,
      isActive: data.isActive !== false,
      bannerImage: data.bannerImage || null,
      bannerTextEn: data.bannerTextEn || "",
      bannerTextEs: data.bannerTextEs || "",
      targetUrl: data.targetUrl || "/shop",
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    };
  });
}

export default async function CampaignsPage() {
  const initialCampaigns = await getInitialCampaigns();
  return <CampaignsClient initialCampaigns={initialCampaigns} />;
}
