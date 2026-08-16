"use client";

import { useState } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { usePersistentCollection, PersistBadge } from "@/lib/persist";
import type { CalendarStatus, VideoFormat } from "@/lib/types";
import { Plus, ChevronRight, ChevronLeft, X } from "lucide-react";

const STATUSES: CalendarStatus[] = [
  "IDEA",
  "SCRIPT",
  "RECORDING",
  "EDITING",
  "READY",
  "PUBLISHED",
  "ANALYZING",
];

interface Item {
  id: string;
  title: string;
  type: VideoFormat | "community";
  status: CalendarStatus;
}

const SEED: Item[] = [
  { id: "c1", title: "The Roman Empire: The Full Story", type: "long", status: "SCRIPT" },
  { id: "c2", title: "5 Lost Technologies — Short", type: "short", status: "EDITING" },
  { id: "c3", title: "How Cities Were Born", type: "long", status: "IDEA" },
  { id: "c4", title: "First Writing Systems", type: "long", status: "READY" },
  { id: "c5", title: "Weekly community poll", type: "community", status: "PUBLISHED" },
];

export default function CalendarPage() {
  const { items, mode, add, patch, remove } = usePersistentCollection<Item>({
    storageKey: "ytwta.calendar.v1",
    apiPath: "/api/calendar",
    seed: SEED,
  });
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Item["type"]>("long");

  function submit() {
    if (!title.trim()) return;
    add({ title: title.trim(), type, status: "IDEA" });
    setTitle("");
  }

  function move(item: Item, dir: 1 | -1) {
    const idx = STATUSES.indexOf(item.status);
    const next = Math.max(0, Math.min(STATUSES.length - 1, idx + dir));
    if (next !== idx) patch(item.id, { status: STATUSES[next] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Calendar"
        subtitle="Track every piece from idea to analysis. Consistency compounds into watch hours."
        action={<PersistBadge mode={mode} />}
      />

      <div className="card flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="stat-label">New content item</label>
          <input
            className="input mt-1.5"
            placeholder="Video / Short / post title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <select
          className="input max-w-[140px]"
          value={type}
          onChange={(e) => setType(e.target.value as Item["type"])}
        >
          <option value="long">Long-form</option>
          <option value="short">Short</option>
          <option value="community">Community</option>
        </select>
        <button onClick={submit} className="btn-primary">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STATUSES.map((status) => {
          const col = items.filter((it) => it.status === status);
          return (
            <div key={status} className="w-56 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{status}</span>
                <span className="text-xs text-ink-dim">{col.length}</span>
              </div>
              <div className="min-h-[120px] space-y-2 rounded-xl border border-line bg-bg-soft/40 p-2">
                {col.map((it) => (
                  <div key={it.id} className="group rounded-lg border border-line bg-bg-card p-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-medium text-ink">{it.title}</span>
                      <button
                        onClick={() => remove(it.id)}
                        className="text-ink-dim opacity-0 transition-opacity hover:text-brand group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge tone={it.type === "short" ? "violet" : it.type === "community" ? "blue" : "default"}>
                        {it.type}
                      </Badge>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => move(it, -1)}
                          disabled={STATUSES.indexOf(it.status) === 0}
                          className="rounded p-0.5 text-ink-dim hover:bg-bg-hover hover:text-ink disabled:opacity-30"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => move(it, 1)}
                          disabled={STATUSES.indexOf(it.status) === STATUSES.length - 1}
                          className="rounded p-0.5 text-ink-dim hover:bg-bg-hover hover:text-ink disabled:opacity-30"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
