import AnalyticsClient from "./AnalyticsClient";
import { getAdminAnalyticsData } from "@/lib/admin/analytics-data";

export default async function AnalyticsPage() {
  const initialData = await getAdminAnalyticsData();
  return <AnalyticsClient initialData={initialData} />;
}

