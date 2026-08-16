"use client";

import { useStore } from "@/lib/store";
import { FlaskConical, ShieldCheck } from "lucide-react";

export function DemoBadge() {
  const { isDemo } = useStore();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg-soft/60 px-6 py-2.5 backdrop-blur">
      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <ShieldCheck className="h-4 w-4 text-accent-green" />
        <span>Legitimate-growth mode — no bots, no fake engagement, ever.</span>
      </div>
      {isDemo && (
        <div className="flex items-center gap-2 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-3 py-1 text-xs font-medium text-accent-amber">
          <FlaskConical className="h-3.5 w-3.5" />
          SIMULATED DATA — NOT YOUTUBE TRAFFIC
        </div>
      )}
    </div>
  );
}
