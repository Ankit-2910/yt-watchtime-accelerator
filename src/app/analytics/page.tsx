"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Badge } from "@/components/ui";
import { ComparisonBar } from "@/components/Charts";
import { comma, durationLabel, pct } from "@/lib/format";
import { byMomentum, highestTraffic, lowestRetention, mostUndervalued } from "@/lib/actions";
import type { Video } from "@/lib/types";
import { Award, Flame, Gauge, MousePointerClick, Clock, Users, Diamond } from "lucide-react";

type Metric = keyof Pick<
  Video["stats"],
  "views" | "watchHours" | "ctr" | "avgPercentageViewed" | "subscribersGained"
>;

const METRICS: { key: Metric; label: string }[] = [
  { key: "views", label: "Views" },
  { key: "watchHours", label: "Watch hours" },
  { key: "ctr", label: "CTR %" },
  { key: "avgPercentageViewed", label: "Avg % viewed" },
  { key: "subscribersGained", label: "Subs gained" },
];

export default function Analytics() {
  const { channel, ready } = useStore();
  const [metric, setMetric] = useState<Metric>("watchHours");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!ready || !channel) return null;

  const videos = channel.videos;
  const ranked = [...videos].sort((a, b) => (b.stats[metric] as number) - (a.stats[metric] as number));
  const selectedVideos = videos.filter((v) => selected.has(v.id));
  const chartSource = selectedVideos.length >= 2 ? selectedVideos : ranked.slice(0, 8);
  const chartData = chartSource.map((v) => ({
    name: v.title.length > 22 ? v.title.slice(0, 21) + "…" : v.title,
    value: Math.round(v.stats[metric] as number),
  }));

  const fastest = byMomentum(videos)[0];
  const highestRet = lowestRetention(videos).at(-1);
  const highestCtr = [...videos].sort((a, b) => b.stats.ctr - a.stats.ctr)[0];
  const mostWatch = [...videos].sort((a, b) => b.stats.watchHours - a.stats.watchHours)[0];
  const mostSubs = [...videos].sort((a, b) => b.stats.subscribersGained - a.stats.subscribersGained)[0];
  const undervalued = mostUndervalued(videos);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics & Comparison"
        subtitle="Rank and compare videos to find what earns real watch time — then do more of it."
      />

      {/* superlatives */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Superlative icon={Flame} tone="red" label="Fastest growing" v={fastest} sub={`${comma(Math.round(fastest.stats.views / Math.max(fastest.ageDays, 1)))} views/day`} />
        <Superlative icon={Gauge} tone="green" label="Highest retention" v={highestRet} sub={`${highestRet?.stats.avgPercentageViewed}% avg viewed`} />
        <Superlative icon={MousePointerClick} tone="blue" label="Highest CTR" v={highestCtr} sub={pct(highestCtr.stats.ctr)} />
        <Superlative icon={Clock} tone="amber" label="Most watch hours" v={mostWatch} sub={`${comma(mostWatch.stats.watchHours)} h`} />
        <Superlative icon={Users} tone="violet" label="Most subs generated" v={mostSubs} sub={`+${comma(mostSubs.stats.subscribersGained)}`} />
        <Superlative icon={Diamond} tone="default" label="Most undervalued" v={undervalued} sub="high retention, low reach" />
      </section>

      {/* comparison chart */}
      <section className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">
            {selectedVideos.length >= 2 ? `Comparing ${selectedVideos.length} selected` : "Top videos"} by{" "}
            {METRICS.find((m) => m.key === metric)?.label}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`chip ${metric === m.key ? "!border-brand/40 !bg-brand/10 !text-brand-soft" : ""}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <ComparisonBar data={chartData} />
        <p className="mt-2 text-xs text-ink-dim">
          Tick videos in the table to compare a custom set; otherwise the top 8 are shown.
        </p>
      </section>

      {/* ranking table */}
      <section className="card overflow-hidden !p-0">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <Award className="h-4 w-4 text-brand" />
          <h2 className="section-title">Best performers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-dim">
                <th className="px-4 py-2.5 font-medium"></th>
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Video</th>
                <th className="px-4 py-2.5 text-right font-medium">Views</th>
                <th className="px-4 py-2.5 text-right font-medium">Watch h</th>
                <th className="px-4 py-2.5 text-right font-medium">CTR</th>
                <th className="px-4 py-2.5 text-right font-medium">Avg %</th>
                <th className="px-4 py-2.5 text-right font-medium">Length</th>
                <th className="px-4 py-2.5 text-right font-medium">Subs</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((v, i) => (
                <tr
                  key={v.id}
                  className={`border-b border-line/60 transition-colors hover:bg-bg-hover ${
                    selected.has(v.id) ? "bg-brand/5" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(v.id)}
                      onChange={() => toggle(v.id)}
                      className="h-4 w-4 accent-brand"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-ink-dim">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1 max-w-xs text-ink" title={v.title}>
                        {v.title}
                      </span>
                      <Badge tone={v.format === "short" ? "violet" : "default"}>{v.format}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-ink-soft">{comma(v.stats.views)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-soft">{comma(v.stats.watchHours)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-soft">{pct(v.stats.ctr)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-soft">{v.stats.avgPercentageViewed}%</td>
                  <td className="px-4 py-2.5 text-right text-ink-soft">{durationLabel(v.durationSec)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-soft">+{comma(v.stats.subscribersGained)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Superlative({
  icon: Icon,
  tone,
  label,
  v,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "red" | "green" | "blue" | "amber" | "violet" | "default";
  label: string;
  v?: Video | null;
  sub?: string;
}) {
  return (
    <div className="card card-hover animate-fade-up">
      <div className="flex items-center gap-2">
        <Badge tone={tone}>
          <Icon className="h-3.5 w-3.5" /> {label}
        </Badge>
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-semibold text-ink" title={v?.title}>
        {v?.title ?? "—"}
      </div>
      {sub && <div className="mt-1 text-xs text-ink-dim">{sub}</div>}
    </div>
  );
}
