// Build a real ChannelSnapshot from the creator's own YouTube account.
// Server-only. READ-ONLY: Data API v3 (public metadata + stats) + YouTube
// Analytics API v2 (private watch time, retention, subscribers). No writes.

import type {
  ChannelSnapshot,
  RetentionBucket,
  TimePoint,
  Video,
  VideoFormat,
} from "./types";

const DATA = "https://www.googleapis.com/youtube/v3";
const ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getJSON(url: string, token: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function parseISODurationSec(iso: string): number {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/**
 * Model an audience-retention curve from the real average % viewed.
 * True per-second retention needs the Analytics `elapsedVideoTimeRatio`
 * dimension (elevated access); this is a labeled approximation so the
 * Retention page stays useful.
 */
function modelRetention(avgPct: number, isShort: boolean): RetentionBucket[] {
  const labels = isShort
    ? ["0-5s", "5-15s", "15-30s", "30-45s", "45-60s"]
    : ["0-5s", "5-30s", "30-60s", "1-3m", "3-5m", "5m+"];
  const target = Math.max(5, Math.min(95, avgPct)) / 100;
  // exponential decay whose mean ≈ target
  const k = Math.max(0.15, 1 - target);
  return labels.map((label, i) => {
    const t = i / (labels.length - 1);
    const r = Math.round(100 * Math.exp(-k * t * 3));
    return { label, retention: Math.max(4, r) };
  });
}

export async function buildRealChannel(token: string): Promise<ChannelSnapshot> {
  // 1) Channel core
  const chRes = await getJSON(
    `${DATA}/channels?part=snippet,statistics,contentDetails&mine=true`,
    token
  );
  const ch = chRes.items?.[0];
  if (!ch) throw new Error("No channel found for the authenticated account.");
  const uploads = ch.contentDetails?.relatedPlaylists?.uploads;
  const subscribers = Number(ch.statistics?.subscriberCount ?? 0);
  const totalViews = Number(ch.statistics?.viewCount ?? 0);

  // 2) Recent uploads → video ids
  let videoIds: string[] = [];
  if (uploads) {
    const pl = await getJSON(
      `${DATA}/playlistItems?part=contentDetails&maxResults=30&playlistId=${uploads}`,
      token
    );
    videoIds = (pl.items ?? [])
      .map((it: any) => it.contentDetails?.videoId)
      .filter(Boolean);
  }

  // 3) Video metadata + public stats
  const videosById = new Map<string, any>();
  if (videoIds.length) {
    const v = await getJSON(
      `${DATA}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}`,
      token
    );
    for (const item of v.items ?? []) videosById.set(item.id, item);
  }

  const today = new Date();
  const wideStart = "2005-02-14"; // YouTube launch — captures lifetime
  const windowStart = new Date(today.getTime() - 179 * 86_400_000);

  // 4) Lifetime valid watch hours (toward the 4,000-hour gate)
  let currentWatchHours = 0;
  try {
    const life = await getJSON(
      `${ANALYTICS}?ids=channel==MINE&startDate=${wideStart}&endDate=${ymd(today)}&metrics=estimatedMinutesWatched`,
      token
    );
    currentWatchHours = Math.round((life.rows?.[0]?.[0] ?? 0) / 60);
  } catch {
    /* leave 0 if analytics not authorized */
  }

  // 5) Daily timeline (last 180d)
  const timeline: TimePoint[] = [];
  try {
    const daily = await getJSON(
      `${ANALYTICS}?ids=channel==MINE&startDate=${ymd(windowStart)}&endDate=${ymd(today)}` +
        `&dimensions=day&metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost&sort=day`,
      token
    );
    const rows: any[][] = daily.rows ?? [];
    const netTotal = rows.reduce((s, r) => s + (r[3] ?? 0) - (r[4] ?? 0), 0);
    let cum = subscribers - netTotal;
    for (const r of rows) {
      cum += (r[3] ?? 0) - (r[4] ?? 0);
      timeline.push({
        date: String(r[0]),
        views: Number(r[1] ?? 0),
        watchHours: Math.round(((r[2] ?? 0) / 60) * 10) / 10,
        shortsFeedHours: 0,
        subscribers: Math.max(0, Math.round(cum)),
      });
    }
  } catch {
    /* timeline stays empty; charts will show a flat/empty series */
  }

  // 6) Per-video analytics (watch hours, avg duration, % viewed)
  const perVideo = new Map<string, any[]>();
  if (videoIds.length) {
    try {
      const rep = await getJSON(
        `${ANALYTICS}?ids=channel==MINE&startDate=${wideStart}&endDate=${ymd(today)}` +
          `&dimensions=video&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained` +
          `&filters=video==${videoIds.join(",")}&maxResults=200`,
        token
      );
      for (const r of rep.rows ?? []) perVideo.set(String(r[0]), r);
    } catch {
      /* fall back to Data API stats only */
    }
  }

  const videos: Video[] = videoIds.map((id, i): Video => {
    const meta = videosById.get(id);
    const snip = meta?.snippet ?? {};
    const stat = meta?.statistics ?? {};
    const durationSec = parseISODurationSec(meta?.contentDetails?.duration ?? "");
    const format: VideoFormat = durationSec > 0 && durationSec <= 60 ? "short" : "long";
    const a = perVideo.get(id);
    const views = Number(stat.viewCount ?? a?.[1] ?? 0);
    const watchHours = a ? Math.round((a[2] ?? 0) / 60) : 0;
    const avgViewDuration = a ? Math.round(a[3] ?? 0) : 0;
    const avgPct = a ? Math.round(a[4] ?? 0) : 0;
    const publishedAt = snip.publishedAt ?? new Date().toISOString();
    const ageDays = Math.max(
      1,
      Math.round((today.getTime() - new Date(publishedAt).getTime()) / 86_400_000)
    );
    return {
      id: `yt-${id}`,
      ytVideoId: id,
      title: snip.title ?? id,
      channelTitle: ch.snippet?.title ?? "",
      thumbnailUrl:
        snip.thumbnails?.high?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${id}`,
      durationSec,
      publishedAt,
      format,
      playlist: undefined,
      stats: {
        views,
        likes: Number(stat.likeCount ?? 0),
        comments: Number(stat.commentCount ?? 0),
        avgViewDuration,
        avgPercentageViewed: avgPct,
        watchHours,
        ctr: 0, // impression CTR isn't exposed by the public Analytics API
        subscribersGained: a ? Number(a[5] ?? 0) : 0,
        newViewers: views,
        returningViewers: 0,
      },
      retentionCurve: modelRetention(avgPct || 30, format === "short"),
      ageDays,
    };
  });

  const avgViewDuration = videos.length
    ? Math.round(videos.reduce((s, v) => s + v.stats.avgViewDuration, 0) / videos.length)
    : 0;
  const avgRetention = videos.length
    ? Math.round(videos.reduce((s, v) => s + v.stats.avgPercentageViewed, 0) / videos.length)
    : 0;

  return {
    id: ch.id,
    title: ch.snippet?.title ?? "My Channel",
    handle: ch.snippet?.customUrl ?? "",
    thumbnailUrl: ch.snippet?.thumbnails?.default?.url ?? "",
    subscribers,
    totalViews,
    currentWatchHours,
    targetWatchHours: 4000,
    avgViewDuration,
    avgRetention,
    ctr: 0,
    returningViewerRate: 0,
    videos,
    timeline,
    isDemo: false,
  };
}
