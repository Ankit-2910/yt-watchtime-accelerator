"use client";

// A collection that persists to Postgres via an API route when a database is
// configured, and transparently falls back to localStorage otherwise. This lets
// the Calendar and Experiment engines work with zero setup and upgrade to real
// persistence the moment DATABASE_URL is present — no code change in the pages.

import { useCallback, useEffect, useState } from "react";
import { Database, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui";

export type PersistMode = "loading" | "db" | "local";

/** Small indicator of where a collection is being persisted. */
export function PersistBadge({ mode }: { mode: PersistMode }) {
  if (mode === "loading") return null;
  return mode === "db" ? (
    <Badge tone="green">
      <Database className="h-3.5 w-3.5" /> Saved to Postgres
    </Badge>
  ) : (
    <Badge tone="default">
      <HardDrive className="h-3.5 w-3.5" /> Saved locally
    </Badge>
  );
}

export function usePersistentCollection<T extends { id: string }>(opts: {
  storageKey: string;
  apiPath: string;
  seed: T[];
}) {
  const { storageKey, apiPath, seed } = opts;
  const [items, setItems] = useState<T[]>(seed);
  const [mode, setMode] = useState<PersistMode>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(apiPath);
        if (r.ok) {
          const d = await r.json();
          if (!cancelled) {
            setItems(d.items as T[]);
            setMode("db");
          }
          return;
        }
      } catch {
        /* fall through to local */
      }
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw && !cancelled) setItems(JSON.parse(raw) as T[]);
      } catch {
        /* ignore corrupt storage */
      }
      if (!cancelled) setMode("local");
    })();
    return () => {
      cancelled = true;
    };
  }, [apiPath, storageKey]);

  // Persist to localStorage only in local mode (DB is the source of truth otherwise).
  useEffect(() => {
    if (mode === "local") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch {
        /* quota / private mode — non-fatal */
      }
    }
  }, [items, mode, storageKey]);

  const add = useCallback(
    async (data: Omit<T, "id">) => {
      if (mode === "db") {
        try {
          const r = await fetch(apiPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (r.ok) {
            const d = await r.json();
            setItems((p) => [...p, d.item as T]);
            return;
          }
        } catch {
          /* fall through to local id */
        }
      }
      const id = `local-${Date.now()}-${Math.floor(Math.random() * 1e5)}`;
      setItems((p) => [...p, { ...(data as object), id } as T]);
    },
    [mode, apiPath]
  );

  const patch = useCallback(
    async (id: string, changes: Partial<T>) => {
      setItems((p) => p.map((it) => (it.id === id ? { ...it, ...changes } : it)));
      if (mode === "db") {
        try {
          await fetch(apiPath, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...changes }),
          });
        } catch {
          /* optimistic update already applied */
        }
      }
    },
    [mode, apiPath]
  );

  const remove = useCallback(
    async (id: string) => {
      setItems((p) => p.filter((it) => it.id !== id));
      if (mode === "db") {
        try {
          await fetch(`${apiPath}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        } catch {
          /* optimistic removal already applied */
        }
      }
    },
    [mode, apiPath]
  );

  return { items, mode, add, patch, remove } as const;
}
