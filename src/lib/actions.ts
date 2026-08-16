// The decision engine: "What should I do next?" — Top 5 ranked actions and the
// daily plan, derived deterministically from real channel signals. This is the
// non-AI backbone the Command Center and NOVA both build on.

import type { Action, ChannelSnapshot, Video } from "./types";
import { trailingDailyRate } from "./watchtime";

/** Videos ranked by views-per-day (momentum), highest first. */
export function byMomentum(videos: Video[]): Video[] {
  return [...videos].sort(
    (a, b) => b.stats.views / Math.max(b.ageDays, 1) - a.stats.views / Math.max(a.ageDays, 1)
  );
}

export function lowestRetention(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => a.stats.avgPercentageViewed - b.stats.avgPercentageViewed);
}

export function highestTraffic(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => b.stats.views - a.stats.views);
}

/** Undervalued = strong retention but comparatively few views. */
export function mostUndervalued(videos: Video[]): Video | null {
  if (!videos.length) return null;
  const maxViews = Math.max(...videos.map((v) => v.stats.views), 1);
  return [...videos]
    .map((v) => ({
      v,
      score: v.stats.avgPercentageViewed * (1 - v.stats.views / maxViews),
    }))
    .sort((a, b) => b.score - a.score)[0].v;
}

function clampTitle(t: string, n = 42): string {
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

/**
 * Build the ranked TOP 5 actions. Each action gets impact/effort/confidence so
 * the UI can sort by expected legitimate watch-time payoff.
 */
export function topActions(channel: ChannelSnapshot): Action[] {
  const videos = channel.videos;
  const actions: Action[] = [];
  if (!videos.length) return actions;

  const traffic = highestTraffic(videos);
  const lowRet = lowestRetention(traffic.slice(0, 6)); // low retention among high-traffic
  const momentum = byMomentum(videos);
  const undervalued = mostUndervalued(videos);
  const noPlaylist = videos.filter((v) => !v.playlist);
  const topLong = traffic.find((v) => v.format === "long");

  // 1. Fix retention on a high-traffic, low-retention video (biggest lever).
  const fixTarget = lowRet[0];
  if (fixTarget) {
    actions.push({
      title: `Rewrite the first 30s of "${clampTitle(fixTarget.title)}"`,
      detail: `It gets strong impressions but only ${fixTarget.stats.avgPercentageViewed}% average view. Improving its hook lifts watch hours on your most-seen traffic.`,
      impact: 92,
      effort: 45,
      confidence: 80,
    });
  }

  // 2. Sequel to the fastest grower.
  const grower = momentum[0];
  if (grower) {
    actions.push({
      title: `Make a sequel to "${clampTitle(grower.title)}"`,
      detail: `Your fastest-growing topic by views/day. A follow-up rides proven demand and pulls returning viewers.`,
      impact: 85,
      effort: 70,
      confidence: 75,
    });
  }

  // 3. Playlist to build session depth.
  if (topLong && noPlaylist.length >= 2) {
    actions.push({
      title: `Build a binge playlist around "${clampTitle(topLong.title)}"`,
      detail: `${noPlaylist.length} videos aren't in a playlist. Chaining related videos raises legitimate session duration — multiple videos per visit.`,
      impact: 78,
      effort: 25,
      confidence: 82,
    });
  }

  // 4. Surface the undervalued video via a Short.
  if (undervalued) {
    actions.push({
      title: `Cut a Short teasing "${clampTitle(undervalued.title)}"`,
      detail: `High retention (${undervalued.stats.avgPercentageViewed}%) but underexposed. A Short funnels new viewers to a video that's proven to hold attention.`,
      impact: 70,
      effort: 35,
      confidence: 70,
    });
  }

  // 5. Consistency nudge based on trailing rate trend.
  const last7 = trailingDailyRate(channel.timeline, 7);
  const prev7 = trailingDailyRate(channel.timeline.slice(0, -7), 7);
  if (prev7 > 0 && last7 < prev7 * 0.85) {
    actions.push({
      title: "Ship on your usual cadence this week",
      detail: `Your 7-day watch-hour rate dipped ~${Math.round((1 - last7 / prev7) * 100)}%. A consistent upload resets momentum.`,
      impact: 65,
      effort: 60,
      confidence: 72,
    });
  } else {
    actions.push({
      title: "Add end screens to your 5 top videos",
      detail: "Point each to its single most relevant next video to extend sessions — a fast, high-confidence win.",
      impact: 60,
      effort: 20,
      confidence: 85,
    });
  }

  return rankActions(actions).slice(0, 5);
}

/** Rank by a weighted score: impact heaviest, effort as a mild penalty. */
export function rankActions(actions: Action[]): Action[] {
  const score = (a: Action) => a.impact * 0.6 + a.confidence * 0.3 - a.effort * 0.2;
  return [...actions].sort((x, y) => score(y) - score(x));
}

/** Today's expanded action plan (up to 10 concrete items). */
export function dailyPlan(channel: ChannelSnapshot): string[] {
  const videos = channel.videos;
  if (!videos.length) return ["Add videos or enable Demo mode to generate a plan."];
  const traffic = highestTraffic(videos);
  const lowRet = lowestRetention(traffic.slice(0, 6))[0];
  const grower = byMomentum(videos)[0];
  const undervalued = mostUndervalued(videos);
  const plan = [
    "Publish or schedule 1 long-form video on a proven topic.",
    "Cut 2 Shorts from an existing high-retention long-form video.",
    lowRet ? `Improve the thumbnail + first 30s of "${clampTitle(lowRet.title)}".` : "Refresh a weak thumbnail.",
    grower ? `Outline a sequel to "${clampTitle(grower.title)}".` : "Plan a follow-up to a top topic.",
    undervalued ? `Add "${clampTitle(undervalued.title)}" to a relevant playlist.` : "Tidy your playlists.",
    "Add end screens/cards linking each new video to its best 'watch next'.",
    "Write 1 community post pointing to a proven video.",
    "Reply to comments on your latest upload within the first 2 hours.",
    "Review the biggest retention drop-off on your newest video.",
    "Share your best recent video in 1 relevant, non-spammy external community.",
  ];
  return plan;
}
