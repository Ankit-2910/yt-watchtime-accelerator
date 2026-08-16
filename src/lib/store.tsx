"use client";

// Global client state: the active channel snapshot + the "now" anchor.
//
// Boots into DEMO mode instantly (zero setup). If the user has connected their
// YouTube account (OAuth), it then loads their REAL channel analytics and swaps
// it in. Demo data is generated on mount (not during SSR) so `now`/Date stays
// deterministic and hydration-safe.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { generateDemoChannel } from "./demo";
import type { ChannelSnapshot } from "./types";

interface StoreValue {
  channel: ChannelSnapshot | null;
  now: Date;
  ready: boolean;
  isDemo: boolean;
  /** OAuth connection state */
  connected: boolean;
  configured: boolean;
  channelTitle: string | null;
  /** non-fatal message when real data couldn't load */
  realError: string | null;
  reloadDemo: () => void;
  connect: () => void;
  disconnect: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [channel, setChannel] = useState<ChannelSnapshot | null>(null);
  const [now, setNow] = useState<Date>(() => new Date(0));
  const [ready, setReady] = useState(false);
  const [seed, setSeed] = useState(20260816);
  const [connected, setConnected] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [channelTitle, setChannelTitle] = useState<string | null>(null);
  const [realError, setRealError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    setNow(today);
    setChannel(generateDemoChannel(today, seed));
    setReady(true);
  }, [seed]);

  // After demo is up, check OAuth status and load real data if connected.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await fetch("/api/youtube/status").then((r) => r.json());
        if (cancelled) return;
        setConfigured(Boolean(s.configured));
        setConnected(Boolean(s.connected));
        setChannelTitle(s.channelTitle ?? null);
        if (s.connected) {
          const res = await fetch("/api/youtube/channel");
          const data = await res.json();
          if (cancelled) return;
          if (res.ok && data.channel) {
            setChannel(data.channel as ChannelSnapshot);
            setRealError(null);
          } else {
            setRealError(data.error ?? "Couldn't load your analytics — showing demo data.");
          }
        }
      } catch {
        /* stay in demo mode */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadDemo = useCallback(() => setSeed((s) => s + 1), []);
  const connect = useCallback(() => {
    window.location.href = "/api/auth/youtube/login";
  }, []);
  const disconnect = useCallback(() => {
    window.location.href = "/api/auth/youtube/logout";
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      channel,
      now,
      ready,
      isDemo: channel?.isDemo ?? true,
      connected,
      configured,
      channelTitle,
      realError,
      reloadDemo,
      connect,
      disconnect,
    }),
    [channel, now, ready, connected, configured, channelTitle, realError, reloadDemo, connect, disconnect]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
