"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Badge } from "@/components/ui";
import { generateIdeas } from "@/lib/ideas";
import { Lightbulb, Clock, Users, ListVideo, Link2 } from "lucide-react";

export default function Ideas() {
  const { channel, ready } = useStore();
  const ideas = useMemo(() => (channel ? generateIdeas(channel) : []), [channel]);
  if (!ready || !channel) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Opportunity Engine"
        subtitle="30 next-video ideas built from what already works on your channel — ranked by expected legitimate watch-time impact."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ideas.map((idea, i) => (
          <div key={i} className="card card-hover flex flex-col gap-3 animate-fade-up">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand/15 text-xs font-bold text-brand-soft">
                  {i + 1}
                </span>
                <h3 className="text-sm font-semibold leading-snug text-ink">{idea.title}</h3>
              </div>
              <Badge tone={idea.score >= 80 ? "green" : idea.score >= 65 ? "amber" : "blue"}>{idea.score}</Badge>
            </div>

            <p className="text-xs italic text-ink-soft">&ldquo;{idea.hook}&rdquo;</p>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-ink-dim">
              <Meta icon={ListVideo} text={idea.topic} />
              <Meta icon={Clock} text={`~${idea.suggestedDurationMin} min`} />
              <Meta icon={Users} text={idea.audience} span />
            </div>

            <div className="flex flex-wrap gap-1">
              {idea.seoKeywords.slice(0, 4).map((k) => (
                <span key={k} className="rounded bg-bg-soft px-1.5 py-0.5 text-[10px] text-ink-dim">
                  {k}
                </span>
              ))}
            </div>

            <div className="rounded-lg border border-line bg-bg-soft/60 p-2.5 text-[11px] text-ink-soft">
              <div className="mb-1 font-medium text-ink">Thumbnail idea</div>
              {idea.thumbnailConcept}
            </div>

            <div className="mt-auto space-y-1.5 border-t border-line pt-2 text-[11px]">
              <div className="text-ink-soft">
                <span className="font-medium text-ink">Why it may work: </span>
                {idea.rationale}
              </div>
              {idea.relatedVideo && (
                <div className="flex items-center gap-1.5 text-ink-dim">
                  <Link2 className="h-3 w-3" /> Related: {idea.relatedVideo}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-ink-dim">
                <ListVideo className="h-3 w-3" /> Playlist: {idea.playlist}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  text,
  span,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  span?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${span ? "col-span-2" : ""}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="line-clamp-1">{text}</span>
    </div>
  );
}
