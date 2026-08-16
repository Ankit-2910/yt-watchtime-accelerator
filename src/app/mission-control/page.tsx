"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, AnimatedNumber, Meter } from "@/components/ui";
import {
  progress,
  trailingDailyRate,
  buildScenarios,
  requiredRate,
  totalWatchHours,
  totalWatchMinutes,
  round,
} from "@/lib/watchtime";
import { comma, dateLabel } from "@/lib/format";
import { Calculator, Gauge, CalendarClock, TrendingUp } from "lucide-react";

export default function MissionControl() {
  const { channel, now, ready } = useStore();
  if (!ready || !channel) return null;

  const prog = progress(channel.currentWatchHours, channel.targetWatchHours);
  const rate7 = trailingDailyRate(channel.timeline, 7);
  const rate30 = trailingDailyRate(channel.timeline, 30);
  const rate90 = trailingDailyRate(channel.timeline, 90);
  const growth = rate90 > 0 ? ((rate7 - rate90) / rate90) * 100 : 0;
  const scenarios = buildScenarios(prog.remaining, rate30, now);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mission Control"
        subtitle="Your roadmap to 4,000 valid public watch hours — projected from your own trailing performance."
      />

      {/* summary strip */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <SummaryStat label="Current" value={<AnimatedNumber value={prog.current} suffix=" h" />} />
        <SummaryStat label="Target" value={`${comma(prog.target)} h`} />
        <SummaryStat label="Remaining" value={<AnimatedNumber value={prog.remaining} suffix=" h" />} accent />
        <SummaryStat label="7-day avg" value={`${rate7.toFixed(1)} h/d`} />
        <SummaryStat label="30-day avg" value={`${rate30.toFixed(1)} h/d`} />
        <SummaryStat
          label="Growth rate"
          value={`${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
          tone={growth >= 0 ? "green" : "red"}
        />
      </section>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2">
            <Gauge className="h-5 w-5 text-brand" /> Progress
          </h2>
          <span className="text-sm text-ink-soft">
            {prog.percent.toFixed(2)}% · {comma(prog.current)} / {comma(prog.target)} h
          </span>
        </div>
        <Meter value={prog.percent} />
      </section>

      {/* scenarios */}
      <section>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-accent" /> Completion scenarios
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {scenarios.map((s) => {
            const tone =
              s.name === "Aggressive" ? "green" : s.name === "Realistic" ? "amber" : "default";
            return (
              <div
                key={s.name}
                className="card card-hover flex flex-col gap-3 animate-fade-up"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">{s.name}</h3>
                  <span
                    className={`chip ${
                      tone === "green"
                        ? "!border-accent-green/30 !text-accent-green"
                        : tone === "amber"
                        ? "!border-accent-amber/30 !text-accent-amber"
                        : ""
                    }`}
                  >
                    {s.hoursPerDay} h/day
                  </span>
                </div>
                <div>
                  <div className="stat-label">Projected completion</div>
                  <div className="mt-1 text-xl font-bold text-ink">
                    {Number.isFinite(s.daysRemaining) ? dateLabel(s.completionDate) : "—"}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-dim">
                    {Number.isFinite(s.daysRemaining)
                      ? `~${comma(s.daysRemaining)} days`
                      : "increase your rate to project"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-ink-dim">
          Scenarios scale off your realistic (30-day) rate: conservative = ½×, aggressive = 2×. These
          are analytical projections of <span className="text-ink-soft">legitimate</span> growth, not guarantees.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DeadlinePlanner remaining={prog.remaining} />
        <WatchTimeCalculator />
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  tone?: "green" | "red";
}) {
  return (
    <div className="card !p-4">
      <div className="stat-label">{label}</div>
      <div
        className={`mt-1 text-lg font-bold ${
          tone === "green"
            ? "text-accent-green"
            : tone === "red"
            ? "text-brand-soft"
            : accent
            ? "text-brand-soft"
            : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DeadlinePlanner({ remaining }: { remaining: number }) {
  const [days, setDays] = useState(120);
  const req = requiredRate(remaining, days);
  return (
    <div className="card">
      <h3 className="section-title mb-1 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-accent-green" /> Deadline planner
      </h3>
      <p className="mb-4 text-sm text-ink-soft">
        Pick a deadline to see the daily/weekly watch-hour rate you&apos;d need.
      </p>
      <label className="stat-label">Reach target in (days)</label>
      <input
        type="range"
        min={14}
        max={365}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        className="mt-2 w-full accent-brand"
      />
      <div className="mt-1 text-sm text-ink">{days} days</div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-line bg-bg-soft p-4">
          <div className="stat-label">Required / day</div>
          <div className="mt-1 text-2xl font-bold text-ink">{req.daily} h</div>
        </div>
        <div className="rounded-xl border border-line bg-bg-soft p-4">
          <div className="stat-label">Required / week</div>
          <div className="mt-1 text-2xl font-bold text-ink">{req.weekly} h</div>
        </div>
      </div>
    </div>
  );
}

function WatchTimeCalculator() {
  const [views, setViews] = useState(100000);
  const [avgMin, setAvgMin] = useState(4.5);

  const result = useMemo(() => {
    const minutes = totalWatchMinutes(views, avgMin);
    const hours = totalWatchHours(views, avgMin);
    return {
      minutes,
      hours,
      perDay: round(hours / 30, 1),
      perWeek: round((hours / 30) * 7, 1),
    };
  }, [views, avgMin]);

  return (
    <div className="card">
      <h3 className="section-title mb-1 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-accent-violet" /> Watch-time calculator
      </h3>
      <p className="mb-4 text-sm text-ink-soft">
        Analytical estimate: watch hours = views × average view duration.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="stat-label">Views</label>
          <input
            type="number"
            className="input mt-1.5"
            value={views}
            min={0}
            onChange={(e) => setViews(Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div>
          <label className="stat-label">Avg view duration (min)</label>
          <input
            type="number"
            className="input mt-1.5"
            value={avgMin}
            min={0}
            step={0.1}
            onChange={(e) => setAvgMin(Math.max(0, Number(e.target.value)))}
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <Result label="Total minutes" value={comma(result.minutes)} />
        <Result label="Total hours" value={comma(result.hours)} highlight />
        <Result label="~ Hours / day (÷30)" value={`${result.perDay}`} />
        <Result label="~ Hours / week" value={`${result.perWeek}`} />
      </div>
      <p className="mt-3 text-[11px] text-ink-dim">
        Estimate only — real watch time depends on retention, not just view counts.
      </p>
    </div>
  );
}

function Result({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-brand/30 bg-brand/5" : "border-line bg-bg-soft"}`}>
      <div className="stat-label">{label}</div>
      <div className={`mt-1 text-xl font-bold ${highlight ? "text-brand-soft" : "text-ink"}`}>{value}</div>
    </div>
  );
}
