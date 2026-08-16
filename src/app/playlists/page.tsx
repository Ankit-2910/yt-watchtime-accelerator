"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Badge } from "@/components/ui";
import { durationLabel, comma } from "@/lib/format";
import { topicConsistencyScore } from "@/lib/watchtime";
import type { Video } from "@/lib/types";
import { ListVideo, ArrowDown, Clock } from "lucide-react";

export default function Playlists() {
  const { channel, ready } = useStore();

  const groups = useMemo(() => {
    if (!channel) return [];
    const map = new Map<string, Video[]>();
    for (const v of channel.videos) {
      if (!v.playlist) continue;
      const arr = map.get(v.playlist) ?? [];
      arr.push(v);
      map.set(v.playlist, arr);
    }
    return [...map.entries()]
      .filter(([, vids]) => vids.length >= 2)
      .map(([name, vids]) => {
        const totalDur = vids.reduce((s, v) => s + v.durationSec, 0);
        // Recommended order: strongest-retention first, then descending — a hook
        // that keeps viewers into the next video (raises legitimate session depth).
        const ordered = [...vids].sort(
          (a, b) => b.stats.avgPercentageViewed - a.stats.avgPercentageViewed
        );
        return {
          name,
          videos: ordered,
          totalDur,
          avgDur: Math.round(totalDur / vids.length),
          consistency: topicConsistencyScore(vids),
        };
      })
      .sort((a, b) => b.videos.length - a.videos.length);
  }, [channel]);

  if (!ready || !channel) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playlist Intelligence"
        subtitle="Order playlists so each video makes the viewer want the next one — the engine of legitimate session depth."
      />

      {groups.length === 0 ? (
        <div className="card text-sm text-ink-soft">
          No multi-video playlists yet. Group related videos to build binge paths.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map((g) => (
            <div key={g.name} className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="section-title flex items-center gap-2">
                  <ListVideo className="h-5 w-5 text-accent" /> {g.name}
                </h2>
                <Badge tone={g.consistency >= 60 ? "green" : "amber"}>{g.consistency}% consistent</Badge>
              </div>
              <div className="mb-4 flex flex-wrap gap-4 text-xs text-ink-dim">
                <span>{g.videos.length} videos</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {durationLabel(g.totalDur)} total
                </span>
                <span>avg {durationLabel(g.avgDur)}</span>
              </div>

              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-dim">
                Recommended session flow
              </div>
              <ol className="space-y-0">
                {g.videos.map((v, i) => (
                  <li key={v.id}>
                    <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-soft/60 p-2.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent/15 text-xs font-bold text-accent">
                        {i + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnailUrl} alt="" className="h-9 w-16 shrink-0 rounded object-cover" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-xs font-medium text-ink">{v.title}</div>
                        <div className="text-[11px] text-ink-dim">
                          {v.stats.avgPercentageViewed}% viewed · {comma(v.stats.views)} views
                        </div>
                      </div>
                    </div>
                    {i < g.videos.length - 1 && (
                      <div className="flex justify-center py-0.5 text-ink-dim">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
