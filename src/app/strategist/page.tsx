"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Badge } from "@/components/ui";
import { progress, trailingDailyRate, projectedCompletion } from "@/lib/watchtime";
import { comma, dateLabel } from "@/lib/format";
import type { AiMessage, ChannelSnapshot } from "@/lib/types";
import { Bot, Send, ShieldAlert, User } from "lucide-react";

const SUGGESTIONS = [
  "What should I upload today?",
  "How can I increase retention?",
  "How long until I reach 4,000 hours?",
  "Which video should I make a sequel to?",
  "Which videos should I improve first?",
];

function buildSummary(channel: ChannelSnapshot, now: Date): string {
  const prog = progress(channel.currentWatchHours, channel.targetWatchHours);
  const rate = trailingDailyRate(channel.timeline, 30);
  const proj = projectedCompletion(prog.remaining, rate, now);
  const top = [...channel.videos].sort((a, b) => b.stats.watchHours - a.stats.watchHours)[0];
  const worst = [...channel.videos].sort((a, b) => a.stats.avgPercentageViewed - b.stats.avgPercentageViewed)[0];
  return [
    `Channel: ${channel.title} (${channel.handle})${channel.isDemo ? " [DEMO DATA]" : ""}`,
    `Subscribers: ${comma(channel.subscribers)}, total views: ${comma(channel.totalViews)}`,
    `Valid public watch hours: ${comma(prog.current)} / ${comma(prog.target)} (${prog.percent.toFixed(1)}%), ${comma(prog.remaining)} remaining`,
    `30-day rate: ${rate.toFixed(1)} h/day; projected completion: ${proj ? dateLabel(proj.date.toISOString()) : "n/a"}`,
    `Avg view duration: ${channel.avgViewDuration}s, avg retention: ${channel.avgRetention}%, CTR: ${channel.ctr}%, returning viewers: ${channel.returningViewerRate}%`,
    `Highest watch-hours video: "${top?.title}" (${comma(top?.stats.watchHours ?? 0)} h)`,
    `Lowest-retention video: "${worst?.title}" (${worst?.stats.avgPercentageViewed}% viewed)`,
    `${channel.videos.length} videos analyzed.`,
  ].join("\n");
}

export default function Strategist() {
  const { channel, now } = useStore();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading || !channel) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/strategist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, summary: buildSummary(channel, now) }),
      });
      const data = await res.json();
      setProvider(data.provider ?? null);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.text ?? data.error ?? "No response." },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error — please retry." }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="NOVA — YouTube Strategist"
        subtitle="Ask anything about growing legitimate watch hours. NOVA reads your channel summary and refuses any bot/fake-engagement request."
        action={provider && <Badge tone="blue">provider: {provider}</Badge>}
      />

      <div className="card flex h-[62vh] flex-col !p-0">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="grid h-full place-content-center gap-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/15">
                <Bot className="h-7 w-7 text-brand" />
              </div>
              <p className="text-sm text-ink-soft">Ask NOVA about retention, titles, ideas, or your 4,000-hour timeline.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="chip hover:!border-brand/40 hover:!text-brand-soft">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${m.role === "user" ? "bg-accent/15" : "bg-brand/15"}`}>
                {m.role === "user" ? <User className="h-4 w-4 text-accent" /> : <Bot className="h-4 w-4 text-brand" />}
              </div>
              <div
                className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-accent/10 text-ink" : "bg-bg-soft text-ink-soft"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-ink-dim">
              <Bot className="h-4 w-4 text-brand" />
              <span className="flex gap-1">
                <Dot /> <Dot /> <Dot />
              </span>
            </div>
          )}
        </div>

        <form
          className="flex items-center gap-2 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            className="input"
            placeholder="Ask NOVA…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <p className="flex items-center gap-2 text-xs text-ink-dim">
        <ShieldAlert className="h-4 w-4 text-accent-amber" />
        NOVA references only your provided data and never invents specific numbers. With no API key set it gives rule-based best practices.
      </p>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-dim [animation-delay:var(--d)]" />;
}
