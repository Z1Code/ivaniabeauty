export interface VercelPageView {
  key: string;
  total: number;
}

export interface VercelReferrer {
  key: string;
  total: number;
}

export interface VercelTimeSeries {
  date: string;
  pageViews: number;
  visitors: number;
}

export interface VercelAnalyticsData {
  timeSeries: VercelTimeSeries[];
  topPages: VercelPageView[];
  topReferrers: VercelReferrer[];
  totalPageViews: number;
  totalVisitors: number;
  /** Whether the env vars are configured (token + projectId present) */
  configured: boolean;
}

function emptyData(configured = false): VercelAnalyticsData {
  return {
    timeSeries: [],
    topPages: [],
    topReferrers: [],
    totalPageViews: 0,
    totalVisitors: 0,
    configured,
  };
}

export async function fetchVercelAnalytics(
  range: "7d" | "30d" | "90d" = "30d"
): Promise<VercelAnalyticsData> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return emptyData(false);
  }

  const now = new Date();
  const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[range];
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const baseUrl = "https://vercel.com/api/web/insights";
  const params = new URLSearchParams({
    projectId,
    from: from.toISOString(),
    to: now.toISOString(),
    limit: "10",
  });

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const [timeSeriesRes, pagesRes, referrersRes] = await Promise.all([
      fetch(`${baseUrl}/stats/path?${params}&type=timeseries`, { headers, next: { revalidate: 300 } }).catch(() => null),
      fetch(`${baseUrl}/stats/path?${params}`, { headers, next: { revalidate: 300 } }).catch(() => null),
      fetch(`${baseUrl}/stats/referrer?${params}`, { headers, next: { revalidate: 300 } }).catch(() => null),
    ]);

    let timeSeries: VercelTimeSeries[] = [];
    let topPages: VercelPageView[] = [];
    let topReferrers: VercelReferrer[] = [];

    // Helper: safely parse JSON (204 No Content returns empty body)
    const safeJson = async (res: Response | null) => {
      if (!res?.ok || res.status === 204) return null;
      try {
        return await res.json();
      } catch {
        return null;
      }
    };

    const timeSeriesJson = await safeJson(timeSeriesRes);
    if (Array.isArray(timeSeriesJson?.data)) {
      timeSeries = timeSeriesJson.data.map((d: Record<string, unknown>) => ({
        date: String(d.key || d.date || ""),
        pageViews: Number(d.total || d.pageViews || 0),
        visitors: Number(d.visitors || d.total || 0),
      }));
    }

    const pagesJson = await safeJson(pagesRes);
    if (Array.isArray(pagesJson?.data)) {
      topPages = pagesJson.data.slice(0, 10).map((d: Record<string, unknown>) => ({
        key: String(d.key || ""),
        total: Number(d.total || 0),
      }));
    }

    const referrersJson = await safeJson(referrersRes);
    if (Array.isArray(referrersJson?.data)) {
      topReferrers = referrersJson.data.slice(0, 10).map((d: Record<string, unknown>) => ({
        key: String(d.key || "(direct)"),
        total: Number(d.total || 0),
      }));
    }

    const totalPageViews = topPages.reduce((sum, p) => sum + p.total, 0);
    const totalVisitors = timeSeries.reduce((sum, d) => sum + d.visitors, 0);

    return {
      timeSeries,
      topPages,
      topReferrers,
      totalPageViews,
      totalVisitors,
      configured: true,
    };
  } catch (error) {
    console.error("Error fetching Vercel analytics:", error);
    return emptyData(true);
  }
}
