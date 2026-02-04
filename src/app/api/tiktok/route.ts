import { NextResponse } from "next/server";

interface TikTokVideo {
  id: string;
  thumbnail: string;
  views: string;
  likes: string;
  url: string;
}

const TIKTOK_USER = "ivaniabeauty2";
const CACHE_TTL = 3600000; // 1 hour

let cachedData: { videos: TikTokVideo[]; timestamp: number } | null = null;

function formatCount(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

function extractScriptContent(html: string, scriptId: string): string | null {
  const marker = `id="${scriptId}"`;
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const openEnd = html.indexOf(">", idx);
  if (openEnd === -1) return null;
  const closeTag = "</script>";
  const closeIdx = html.indexOf(closeTag, openEnd);
  if (closeIdx === -1) return null;
  return html.substring(openEnd + 1, closeIdx);
}

export async function GET() {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedData.videos);
  }

  try {
    const res = await fetch(`https://www.tiktok.com/@${TIKTOK_USER}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    let videos: TikTokVideo[] = [];

    // Attempt 1: __UNIVERSAL_DATA_FOR_REHYDRATION__
    const rehydrationContent = extractScriptContent(
      html,
      "__UNIVERSAL_DATA_FOR_REHYDRATION__"
    );

    if (rehydrationContent) {
      try {
        const raw = JSON.parse(rehydrationContent);
        const scope = raw?.["__DEFAULT_SCOPE__"] ?? {};
        const userDetail = scope["webapp.user-detail"] ?? {};
        const items: unknown[] = userDetail?.itemList ?? [];

        videos = items.slice(0, 6).map((item: unknown) => {
          const v = item as Record<string, unknown>;
          const video = v.video as Record<string, unknown> | undefined;
          const stats = v.stats as Record<string, number> | undefined;
          return {
            id: String(v.id ?? ""),
            thumbnail: String(
              video?.cover ?? video?.dynamicCover ?? video?.originCover ?? ""
            ),
            views: formatCount(stats?.playCount ?? 0),
            likes: formatCount(stats?.diggCount ?? 0),
            url: `https://www.tiktok.com/@${TIKTOK_USER}/video/${v.id}`,
          };
        });
      } catch {
        // JSON parse failed, try next approach
      }
    }

    // Attempt 2: SIGI_STATE (older TikTok page format)
    if (videos.length === 0) {
      const sigiContent = extractScriptContent(html, "SIGI_STATE");
      if (sigiContent) {
        try {
          const raw = JSON.parse(sigiContent);
          const itemModule = (raw?.ItemModule ?? {}) as Record<
            string,
            Record<string, unknown>
          >;
          const items = Object.values(itemModule).slice(0, 6);

          videos = items.map((item) => {
            const video = item.video as Record<string, unknown> | undefined;
            const stats = item.stats as Record<string, number> | undefined;
            return {
              id: String(item.id ?? ""),
              thumbnail: String(
                video?.cover ?? video?.dynamicCover ?? video?.originCover ?? ""
              ),
              views: formatCount(stats?.playCount ?? 0),
              likes: formatCount(stats?.diggCount ?? 0),
              url: `https://www.tiktok.com/@${TIKTOK_USER}/video/${item.id}`,
            };
          });
        } catch {
          // JSON parse failed
        }
      }
    }

    // Attempt 3: extract og:image meta tags as fallback
    if (videos.length === 0) {
      const ogPattern = /property="og:image"[^>]+content="([^"]+)"/g;
      let match;
      const ogUrls: string[] = [];
      while ((match = ogPattern.exec(html)) !== null) {
        ogUrls.push(match[1]);
      }
      if (ogUrls.length > 0) {
        videos = ogUrls.slice(0, 6).map((url, i) => ({
          id: String(i),
          thumbnail: url,
          views: "",
          likes: "",
          url: `https://www.tiktok.com/@${TIKTOK_USER}`,
        }));
      }
    }

    // Filter out videos without valid thumbnail URLs
    videos = videos.filter(
      (v) => v.thumbnail && v.thumbnail.startsWith("http")
    );

    cachedData = { videos, timestamp: Date.now() };
    return NextResponse.json(videos);
  } catch (err) {
    console.error("TikTok API error:", err);
    return NextResponse.json([]);
  }
}
