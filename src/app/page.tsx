"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { KpiCard } from "@/components/KpiCard";
import { ProgressRing } from "@/components/ProgressRing";
import { TopActions } from "@/components/TopActions";
import { WatchTimeArea, SubscribersLine } from "@/components/Charts";
import { AnimatedNumber, Meter, PageHeader } from "@/components/ui";
import { topActions } from "@/lib/actions";
import {
  progress,
  trailingDailyRate,
  trailingWatchHours,
  projectedCompletion,
  channelScore,
} from "@/lib/watchtime";
import { comma, compact, dateLabel } from "@/lib/format";
import {
  Clock,
  Eye,
  Users,
  Repeat,
  MousePointerClick,
  Timer,
  Rocket,
  ArrowRight,
} from "lucide-react";

function delta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export default function CommandCenter() {
  const { channel, now, ready } = useStore();

  if (!ready || !channel) return <LoadingScreen />;

  const prog = progress(channel.currentWatchHours, channel.targetWatchHours);
  const dailyRate = trailingDailyRate(channel.timeline, 30);
  const projection = projectedCompletion(prog.remaining, dailyRate, now);
  const actions = topActions(channel);
  const score = channelScore(channel);

  // trailing deltas (last 7 vs previous 7)
  const wh7 = trailingWatchHours(channel.timeline, 7);
  const whPrev7 = trailingWatchHours(channel.timeline.slice(0, -7), 7);
  const views7 = channel.timeline.slice(-7).reduce((s, p) => s + p.views, 0);
  const viewsPrev7 = channel.timeline.slice(-14, -7).reduce((s, p) => s + p.views, 0);
  const subsNow = channel.timeline.at(-1)?.subscribers ?? channel.subscribers;
  const subs7ago = channel.timeline.at(-8)?.subscribers ?? subsNow;
  const subs14ago = channel.timeline.at(-15)?.subscribers ?? subs7ago;

  return (
    <div className="space-y-8">
      <PageHeader
        title={channel.title}
        subtitle={`${channel.handle} · Command Center — your legitimate path to 4,000 valid public watch hours.`}
        action={
          <Link href="/strategist" className="btn-primary">
            Ask NOVA <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* BEAST MODE: what should I do next */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card animate-fade-up">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Rocket className="h-5 w-5 text-brand" /> What should I do next?
            </h2>
            <span className="chip">Top 5 · ranked by impact</span>
          </div>
          <TopActions actions={actions} />
        </div>

        {/* 4,000 hour mission ring */}
        <div className="card flex flex-col items-center justify-center gap-4 animate-fade-up">
          <h2 className="section-title self-start">4,000-Hour Mission</h2>
          <ProgressRing
            percent={prog.percent}
            label={
              <div>
                <div className="text-3xl font-bold text-ink">
                  <AnimatedNumber value={prog.percent} decimals={2} suffix="%" />
                </div>
                <div className="mt-1 text-xs text-ink-dim">complete</div>
              </div>
            }
          />
          <div className="w-full space-y-2 text-center">
            <div className="text-lg font-semibold text-ink">
              <AnimatedNumber value={prog.current} /> / {comma(prog.target)} hrs
            </div>
            <div className="text-sm text-brand-soft">
              <AnimatedNumber value={prog.remaining} /> hours remaining
            </div>
            <p className="pt-1 text-xs text-ink-soft">
              At your current 30-day rate (~{dailyRate.toFixed(1)} h/day), estimated completion:{" "}
              <span className="font-semibold text-ink">
                {projection ? dateLabel(projection.date.toISOString()) : "—"}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* KPI grid */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Watch hours (7d)" value={wh7} decimals={0} suffix=" h" delta={delta(wh7, whPrev7)} icon={Clock} />
        <KpiCard label="Views (7d)" value={views7} delta={delta(views7, viewsPrev7)} icon={Eye} />
        <KpiCard label="Subscribers" value={subsNow} delta={delta(subsNow - subs7ago, subs7ago - subs14ago)} icon={Users} hint="net 7d" />
        <KpiCard label="Returning viewers" value={channel.returningViewerRate} suffix="%" icon={Repeat} hint="of total" />
        <KpiCard label="Avg view duration" value={channel.avgViewDuration} suffix="s" icon={Timer} />
        <KpiCard label="Avg retention" value={channel.avgRetention} suffix="%" icon={Activity2} />
        <KpiCard label="CTR" value={channel.ctr} decimals={1} suffix="%" icon={MousePointerClick} />
        <KpiCard label="Total views" value={channel.totalViews} icon={Eye} />
      </section>

      {/* charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="section-title">Valid watch hours · 90 days</h3>
            <span className="text-xs text-ink-dim">{compact(trailingWatchHours(channel.timeline, 90))} h total</span>
          </div>
          <WatchTimeArea data={channel.timeline} />
        </div>
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="section-title">Subscribers · 90 days</h3>
            <span className="text-xs text-ink-dim">{comma(subsNow)} total</span>
          </div>
          <SubscribersLine data={channel.timeline} />
        </div>
      </section>

      {/* channel score */}
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Channel Health Score</h3>
          <div className="text-3xl font-bold text-ink">
            <AnimatedNumber value={score.overall} />
            <span className="text-base font-normal text-ink-dim"> / 100</span>
          </div>
        </div>
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {score.components.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-ink-soft">{c.label}</span>
              <Meter value={c.score} tone={c.score >= 70 ? "green" : c.score >= 45 ? "amber" : "brand"} />
              <span className="w-8 text-right text-sm font-medium text-ink">{c.score}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Activity2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
    </div>
  );
}
