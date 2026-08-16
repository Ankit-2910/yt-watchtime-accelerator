"use client";

import { useState } from "react";
import {
  Download,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  AlertTriangle,
} from "lucide-react";
import type { ResolvedVideo } from "@/lib/youtube";
import { durationLabel, comma, dateLabel } from "@/lib/format";

export interface PanelState {
  id: string;
  url: string;
  meta: ResolvedVideo | null;
  status: "empty" | "loading" | "loaded" | "error";
  error?: string;
  notes: string;
  playlist: string;
  maximized: boolean;
}

export function VideoPanel({
  index,
  panel,
  onUpdate,
  onRemove,
}: {
  index: number;
  panel: PanelState;
  onUpdate: (patch: Partial<PanelState>) => void;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function load(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;
    onUpdate({ status: "loading", error: undefined, url: trimmed });
    try {
      const res = await fetch("/api/youtube/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.video) {
        onUpdate({ status: "error", error: data.error ?? "Could not resolve this video." });
        return;
      }
      onUpdate({ status: "loaded", meta: data.video, error: undefined });
    } catch {
      // Error isolation: this panel fails alone; the lab keeps working.
      onUpdate({ status: "error", error: "Network error. Retry this panel." });
    }
  }

  function copyUrl() {
    if (!panel.url) return;
    navigator.clipboard?.writeText(panel.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  const m = panel.meta;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-bg-card transition-colors hover:border-ink-dim/30">
      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="text-[11px] font-semibold text-ink-dim">
          Panel {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-0.5 text-ink-dim">
          {panel.status === "loaded" && (
            <>
              <IconBtn title="Refresh metadata" onClick={() => load(panel.url)}>
                <RefreshCw className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="Copy URL" onClick={copyUrl}>
                {copied ? <Check className="h-3.5 w-3.5 text-accent-green" /> : <Copy className="h-3.5 w-3.5" />}
              </IconBtn>
              <a
                href={panel.url}
                target="_blank"
                rel="noreferrer"
                title="Open on YouTube"
                className="grid h-6 w-6 place-items-center rounded hover:bg-bg-hover hover:text-ink"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <IconBtn
                title={panel.maximized ? "Minimize" : "Maximize"}
                onClick={() => onUpdate({ maximized: !panel.maximized })}
              >
                {panel.maximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </IconBtn>
            </>
          )}
          <IconBtn title="Remove" onClick={onRemove}>
            <X className="h-3.5 w-3.5 hover:text-brand" />
          </IconBtn>
        </div>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-2.5">
        {panel.status === "empty" && (
          <PanelInput onLoad={load} />
        )}

        {panel.status === "loading" && (
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
          </div>
        )}

        {panel.status === "error" && (
          <div className="flex flex-1 flex-col gap-2 py-4">
            <div className="flex items-center gap-2 text-xs text-brand-soft">
              <AlertTriangle className="h-4 w-4" /> {panel.error}
            </div>
            <PanelInput onLoad={load} defaultValue={panel.url} label="Retry" />
          </div>
        )}

        {panel.status === "loaded" && m && (
          <div className="space-y-2">
            <a href={panel.url} target="_blank" rel="noreferrer" className="block">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.thumbnailUrl}
                  alt={m.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {m.durationSec ? (
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {durationLabel(m.durationSec)}
                  </span>
                ) : null}
              </div>
            </a>
            <div>
              <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-ink" title={m.title}>
                {m.title}
              </h3>
              <p className="mt-0.5 truncate text-[11px] text-ink-soft">{m.channelTitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-ink-dim">
              {m.views != null && <Stat label="Views" value={comma(m.views)} />}
              {m.likes != null && <Stat label="Likes" value={comma(m.likes)} />}
              {m.comments != null && <Stat label="Comments" value={comma(m.comments)} />}
              {m.publishedAt && <Stat label="Published" value={dateLabel(m.publishedAt)} />}
              <Stat label="Video ID" value={m.videoId} />
              <Stat label="Source" value={m.source} />
            </div>

            {panel.maximized && (
              <div className="space-y-2 pt-1">
                <input
                  className="input !py-1 text-[11px]"
                  placeholder="Playlist / group…"
                  value={panel.playlist}
                  onChange={(e) => onUpdate({ playlist: e.target.value })}
                />
                <textarea
                  className="input !py-1 text-[11px]"
                  placeholder="Notes (QA / research observations)…"
                  rows={3}
                  value={panel.notes}
                  onChange={(e) => onUpdate({ notes: e.target.value })}
                />
              </div>
            )}

            {m.views == null && (
              <p className="text-[10px] text-ink-dim">
                Metadata via keyless oEmbed. Set <code>YOUTUBE_API_KEY</code> for view/like counts.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PanelInput({
  onLoad,
  defaultValue = "",
  label = "Load",
}: {
  onLoad: (url: string) => void;
  defaultValue?: string;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <form
      className="flex flex-1 flex-col justify-center gap-2 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        onLoad(value);
      }}
    >
      <input
        className="input !py-1.5 text-[11px]"
        placeholder="Paste YouTube URL…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="btn-primary !py-1.5 text-xs">
        <Download className="h-3.5 w-3.5" /> {label}
      </button>
    </form>
  );
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded hover:bg-bg-hover hover:text-ink"
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="truncate">
      <span className="text-ink-dim">{label}: </span>
      <span className="text-ink-soft">{value}</span>
    </div>
  );
}
