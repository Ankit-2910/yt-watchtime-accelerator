"use client";

import { useStore } from "@/lib/store";
import { PageHeader, Badge, Meter } from "@/components/ui";
import { progress } from "@/lib/watchtime";
import { comma } from "@/lib/format";
import { EXCLUDED_FROM_GATE, LEGITIMACY_PRINCIPLE } from "@/lib/safety";
import { RefreshCw, ShieldCheck, FlaskConical, DollarSign, Cpu, Ban, Youtube, LogOut, AlertTriangle } from "lucide-react";

export default function Settings() {
  const {
    channel,
    reloadDemo,
    isDemo,
    ready,
    connected,
    configured,
    channelTitle,
    realError,
    connect,
    disconnect,
  } = useStore();
  if (!ready || !channel) return null;

  const SUBS_GATE = 1000;
  const prog = progress(channel.currentWatchHours, channel.targetWatchHours);
  const subsOk = channel.subscribers >= SUBS_GATE;
  const hoursOk = prog.current >= prog.target;
  const eligible = subsOk && hoursOk;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Data source, monetization eligibility, AI provider and the platform's guardrails." />

      {/* Monetization */}
      <section className="card">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-accent-green" /> Monetization eligibility
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Subscribers</span>
              <span className="text-ink">{comma(channel.subscribers)} / {comma(SUBS_GATE)}</span>
            </div>
            <div className="mt-2"><Meter value={(channel.subscribers / SUBS_GATE) * 100} tone={subsOk ? "green" : "amber"} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Valid public watch hours</span>
              <span className="text-ink">{comma(prog.current)} / {comma(prog.target)}</span>
            </div>
            <div className="mt-2"><Meter value={prog.percent} tone={hoursOk ? "green" : "brand"} /></div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-ink-soft">Status:</span>
          <Badge tone={eligible ? "green" : "amber"}>{eligible ? "Eligible to apply" : "In progress"}</Badge>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-bg-soft/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
            <Ban className="h-4 w-4 text-brand" /> NOT counted toward the 4,000-hour gate
          </div>
          <ul className="grid gap-1.5 text-sm text-ink-soft sm:grid-cols-2">
            {EXCLUDED_FROM_GATE.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-dim" /> {x}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-dim">
            Only valid public watch-page hours on long-form videos count. We never inflate the target with these.
          </p>
        </div>
      </section>

      {/* Data source */}
      <section className="card">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-accent-amber" /> Data source
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink">
              {isDemo ? "Demo / Simulation mode" : `Live channel${channelTitle ? ` · ${channelTitle}` : ""}`}
              {isDemo ? (
                <Badge tone="amber">SIMULATED — NOT YOUTUBE TRAFFIC</Badge>
              ) : (
                <Badge tone="green">LIVE YOUTUBE DATA</Badge>
              )}
            </div>
            <p className="mt-1 max-w-xl text-xs text-ink-dim">
              Demo data is synthetic and never sent to YouTube. Connect your channel (read-only OAuth) to load your
              real valid watch hours, retention and subscribers. Public video metadata already works keyless in the
              Video Lab.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {connected ? (
              <button onClick={disconnect} className="btn-ghost">
                <LogOut className="h-4 w-4" /> Disconnect YouTube
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={!configured}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                title={configured ? "" : "Set GOOGLE_OAUTH_CLIENT_ID/SECRET to enable"}
              >
                <Youtube className="h-4 w-4" /> Connect YouTube
              </button>
            )}
            <button onClick={reloadDemo} className="btn-ghost">
              <RefreshCw className="h-4 w-4" /> Regenerate demo data
            </button>
          </div>
        </div>

        {!configured && (
          <p className="mt-3 rounded-lg border border-line bg-bg-soft/60 p-3 text-xs text-ink-dim">
            OAuth isn&apos;t configured yet. Set <code>GOOGLE_OAUTH_CLIENT_ID</code>,{" "}
            <code>GOOGLE_OAUTH_CLIENT_SECRET</code> and <code>GOOGLE_OAUTH_REDIRECT_URI</code> (see README), add the{" "}
            <code>youtube.readonly</code> + <code>yt-analytics.readonly</code> scopes on your OAuth consent screen, then
            reload.
          </p>
        )}
        {realError && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-accent-amber/30 bg-accent-amber/10 p-3 text-xs text-accent-amber">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {realError}
          </p>
        )}
      </section>

      {/* AI provider */}
      <section className="card">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-accent-violet" /> AI provider (NOVA)
        </h2>
        <p className="text-sm text-ink-soft">
          Configured via environment variables: <code>AI_PROVIDER</code> (gemini · openai · anthropic) plus the matching
          API key. With no key set, NOVA falls back to a deterministic rule-based engine so it always works.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="chip">AI_PROVIDER=gemini</span>
          <span className="chip">GEMINI_API_KEY=•••</span>
          <span className="chip">GEMINI_MODEL=gemini-2.0-flash</span>
        </div>
      </section>

      {/* Principle */}
      <section className="card border-accent-green/20 bg-accent-green/[0.03]">
        <h2 className="section-title mb-2 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent-green" /> The non-negotiable principle
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">{LEGITIMACY_PRINCIPLE}</p>
      </section>
    </div>
  );
}
