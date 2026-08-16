"use client";

import { useState } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { usePersistentCollection, PersistBadge } from "@/lib/persist";
import { FlaskConical, Plus, X, ShieldCheck } from "lucide-react";

interface Experiment {
  id: string;
  dimension: string;
  hypothesis: string;
  metric: string;
  variantA: string;
  variantB: string;
  status: "planned" | "running" | "complete";
  winner?: "A" | "B" | "";
  confidence?: number;
}

const DIMENSIONS = ["Title", "Thumbnail", "Hook", "Video length", "Topic", "Publish time", "Playlist position"];
const METRICS = ["CTR", "Avg view duration", "Retention", "Watch hours", "Subscribers gained"];

const SEED: Experiment[] = [
  {
    id: "e1",
    dimension: "Thumbnail",
    hypothesis: "A brighter subject raises CTR",
    metric: "CTR",
    variantA: "Dark, moody thumbnail",
    variantB: "Bright, high-contrast subject",
    status: "running",
  },
];

export default function Experiments() {
  const { items, mode, add, patch, remove } = usePersistentCollection<Experiment>({
    storageKey: "ytwta.experiments.v1",
    apiPath: "/api/experiments",
    seed: SEED,
  });
  const [draft, setDraft] = useState<Omit<Experiment, "id" | "status">>({
    dimension: "Title",
    hypothesis: "",
    metric: "CTR",
    variantA: "",
    variantB: "",
  });

  function submit() {
    if (!draft.variantA || !draft.variantB) return;
    add({ ...draft, status: "planned" });
    setDraft({ dimension: "Title", hypothesis: "", metric: "CTR", variantA: "", variantB: "" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiment Engine"
        subtitle="Test one variable at a time and keep the confident winner. We never manipulate views or engagement — only the packaging."
        action={<PersistBadge mode={mode} />}
      />

      <div className="flex items-center gap-2 rounded-lg border border-accent-green/20 bg-accent-green/5 px-3 py-2 text-xs text-accent-green">
        <ShieldCheck className="h-4 w-4" /> Experiments change your titles/thumbnails/timing — real viewers decide the winner.
      </div>

      <div className="card grid gap-3 md:grid-cols-2">
        <div>
          <label className="stat-label">Dimension</label>
          <select className="input mt-1.5" value={draft.dimension} onChange={(e) => setDraft({ ...draft, dimension: e.target.value })}>
            {DIMENSIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="stat-label">Success metric</label>
          <select className="input mt-1.5" value={draft.metric} onChange={(e) => setDraft({ ...draft, metric: e.target.value })}>
            {METRICS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="stat-label">Hypothesis</label>
          <input className="input mt-1.5" placeholder="e.g. A question in the title raises CTR" value={draft.hypothesis} onChange={(e) => setDraft({ ...draft, hypothesis: e.target.value })} />
        </div>
        <div>
          <label className="stat-label">Variant A</label>
          <input className="input mt-1.5" value={draft.variantA} onChange={(e) => setDraft({ ...draft, variantA: e.target.value })} />
        </div>
        <div>
          <label className="stat-label">Variant B</label>
          <input className="input mt-1.5" value={draft.variantB} onChange={(e) => setDraft({ ...draft, variantB: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <button onClick={submit} className="btn-primary">
            <Plus className="h-4 w-4" /> Add experiment
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((e) => (
          <div key={e.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-accent-violet" />
                <span className="font-semibold text-ink">{e.dimension}</span>
                <Badge tone={e.status === "complete" ? "green" : e.status === "running" ? "amber" : "default"}>{e.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="input max-w-[150px] !py-1 text-xs"
                  value={e.status}
                  onChange={(ev) => patch(e.id, { status: ev.target.value as Experiment["status"] })}
                >
                  <option value="planned">planned</option>
                  <option value="running">running</option>
                  <option value="complete">complete</option>
                </select>
                <button onClick={() => remove(e.id)} className="text-ink-dim hover:text-brand">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {e.hypothesis && <p className="mt-2 text-sm text-ink-soft">{e.hypothesis}</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <VariantCard letter="A" text={e.variantA} winner={e.winner === "A"} onWin={() => patch(e.id, { winner: "A", status: "complete" })} />
              <VariantCard letter="B" text={e.variantB} winner={e.winner === "B"} onWin={() => patch(e.id, { winner: "B", status: "complete" })} />
            </div>
            <div className="mt-2 text-xs text-ink-dim">Tracking metric: {e.metric}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantCard({
  letter,
  text,
  winner,
  onWin,
}: {
  letter: string;
  text: string;
  winner?: boolean;
  onWin: () => void;
}) {
  return (
    <div className={`rounded-lg border p-3 ${winner ? "border-accent-green/40 bg-accent-green/5" : "border-line bg-bg-soft"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink-soft">Variant {letter}</span>
        <button onClick={onWin} className={`text-[11px] ${winner ? "text-accent-green" : "text-ink-dim hover:text-ink"}`}>
          {winner ? "✓ winner" : "mark winner"}
        </button>
      </div>
      <p className="mt-1 text-sm text-ink">{text}</p>
    </div>
  );
}
