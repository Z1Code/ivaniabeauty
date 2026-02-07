import { NextResponse } from "next/server";

interface TikTokVideo {
  id: string;
  thumbnail: string;
  title: string;
  views: string;
  likes: string;
  url: string;
}

interface OEmbedResponse {
  thumbnail_url?: string;
  title?: string;
  author_name?: string;
  embed_product_id?: string;
}

const TIKTOK_USER = "ivaniabeauty2";
const CACHE_TTL = 3600000; // 1 hour

// Known video IDs as fallback (discovered via web search)
const FALLBACK_VIDEO_IDS = [
  "7575399875479702798",
  "7476191030237416750",
  "7460316206223052078",
  "7384980162347142431",
  "7349287074282884382",
];

let cachedData: { videos: TikTokVideo[]; timestamp: number } | null = null;

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

/** Fetch a single video thumbnail via TikTok's official oEmbed API */
async function fetchOEmbed(videoId: string): Promise<TikTokVideo | null> {
  try {
    const videoUrl = `https://www.tiktok.com/@${TIKTOK_USER}/video/${videoId}`;
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data: OEmbedResponse = await res.json();
    if (!data.thumbnail_url) return null;
    return {
      id: videoId,
      thumbnail: data.thumbnail_url,
      title: data.title ?? "",
      views: "",
      likes: "",
      url: videoUrl,
    };
  } catch {
    return null;
  }
}

/** Try to discover video IDs from the TikTok profile page */
async function discoverVideoIds(): Promise<string[]> {
  const userAgents = [
    // Googlebot gets full SSR content from TikTok
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    // Regular Chrome as fallback
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(`https://www.tiktok.com/@${TIKTOK_USER}`, {
        headers: {
          "User-Agent": ua,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;
      const html = await res.text();
      const ids: string[] = [];

      // Method 1: __UNIVERSAL_DATA_FOR_REHYDRATION__
      const rehydration = extractScriptContent(
        html,
        "__UNIVERSAL_DATA_FOR_REHYDRATION__"
      );
      if (rehydration) {
        try {
          const raw = JSON.parse(rehydration);
          const scope = raw?.["__DEFAULT_SCOPE__"] ?? {};
          const userDetail = scope["webapp.user-detail"] ?? {};
          const items: Array<{ id?: string }> = userDetail?.itemList ?? [];
          for (const item of items) {
            if (item.id) ids.push(String(item.id));
          }
        } catch {
          /* parse failed */
        }
      }

      // Method 2: SIGI_STATE
      if (ids.length === 0) {
        const sigi = extractScriptContent(html, "SIGI_STATE");
        if (sigi) {
          try {
            const raw = JSON.parse(sigi);
            const itemModule = raw?.ItemModule ?? {};
            for (const key of Object.keys(itemModule)) {
              ids.push(key);
            }
          } catch {
            /* parse failed */
          }
        }
      }

      // Method 3: Extract video IDs from URLs in the HTML
      if (ids.length === 0) {
        const videoUrlPattern = new RegExp(
          `@${TIKTOK_USER}/video/(\\d+)`,
          "g"
        );
        let match;
        while ((match = videoUrlPattern.exec(html)) !== null) {
          if (!ids.includes(match[1])) {
            ids.push(match[1]);
          }
        }
      }

      if (ids.length > 0) return ids.slice(0, 6);
    } catch {
      continue;
    }
  }

  return [];
}

export async function GET() {
  // Return cached data if fresh
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedData.videos);
  }

  try {
    // Step 1: Try to discover video IDs from the profile page
    let videoIds = await discoverVideoIds();

    // Step 2: Fall back to known video IDs if discovery failed
    if (videoIds.length === 0) {
      videoIds = FALLBACK_VIDEO_IDS;
    }

    // Step 3: Fetch thumbnails via oEmbed API (parallel)
    const oembedResults = await Promise.all(
      videoIds.slice(0, 6).map((id) => fetchOEmbed(id))
    );

    const videos = oembedResults.filter(
      (v): v is TikTokVideo => v !== null && v.thumbnail.startsWith("http")
    );

    cachedData = { videos, timestamp: Date.now() };
    return NextResponse.json(videos);
  } catch (err) {
    console.error("TikTok API error:", err);
    return NextResponse.json([]);
  }
}
