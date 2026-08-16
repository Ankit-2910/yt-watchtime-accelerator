// DEMO / SIMULATION data generator.
//
// ⚠️  SIMULATED DATA — NOT YOUTUBE TRAFFIC.
// Everything produced here is synthetic and lives only inside this app for
// building, testing and demoing the dashboard. It is NEVER sent to YouTube and
// never counts as real engagement. See lib/safety.ts for the platform principle.

import type {
  ChannelSnapshot,
  RetentionBucket,
  TimePoint,
  Video,
  VideoFormat,
} from "./types";

/** Tiny deterministic PRNG (mulberry32) so demo data is stable across renders. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOPICS = [
  "Ancient Civilizations",
  "The Story of the Roman Empire",
  "How Cities Were Born",
  "The First Writing Systems",
  "Lost Technologies of the Ancients",
  "The Rise of the First Empire",
  "Mysteries of the Bronze Age",
  "Trade Routes That Built the World",
  "The Fall of Great Kingdoms",
  "Engineering Marvels of Antiquity",
  "Everyday Life 3000 Years Ago",
  "The Birth of Mathematics",
];

function shortId(rng: () => number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
  let out = "";
  for (let i = 0; i < 11; i++) out += chars[Math.floor(rng() * chars.length)];
  return out;
}

function retentionCurve(rng: () => number, isShort: boolean): RetentionBucket[] {
  // Start at 100% and decay; shorts hold higher.
  const labels = isShort
    ? ["0-5s", "5-15s", "15-30s", "30-45s", "45-60s"]
    : ["0-5s", "5-30s", "30-60s", "1-3m", "3-5m", "5m+"];
  let r = 100;
  return labels.map((label, i) => {
    const drop = i === 0 ? rng() * 18 + 4 : rng() * 12 + 3;
    r = Math.max(8, r - drop * (isShort ? 0.5 : 1));
    return { label, retention: Math.round(r) };
  });
}

function daysAgoISO(now: Date, days: number): string {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() - days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function makeVideo(
  rng: () => number,
  now: Date,
  index: number,
  format: VideoFormat
): Video {
  const ageDays = Math.floor(rng() * 150) + 2;
  const isShort = format === "short";
  const baseViews = isShort
    ? Math.floor(rng() * 40000) + 3000
    : Math.floor(rng() * 60000) + 1500;
  const durationSec = isShort
    ? Math.floor(rng() * 45) + 15
    : Math.floor(rng() * 900) + 360; // 6-21 min
  const avgPct = isShort ? rng() * 35 + 45 : rng() * 30 + 25; // %
  const avgViewDuration = (durationSec * avgPct) / 100;
  const watchHours = (baseViews * avgViewDuration) / 3600;
  const ctr = rng() * 6 + 3;
  const returning = Math.floor(baseViews * (rng() * 0.3 + 0.1));
  const ytId = shortId(rng);
  const topic = TOPICS[index % TOPICS.length];

  return {
    id: `demo-${format}-${index}`,
    ytVideoId: ytId,
    title: isShort ? `${topic} — in 60 seconds` : `${topic}: The Full Story`,
    channelTitle: "Chronicle Lab (Demo)",
    thumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${ytId}`,
    durationSec,
    publishedAt: daysAgoISO(now, ageDays),
    format,
    playlist: rng() > 0.4 ? topic.split(":")[0] : undefined,
    stats: {
      views: baseViews,
      likes: Math.floor(baseViews * (rng() * 0.05 + 0.01)),
      comments: Math.floor(baseViews * (rng() * 0.006 + 0.001)),
      avgViewDuration: Math.round(avgViewDuration),
      avgPercentageViewed: Math.round(avgPct),
      watchHours: Math.round(watchHours),
      ctr: Math.round(ctr * 10) / 10,
      subscribersGained: Math.floor(baseViews * (rng() * 0.02 + 0.002)),
      newViewers: baseViews - returning,
      returningViewers: returning,
    },
    retentionCurve: retentionCurve(rng, isShort),
    ageDays,
  };
}

/**
 * Build a full synthetic channel snapshot.
 * @param now anchor "today" (pass the client's Date on mount to avoid SSR drift)
 * @param seed PRNG seed for reproducibility
 */
export function generateDemoChannel(now: Date, seed = 20260816): ChannelSnapshot {
  const rng = mulberry32(seed);

  const longVideos = Array.from({ length: 16 }, (_, i) => makeVideo(rng, now, i, "long"));
  const shortVideos = Array.from({ length: 8 }, (_, i) => makeVideo(rng, now, i + 100, "short"));
  const videos = [...longVideos, ...shortVideos];

  // 180-day timeline with a gentle upward trend + weekly seasonality.
  const timeline: TimePoint[] = [];
  let cumSubs = 640;
  let cumWatch = 0;
  const days = 180;
  for (let i = days - 1; i >= 0; i--) {
    const dayIndex = days - i;
    const trend = dayIndex / days; // 0..1 growth
    const weekly = 1 + 0.25 * Math.sin((dayIndex / 7) * Math.PI * 2);
    const dailyWatch = (8 + trend * 22) * weekly * (0.85 + rng() * 0.3);
    const shortsFeed = dailyWatch * (rng() * 0.25 + 0.1);
    const dailyViews = Math.floor((300 + trend * 900) * weekly * (0.8 + rng() * 0.4));
    const subsGain = Math.floor(dailyViews * (rng() * 0.02 + 0.004));
    cumSubs += subsGain;
    cumWatch += dailyWatch;
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - i);
    timeline.push({
      date: d.toISOString().slice(0, 10),
      watchHours: Math.round(dailyWatch * 10) / 10,
      shortsFeedHours: Math.round(shortsFeed * 10) / 10,
      views: dailyViews,
      subscribers: cumSubs,
    });
  }

  const totalViews = videos.reduce((s, v) => s + v.stats.views, 0);
  const avgViewDuration = Math.round(
    videos.reduce((s, v) => s + v.stats.avgViewDuration, 0) / videos.length
  );
  const avgRetention = Math.round(
    videos.reduce((s, v) => s + v.stats.avgPercentageViewed, 0) / videos.length
  );
  const ctr = Math.round(
    (videos.reduce((s, v) => s + v.stats.ctr, 0) / videos.length) * 10
  ) / 10;
  const totalReturning = videos.reduce((s, v) => s + v.stats.returningViewers, 0);
  const returningViewerRate = Math.round((totalReturning / totalViews) * 100);

  return {
    id: "demo-channel",
    title: "Chronicle Lab (Demo)",
    handle: "@chroniclelab",
    thumbnailUrl: "https://yt3.ggpht.com/ytc/default.jpg",
    subscribers: cumSubs,
    totalViews,
    currentWatchHours: Math.round(cumWatch),
    targetWatchHours: 4000,
    avgViewDuration,
    avgRetention,
    ctr,
    returningViewerRate,
    videos,
    timeline,
    isDemo: true,
  };
}
