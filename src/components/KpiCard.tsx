"use client";

import clsx from "clsx";
import { AnimatedNumber } from "./ui";
import { TrendingUp, TrendingDown } from "lucide-react";

export function KpiCard({
  label,
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  delta,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delta?: number; // percent change
  icon?: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="card card-hover animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-ink-dim" />}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-ink">
        <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </div>
      <div className="mt-1 flex items-center gap-2">
        {delta !== undefined && (
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              up ? "text-accent-green" : "text-brand-soft"
            )}
          >
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-xs text-ink-dim">{hint}</span>}
      </div>
    </div>
  );
}
