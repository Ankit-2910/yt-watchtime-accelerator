// YouTube metadata service.
//
// Two tiers, both READ-ONLY (this app never automates playback or engagement):
//   1. oEmbed  — needs NO API key. Returns title, channel, thumbnail. Always on.
//   2. Data API v3 — optional (YOUTUBE_API_KEY). Adds public view/like/comment
//      counts and exact duration for richer QA/research.

export interface ResolvedVideo {
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSec: number | null;
  publishedAt: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  source: "oembed" | "data-api";
}

/** Extract an 11-char video id from any common YouTube URL/ID form. */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|live|v)\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

/** ISO 8601 duration (PT#H#M#S) → seconds. */
export function parseISODuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const [, h, min, s] = m;
  return (Number(h ?? 0) * 3600) + (Number(min ?? 0) * 60) + Number(s ?? 0);
}

async function fetchOEmbed(videoId: string): Promise<ResolvedVideo | null> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    title: string;
    author_name: string;
    thumbnail_url: string;
  };
  return {
    videoId,
    url,
    title: data.title,
    channelTitle: data.author_name,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationSec: null,
    publishedAt: null,
    views: null,
    likes: null,
    comments: null,
    source: "oembed",
  };
}

async function fetchDataApi(videoId: string, apiKey: string): Promise<ResolvedVideo | null> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    items?: Array<{
      snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails?: Record<string, { url: string }> };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
    }>;
  };
  const item = data.items?.[0];
  if (!item) return null;
  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl:
      item.snippet.thumbnails?.high?.url ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationSec: parseISODuration(item.contentDetails.duration),
    publishedAt: item.snippet.publishedAt,
    views: item.statistics.viewCount ? Number(item.statistics.viewCount) : null,
    likes: item.statistics.likeCount ? Number(item.statistics.likeCount) : null,
    comments: item.statistics.commentCount ? Number(item.statistics.commentCount) : null,
    source: "data-api",
  };
}

/**
 * Resolve public metadata for a video. Prefers the Data API when a key is set
 * (richer stats), otherwise falls back to keyless oEmbed.
 */
export async function resolveVideo(input: string): Promise<ResolvedVideo | null> {
  const videoId = extractVideoId(input);
  if (!videoId) return null;

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const viaApi = await fetchDataApi(videoId, apiKey);
      if (viaApi) return viaApi;
    } catch {
      // fall through to oEmbed
    }
  }
  try {
    return await fetchOEmbed(videoId);
  } catch {
    return null;
  }
}
