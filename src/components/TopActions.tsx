"use client";

import type { Action } from "@/lib/types";
import { Badge } from "./ui";
import { Zap } from "lucide-react";

function MiniBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-soft">
        <div className={tone} style={{ width: `${value}%` }} />
      </div>
      <span className="w-7 text-right text-[10px] text-ink-soft">{value}</span>
    </div>
  );
}

export function TopActions({ actions }: { actions: Action[] }) {
  if (!actions.length) {
    return <p className="text-sm text-ink-dim">No actions yet — load a channel or enable Demo mode.</p>;
  }
  return (
    <ol className="space-y-3">
      {actions.map((a, i) => (
        <li
          key={a.title}
          className="group rounded-xl border border-line bg-bg-soft/50 p-4 transition-colors hover:border-brand/30 hover:bg-bg-hover"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand/15 text-sm font-bold text-brand-soft">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
                <Badge tone={a.impact >= 80 ? "red" : a.impact >= 65 ? "amber" : "blue"}>
                  <Zap className="h-3 w-3" /> {a.impact} impact
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{a.detail}</p>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
                <MiniBar label="Impact" value={a.impact} tone="h-full bg-brand" />
                <MiniBar label="Effort" value={a.effort} tone="h-full bg-accent-amber" />
                <MiniBar label="Confidence" value={a.confidence} tone="h-full bg-accent-green" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
