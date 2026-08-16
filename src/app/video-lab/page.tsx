"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Badge } from "@/components/ui";
import { VideoPanel, type PanelState } from "@/components/VideoPanel";
import { Grid3x3, Trash2, Sparkles, FlaskConical, Search } from "lucide-react";

const PANEL_COUNT = 30;
const STORAGE_KEY = "ytwta.video-lab.panels.v1";

function emptyPanel(i: number): PanelState {
  return {
    id: `panel-${i}`,
    url: "",
    meta: null,
    status: "empty",
    notes: "",
    playlist: "",
    maximized: false,
  };
}

function initialPanels(): PanelState[] {
  return Array.from({ length: PANEL_COUNT }, (_, i) => emptyPanel(i));
}

export default function VideoLab() {
  const { channel } = useStore();
  const [panels, setPanels] = useState<PanelState[]>(initialPanels);
  const [mode, setMode] = useState<"qa" | "research">("qa");
  const [loaded, setLoaded] = useState(false);

  // hydrate from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PanelState[];
        if (Array.isArray(parsed) && parsed.length === PANEL_COUNT) setPanels(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
    } catch {
      /* quota / private mode — non-fatal */
    }
  }, [panels, loaded]);

  function update(i: number, patch: Partial<PanelState>) {
    setPanels((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function remove(i: number) {
    setPanels((prev) => prev.map((p, idx) => (idx === i ? emptyPanel(i) : p)));
  }

  function clearAll() {
    setPanels(initialPanels());
  }

  function fillFromDemo() {
    if (!channel) return;
    setPanels((prev) =>
      prev.map((p, i) => {
        const v = channel.videos[i];
        if (!v) return p;
        return {
          ...p,
          url: v.url,
          status: "loaded",
          meta: {
            videoId: v.ytVideoId,
            url: v.url,
            title: v.title,
            channelTitle: v.channelTitle,
            thumbnailUrl: v.thumbnailUrl,
            durationSec: v.durationSec,
            publishedAt: v.publishedAt,
            views: v.stats.views,
            likes: v.stats.likes,
            comments: v.stats.comments,
            source: "data-api",
          },
          playlist: v.playlist ?? "",
        };
      })
    );
  }

  const loadedCount = panels.filter((p) => p.status === "loaded").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Video Lab"
        subtitle="A legitimate 30-panel video intelligence & QA workspace — compare, review and research videos. These panels analyze metadata; they never play or automate engagement."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-line bg-bg-soft p-0.5 text-sm">
              <button
                onClick={() => setMode("qa")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${
                  mode === "qa" ? "bg-brand text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                <FlaskConical className="h-4 w-4" /> QA
              </button>
              <button
                onClick={() => setMode("research")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${
                  mode === "research" ? "bg-brand text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                <Search className="h-4 w-4" /> Research
              </button>
            </div>
            <button onClick={fillFromDemo} className="btn-ghost">
              <Sparkles className="h-4 w-4" /> Fill from demo
            </button>
            <button onClick={clearAll} className="btn-ghost">
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
        <Badge tone="blue">
          <Grid3x3 className="h-3.5 w-3.5" /> {loadedCount}/{PANEL_COUNT} panels loaded
        </Badge>
        <span className="text-ink-dim">
          {mode === "qa"
            ? "QA mode — review your own uploads for thumbnails, titles and packaging."
            : "Research mode — analyze public videos to learn what made a topic succeed. No engagement is automated."}
        </span>
      </div>

      {/* 5 × 6 grid; panels lazy-load thumbnails and fail in isolation */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {panels.map((panel, i) => (
          <div key={panel.id} className={panel.maximized ? "sm:col-span-2 lg:col-span-2" : ""}>
            <VideoPanel
              index={i}
              panel={panel}
              onUpdate={(patch) => update(i, patch)}
              onRemove={() => remove(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
