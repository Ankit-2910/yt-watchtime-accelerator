"use client";

// Small shared presentational primitives.

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Count-up animated number. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    const duration = 800;
    let raf = 0;
    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      ref.current = current;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString("en", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const tones: Record<string, string> = {
    default: "border-line bg-bg-soft text-ink-soft",
    green: "border-accent-green/30 bg-accent-green/10 text-accent-green",
    amber: "border-accent-amber/30 bg-accent-amber/10 text-accent-amber",
    red: "border-brand/30 bg-brand/10 text-brand-soft",
    blue: "border-accent/30 bg-accent/10 text-accent",
    violet: "border-accent-violet/30 bg-accent-violet/10 text-accent-violet",
  };
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function Meter({ value, tone = "brand" }: { value: number; tone?: "brand" | "green" | "amber" }) {
  const colors = { brand: "bg-brand", green: "bg-accent-green", amber: "bg-accent-amber" };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-soft">
      <div
        className={clsx("h-full rounded-full transition-all duration-700", colors[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line py-16 text-center">
      <div className="text-sm font-medium text-ink-soft">{title}</div>
      {hint && <div className="mt-1 max-w-md text-xs text-ink-dim">{hint}</div>}
    </div>
  );
}
