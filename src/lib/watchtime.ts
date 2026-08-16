// Pure, testable watch-time & roadmap math.
// Every function here is an ANALYTICAL ESTIMATE based on real inputs —
// it never generates or simulates YouTube traffic.

import type {
  ChannelSnapshot,
  ChannelScore,
  RoadmapScenario,
  TimePoint,
  Video,
} from "./types";

/** Total watch minutes = views × average view duration (minutes). */
export function totalWatchMinutes(views: number, avgViewDurationMin: number): number {
  if (views < 0 || avgViewDurationMin < 0) return 0;
  return views * avgViewDurationMin;
}

/** Total watch hours from views and average view duration (minutes). */
export function totalWatchHours(views: number, avgViewDurationMin: number): number {
  return totalWatchMinutes(views, avgViewDurationMin) / 60;
}

/** Average watch hours per day over a period. */
export function watchHoursPerDay(totalHours: number, days: number): number {
  if (days <= 0) return 0;
  return totalHours / days;
}

export function watchHoursPerWeek(totalHours: number, days: number): number {
  return watchHoursPerDay(totalHours, days) * 7;
}

export interface Progress {
  current: number;
  target: number;
  remaining: number;
  percent: number; // 0-100
}

export function progress(current: number, target: number): Progress {
  const safeTarget = target > 0 ? target : 1;
  const remaining = Math.max(target - current, 0);
  const percent = Math.min((current / safeTarget) * 100, 100);
  return { current, target, remaining, percent };
}

/** Sum of watch hours over the trailing N days of a timeline. */
export function trailingWatchHours(timeline: TimePoint[], days: number): number {
  return timeline.slice(-days).reduce((sum, p) => sum + p.watchHours, 0);
}

/** Trailing daily-average watch hours over the last N days. */
export function trailingDailyRate(timeline: TimePoint[], days: number): number {
  const window = timeline.slice(-days);
  if (window.length === 0) return 0;
  const sum = window.reduce((s, p) => s + p.watchHours, 0);
  return sum / window.length;
}

/**
 * Projected completion date if the given daily rate continues.
 * Anchored to `from` (defaults to a caller-supplied "today") — kept pure so
 * it is deterministic and testable.
 */
export function projectedCompletion(
  remainingHours: number,
  hoursPerDay: number,
  from: Date
): { daysRemaining: number; date: Date } | null {
  if (hoursPerDay <= 0) return null;
  const daysRemaining = Math.ceil(remainingHours / hoursPerDay);
  const date = new Date(from.getTime());
  date.setDate(date.getDate() + daysRemaining);
  return { daysRemaining, date };
}

/**
 * Build the three roadmap scenarios. The realistic rate is derived from the
 * channel's own trailing performance; conservative/aggressive scale off it.
 */
export function buildScenarios(
  remainingHours: number,
  realisticDailyRate: number,
  from: Date
): RoadmapScenario[] {
  const realistic = Math.max(realisticDailyRate, 0.1);
  const defs: { name: RoadmapScenario["name"]; rate: number }[] = [
    { name: "Conservative", rate: realistic * 0.5 },
    { name: "Realistic", rate: realistic },
    { name: "Aggressive", rate: realistic * 2 },
  ];
  return defs.map(({ name, rate }) => {
    const p = projectedCompletion(remainingHours, rate, from);
    return {
      name,
      hoursPerDay: round(rate, 1),
      daysRemaining: p?.daysRemaining ?? Infinity,
      completionDate: p ? p.date.toISOString() : "",
    };
  });
}

/** Required daily/weekly rate to hit target by a deadline in `days`. */
export function requiredRate(remainingHours: number, days: number) {
  const daily = days > 0 ? remainingHours / days : remainingHours;
  return { daily: round(daily, 2), weekly: round(daily * 7, 2) };
}

// ─────────────────────────── Channel health score ───────────────────────────

function scaleClamp(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/**
 * Channel Health Score /100 from real signals. Each component is normalized to
 * a realistic band and averaged (weighted toward the metrics that most affect
 * legitimate watch time).
 */
export function channelScore(channel: ChannelSnapshot): ChannelScore {
  const videos = channel.videos;
  const publishFreq = publishFrequencyPerWeek(videos);
  const topicConsistency = topicConsistencyScore(videos);
  const playlistStructure = videos.filter((v) => v.playlist).length /
    Math.max(videos.length, 1) * 100;
  const subConversion = channel.totalViews > 0
    ? scaleClamp((channel.subscribers / channel.totalViews) * 1000, 0, 20)
    : 0;

  const components = [
    { label: "Content consistency", score: round(scaleClamp(publishFreq, 0, 4)) },
    { label: "CTR", score: round(scaleClamp(channel.ctr, 2, 10)) },
    { label: "Retention", score: round(scaleClamp(channel.avgRetention, 20, 60)) },
    {
      label: "Watch time",
      score: round(scaleClamp(trailingDailyRate(channel.timeline, 30), 0, 60)),
    },
    { label: "Returning viewers", score: round(scaleClamp(channel.returningViewerRate, 10, 45)) },
    { label: "Subscriber conversion", score: round(subConversion) },
    { label: "Playlist structure", score: round(playlistStructure) },
    { label: "Topic consistency", score: round(topicConsistency) },
  ];

  const overall = round(
    components.reduce((s, c) => s + c.score, 0) / components.length
  );
  return { overall, components };
}

export function publishFrequencyPerWeek(videos: Video[]): number {
  if (videos.length < 2) return videos.length;
  const dates = videos
    .map((v) => new Date(v.publishedAt).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (dates.length < 2) return 0;
  const spanDays = (dates[dates.length - 1] - dates[0]) / 86_400_000;
  if (spanDays <= 0) return dates.length;
  return (dates.length / spanDays) * 7;
}

/** Rough topic consistency from title keyword overlap (0-100). */
export function topicConsistencyScore(videos: Video[]): number {
  if (videos.length < 2) return 100;
  const stop = new Set([
    "the", "a", "an", "to", "of", "in", "on", "for", "and", "or", "how",
    "why", "what", "is", "your", "my", "you", "i", "with", "this", "that",
  ]);
  const freq = new Map<string, number>();
  for (const v of videos) {
    const words = new Set(
      v.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stop.has(w))
    );
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const shared = [...freq.values()].filter((c) => c >= videos.length * 0.3).length;
  return Math.min(100, shared * 15);
}

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
