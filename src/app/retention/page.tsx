"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Badge, Meter } from "@/components/ui";
import { RetentionCurveChart, RetentionCurveDense } from "@/components/Charts";
import type { RealRetentionPoint, Video } from "@/lib/types";
import { Activity, AlertTriangle, Sparkles, Wifi } from "lucide-react";

/** Improvement plan from the modeled bucket curve (demo / no analytics). */
function modeledPlan(v: Video): string[] {
  const c = v.retentionCurve;
  const plan: string[] = [];
  let worstIdx = 0;
  let worstDrop = 0;
  for (let i = 1; i < c.length; i++) {
    const drop = c[i - 1].retention - c[i].retention;
    if (drop > worstDrop) {
      worstDrop = drop;
      worstIdx = i;
    }
  }
  const firstDrop = c[0].retention - (c[1]?.retention ?? c[0].retention);
  if (firstDrop > 25) {
    plan.push(`Steep ${firstDrop}% drop in the first seconds — your hook isn't landing. Open on the payoff, cut any intro/logo.`);
  }
  if (worstDrop > 12) {
    plan.push(
      `Biggest fall-off is entering "${c[worstIdx].label}" (−${worstDrop}%). Rewrite the 10 seconds before it — that's where you lose people.`
    );
  }
  if (v.stats.avgPercentageViewed < 35) {
    plan.push("Overall average % viewed is low. Tighten pacing: add a visual/pattern interrupt every 20-30 seconds.");
  }
  const strongest = [...c].sort((a, b) => b.retention - a.retention)[0];
  plan.push(`Strongest moment is "${strongest.label}" (${strongest.retention}%). Lead with a taste of it earlier.`);
  if (c.at(-1) && c.at(-1)!.retention > 30) {
    plan.push("Good end retention — add a strong end screen to the single most relevant next video.");
  }
  return plan;
}

/** Improvement plan from the REAL per-percent audience-retention curve. */
function livePlan(points: RealRetentionPoint[], relative: number | null): string[] {
  const plan: string[] = [];
  if (points.length < 3) return plan;

  // biggest drop between consecutive points
  let worst = { at: 0, drop: 0 };
  for (let i = 1; i < points.length; i++) {
    const drop = points[i - 1].watchRatio - points[i].watchRatio;
    if (drop > worst.drop) worst = { at: points[i].ratio, drop: Math.round(drop) };
  }
  // intro retention: audience remaining by ~10% of the video
  const early = points.find((p) => p.ratio >= 10) ?? points[1];
  const introLoss = Math.round(points[0].watchRatio - early.watchRatio);
  if (introLoss > 20) {
    plan.push(`You lose ~${introLoss}% of viewers in the first 10% of the video. Cut the intro and open on the payoff.`);
  }
  if (worst.drop > 6) {
    plan.push(`Sharpest drop is around ${worst.at}% of the video (−${worst.drop}%). Rewatch that moment and tighten the 10s before it.`);
  }
  // rewatch spikes (audienceWatchRatio rising = replays)
  const spike = points.find((p, i) => i > 0 && p.watchRatio - points[i - 1].watchRatio > 4);
  if (spike) {
    plan.push(`Viewers rewatch around ${spike.ratio}% — that segment resonates. Consider leading with a version of it.`);
  }
  const ending = points.at(-1)!;
  plan.push(
    ending.watchRatio > 35
      ? `Strong ending (${Math.round(ending.watchRatio)}% still watching) — add an end screen to your best 'watch next'.`
      : `Only ${Math.round(ending.watchRatio)}% reach the end — tighten the final third and end on a hook, not an outro.`
  );
  if (relative != null) {
    plan.push(
      relative >= 0.5
        ? `This video holds attention better than ~${Math.round(relative * 100)}% of similar-length videos — make more like it.`
        : `It underperforms similar-length videos on retention (${Math.round(relative * 100)}th percentile). The pacing is the fix.`
    );
  }
  return plan;
}

interface LiveState {
  status: "idle" | "loading" | "live" | "modeled";
  points: RealRetentionPoint[];
  relative: number | null;
}

export default function Retention() {
  const { channel, ready, connected } = useStore();
  const [id, setId] = useState<string | null>(null);
  const [live, setLive] = useState<LiveState>({ status: "idle", points: [], relative: null });

  const videos = channel?.videos.filter((v) => v.format === "long") ?? [];
  const active = videos.find((v) => v.id === id) ?? videos[0];

  useEffect(() => {
    let cancelled = false;
    if (!active || !connected) {
      setLive({ status: "modeled", points: [], relative: null });
      return;
    }
    setLive((s) => ({ ...s, status: "loading" }));
    (async () => {
      try {
        const res = await fetch(`/api/youtube/retention?videoId=${encodeURIComponent(active.ytVideoId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(data.points) && data.points.length >= 3) {
          setLive({ status: "live", points: data.points, relative: data.relative ?? null });
        } else {
          setLive({ status: "modeled", points: [], relative: null });
        }
      } catch {
        if (!cancelled) setLive({ status: "modeled", points: [], relative: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, connected]);

  if (!ready || !channel) return null;

  const isLive = live.status === "live";
  const plan = active
    ? isLive
      ? livePlan(live.points, live.relative)
      : modeledPlan(active)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retention Intelligence"
        subtitle="Retention is the single biggest lever on legitimate watch hours. Find where viewers leave and fix it."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* video list */}
        <div className="card !p-2">
          <div className="max-h-[70vh] space-y-1 overflow-y-auto">
            {videos.map((v) => {
              const activeItem = active?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setId(v.id)}
                  className={`flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors ${
                    activeItem ? "bg-brand/10" : "hover:bg-bg-hover"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumbnailUrl} alt="" className="h-10 w-16 shrink-0 rounded object-cover" loading="lazy" />
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-xs font-medium text-ink">{v.title}</div>
                    <div className="text-[11px] text-ink-dim">{v.stats.avgPercentageViewed}% avg viewed</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* detail */}
        {active && (
          <div className="space-y-6">
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-title flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent-green" /> Audience retention curve
                </h2>
                <div className="flex items-center gap-2">
                  {isLive ? (
                    <Badge tone="green">
                      <Wifi className="h-3.5 w-3.5" /> Live per-second retention
                    </Badge>
                  ) : (
                    <Badge tone="default">
                      {connected ? "Modeled (no data yet)" : "Modeled from avg % viewed"}
                    </Badge>
                  )}
                  <Badge tone={active.stats.avgPercentageViewed >= 40 ? "green" : "amber"}>
                    {active.stats.avgPercentageViewed}% avg viewed
                  </Badge>
                </div>
              </div>

              {live.status === "loading" ? (
                <div className="grid h-[220px] place-items-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
                </div>
              ) : isLive ? (
                <>
                  <RetentionCurveDense points={live.points} />
                  {live.relative != null && (
                    <p className="mt-2 text-xs text-ink-dim">
                      Relative retention performance: {Math.round(live.relative * 100)}th percentile vs similar-length videos.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <RetentionCurveChart curve={active.retentionCurve} />
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {active.retentionCurve.map((b) => (
                      <div key={b.label} className="rounded-lg border border-line bg-bg-soft p-2 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-ink-dim">{b.label}</div>
                        <div className="mt-0.5 text-sm font-semibold text-ink">{b.retention}%</div>
                        <div className="mt-1">
                          <Meter value={b.retention} tone={b.retention >= 50 ? "green" : b.retention >= 25 ? "amber" : "brand"} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <h2 className="section-title mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand" /> Retention improvement plan
              </h2>
              <ul className="space-y-2.5">
                {plan.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
