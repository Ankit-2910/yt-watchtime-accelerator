"use client";

import { useMemo, useState } from "react";
import { PageHeader, Badge, Meter } from "@/components/ui";
import { generateTitles, type ScoredTitle } from "@/lib/ideas";
import { Type, Copy, Check, ShieldAlert } from "lucide-react";

const CATEGORIES: { key: ScoredTitle["category"] | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "curiosity", label: "Curiosity" },
  { key: "seo", label: "SEO" },
  { key: "emotional", label: "Emotional" },
  { key: "documentary", label: "Documentary" },
  { key: "shorts", label: "Shorts" },
];

export default function TitleLab() {
  const [topic, setTopic] = useState("The Roman Empire");
  const [filter, setFilter] = useState<ScoredTitle["category"] | "all">("all");
  const [copied, setCopied] = useState<string | null>(null);

  const titles = useMemo(() => generateTitles(topic), [topic]);
  const shown = filter === "all" ? titles : titles.filter((t) => t.category === filter);

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1200);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Title Lab"
        subtitle="High-curiosity, SEO and emotional titles — scored for CTR, clarity and misleading risk. We never generate deceptive titles."
      />

      <div className="card">
        <label className="stat-label">Topic</label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            className="input max-w-md"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic…"
          />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`chip ${filter === c.key ? "!border-brand/40 !bg-brand/10 !text-brand-soft" : ""}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((t) => (
          <div key={t.text} className="card card-hover flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Type className="mt-0.5 h-4 w-4 shrink-0 text-accent-violet" />
                <span className="text-sm font-semibold text-ink">{t.text}</span>
              </div>
              <button
                onClick={() => copy(t.text)}
                className="shrink-0 rounded p-1 text-ink-dim hover:bg-bg-hover hover:text-ink"
                title="Copy"
              >
                {copied === t.text ? <Check className="h-4 w-4 text-accent-green" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="violet">{t.category}</Badge>
              {t.misleadingRisk > 30 && (
                <Badge tone="amber">
                  <ShieldAlert className="h-3 w-3" /> higher hype
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              <ScoreRow label="CTR potential" value={t.ctr} tone="brand" />
              <ScoreRow label="Search / SEO" value={t.seo} tone="green" />
              <ScoreRow label="Curiosity" value={t.curiosity} tone="brand" />
              <ScoreRow label="Clarity" value={t.clarity} tone="green" />
              <ScoreRow label="Misleading risk" value={t.misleadingRisk} tone="amber" invert />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  tone,
  invert,
}: {
  label: string;
  value: number;
  tone: "brand" | "green" | "amber";
  invert?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-[11px] text-ink-dim">{label}</span>
      <Meter value={value} tone={tone} />
      <span className={`w-7 text-right text-[11px] ${invert && value > 30 ? "text-accent-amber" : "text-ink-soft"}`}>
        {value}
      </span>
    </div>
  );
}
