"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Badge } from "@/components/ui";
import {
  generatePromotion,
  PROMO_PLATFORMS,
  type PromoPlatform,
} from "@/lib/promotion";
import { Megaphone, Copy, Check, ShieldCheck, Info } from "lucide-react";

export default function Promotion() {
  const { channel, ready } = useStore();
  const [videoId, setVideoId] = useState<string | null>(null);
  const [hook, setHook] = useState("");
  const [selected, setSelected] = useState<Set<PromoPlatform>>(new Set(PROMO_PLATFORMS));
  const [copied, setCopied] = useState<string | null>(null);

  const video = useMemo(() => {
    if (!channel) return null;
    return channel.videos.find((v) => v.id === videoId) ?? channel.videos[0] ?? null;
  }, [channel, videoId]);

  const results = useMemo(() => {
    if (!video) return [];
    return generatePromotion(
      {
        title: video.title,
        url: video.url,
        topic: video.title.split(/[:—-]/)[0].trim(),
        hook: hook.trim() || undefined,
        channelTitle: video.channelTitle,
      },
      PROMO_PLATFORMS.filter((p) => selected.has(p))
    );
  }, [video, hook, selected]);

  if (!ready || !channel) return null;

  function toggle(p: PromoPlatform) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function copy(key: string, text: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="External Promotion"
        subtitle="Legitimate, platform-specific distribution copy to drive real viewers from your other audiences. No spam, no mass-comments, no fake accounts."
      />

      <div className="flex items-center gap-2 rounded-lg border border-accent-green/20 bg-accent-green/5 px-3 py-2 text-xs text-accent-green">
        <ShieldCheck className="h-4 w-4" /> Share with people who genuinely want it. Every card includes a
        platform-specific do-it-right note.
      </div>

      <div className="card grid gap-4 md:grid-cols-2">
        <div>
          <label className="stat-label">Video to promote</label>
          <select
            className="input mt-1.5"
            value={video?.id ?? ""}
            onChange={(e) => setVideoId(e.target.value)}
          >
            {channel.videos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="stat-label">Custom hook (optional)</label>
          <input
            className="input mt-1.5"
            placeholder="One-line hook to lead with…"
            value={hook}
            onChange={(e) => setHook(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="stat-label">Platforms</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PROMO_PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => toggle(p)}
                className={`chip ${selected.has(p) ? "!border-brand/40 !bg-brand/10 !text-brand-soft" : ""}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((r) => {
          const key = `${video?.id}-${r.platform}`;
          return (
            <div key={r.platform} className="card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-ink">
                  <Megaphone className="h-4 w-4 text-brand" /> {r.platform}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge tone={r.charCount > 280 ? "amber" : "default"}>{r.charCount} chars</Badge>
                  <button
                    onClick={() => copy(key, r.copy)}
                    className="rounded p-1 text-ink-dim hover:bg-bg-hover hover:text-ink"
                    title="Copy"
                  >
                    {copied === key ? <Check className="h-4 w-4 text-accent-green" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-line bg-bg-soft/60 p-3 font-sans text-xs leading-relaxed text-ink-soft">
                {r.copy}
              </pre>
              <div className="flex items-start gap-2 text-[11px] text-ink-dim">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                {r.note}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
