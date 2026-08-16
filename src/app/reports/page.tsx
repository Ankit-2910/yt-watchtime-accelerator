"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Badge } from "@/components/ui";
import { comma } from "@/lib/format";
import { topActions, highestTraffic, mostUndervalued } from "@/lib/actions";
import type { ChannelSnapshot } from "@/lib/types";
import { FileText, TrendingUp, TrendingDown } from "lucide-react";

type Range = 7 | 30 | 90;
const RANGES: { key: Range; label: string }[] = [
  { key: 7, label: "Daily (7d)" },
  { key: 30, label: "Weekly (30d)" },
  { key: 90, label: "Monthly (90d)" },
];

function windowSum(channel: ChannelSnapshot, days: number, key: "watchHours" | "views") {
  return channel.timeline.slice(-days).reduce((s, p) => s + p[key], 0);
}

function delta(cur: number, prev: number): number {
  if (prev === 0) return 0;
  return ((cur - prev) / prev) * 100;
}

export default function Reports() {
  const { channel, ready } = useStore();
  const [range, setRange] = useState<Range>(30);
  if (!ready || !channel) return null;

  const wh = windowSum(channel, range, "watchHours");
  const whPrev = channel.timeline.slice(-range * 2, -range).reduce((s, p) => s + p.watchHours, 0);
  const views = windowSum(channel, range, "views");
  const viewsPrev = channel.timeline.slice(-range * 2, -range).reduce((s, p) => s + p.views, 0);
  const subsNow = channel.timeline.at(-1)?.subscribers ?? 0;
  const subsStart = channel.timeline.at(-range)?.subscribers ?? subsNow;
  const subsPrev = channel.timeline.at(-range * 2)?.subscribers ?? subsStart;
  const subGain = subsNow - subsStart;
  const subGainPrev = subsStart - subsPrev;

  const topVideo = highestTraffic(channel.videos)[0];
  const opportunity = mostUndervalued(channel.videos);
  const nextAction = topActions(channel)[0];

  const metrics = [
    { label: "Watch hours", value: `${comma(wh)} h`, delta: delta(wh, whPrev) },
    { label: "Views", value: comma(views), delta: delta(views, viewsPrev) },
    { label: "Subscribers", value: `+${comma(subGain)}`, delta: delta(subGain, subGainPrev) },
    { label: "Avg retention", value: `${channel.avgRetention}%`, delta: 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Performance summaries with the single most important next action."
        action={
          <div className="flex rounded-lg border border-line bg-bg-soft p-0.5 text-sm">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-md px-3 py-1.5 ${range === r.key ? "bg-brand text-white" : "text-ink-soft hover:text-ink"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => {
          const up = m.delta >= 0;
          return (
            <div key={m.label} className="card">
              <div className="stat-label">{m.label}</div>
              <div className="mt-1 text-2xl font-bold text-ink">{m.value}</div>
              {m.delta !== 0 && (
                <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${up ? "text-accent-green" : "text-brand-soft"}`}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {up ? "+" : ""}
                  {m.delta.toFixed(1)}% vs prior period
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <Badge tone="green">Top video</Badge>
          <h3 className="mt-2 text-sm font-semibold text-ink">{topVideo?.title}</h3>
          <p className="mt-1 text-xs text-ink-dim">
            {comma(topVideo?.stats.views ?? 0)} views · {comma(topVideo?.stats.watchHours ?? 0)} watch hours
          </p>
        </div>
        <div className="card">
          <Badge tone="amber">Biggest opportunity</Badge>
          <h3 className="mt-2 text-sm font-semibold text-ink">{opportunity?.title}</h3>
          <p className="mt-1 text-xs text-ink-dim">
            {opportunity?.stats.avgPercentageViewed}% retention but under-exposed — promote it or cut a Short.
          </p>
        </div>
        <div className="card">
          <Badge tone="red">Next action</Badge>
          <h3 className="mt-2 text-sm font-semibold text-ink">{nextAction?.title}</h3>
          <p className="mt-1 text-xs text-ink-dim">{nextAction?.detail}</p>
        </div>
      </section>

      <section className="card">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand" />
          <h2 className="section-title">Summary</h2>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">
          Over the last {range} days you added <span className="font-semibold text-ink">{comma(wh)}</span> valid public
          watch hours ({delta(wh, whPrev) >= 0 ? "up" : "down"} {Math.abs(delta(wh, whPrev)).toFixed(1)}% vs the prior
          period) from <span className="font-semibold text-ink">{comma(views)}</span> views and gained{" "}
          <span className="font-semibold text-ink">{comma(subGain)}</span> subscribers. Your strongest lever right now:{" "}
          <span className="font-semibold text-ink">{nextAction?.title.toLowerCase()}</span>.
        </p>
      </section>
    </div>
  );
}
