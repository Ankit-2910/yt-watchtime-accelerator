// NOVA — AI strategist provider abstraction.
//
// Providers: gemini (default) | openai | anthropic | none.
// With no key configured, NOVA degrades to a deterministic rule-based engine so
// the product is useful with zero setup. Every path is wrapped with the
// NOVA_SYSTEM_PROMPT and the legitimacy guardrails in lib/safety.ts.

import { NOVA_SYSTEM_PROMPT } from "./safety";

export interface NovaContext {
  /** compact, human-readable channel summary the model may reference */
  summary?: string;
}

type Provider = "gemini" | "openai" | "anthropic" | "none";

function activeProvider(): Provider {
  const p = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  if (p === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "none";
}

export function providerLabel(): string {
  const p = activeProvider();
  return p === "none" ? "Rule-based (no API key set)" : p;
}

async function askGemini(prompt: string, context: NovaContext): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    systemInstruction: NOVA_SYSTEM_PROMPT,
  });
  const full = context.summary
    ? `Channel data the creator has provided:\n${context.summary}\n\nQuestion: ${prompt}`
    : prompt;
  const result = await model.generateContent(full);
  return result.response.text();
}

async function askOpenAI(prompt: string, context: NovaContext): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: NOVA_SYSTEM_PROMPT },
        {
          role: "user",
          content: context.summary
            ? `Channel data:\n${context.summary}\n\nQuestion: ${prompt}`
            : prompt,
        },
      ],
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function askAnthropic(prompt: string, context: NovaContext): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
      max_tokens: 1024,
      system: NOVA_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: context.summary
            ? `Channel data:\n${context.summary}\n\nQuestion: ${prompt}`
            : prompt,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

/**
 * Deterministic fallback strategist. Uses only the supplied summary — it never
 * invents specific numbers. Returns solid, prioritized best-practice guidance.
 */
export function ruleBasedNova(prompt: string, context: NovaContext): string {
  const q = prompt.toLowerCase();
  const head = "**NOVA (rule-based mode — set an API key for tailored answers)**\n\n";

  if (/(retention|drop|hook|watch time on video)/.test(q)) {
    return head + [
      "To lift retention (the biggest lever on watch hours):",
      "1. Cut the intro. State the payoff in the first 5 seconds — no logo, no 'hey guys'.",
      "2. Front-load your strongest visual/claim; put the question the video answers on screen immediately.",
      "3. Add a pattern interrupt (new location, graphic, or B-roll) every 20-30s to reset attention.",
      "4. Find your biggest drop in analytics and rewrite the 10 seconds *before* it — that's where you lost them.",
      "5. End with a specific next-video hook, not a generic 'like and subscribe'.",
    ].join("\n");
  }
  if (/(title|thumbnail|ctr|click)/.test(q)) {
    return head + [
      "To raise CTR without misleading (misleading titles tank retention and trust):",
      "1. Lead with curiosity or stakes, not description: 'Why X collapsed' beats 'A video about X'.",
      "2. One idea per thumbnail. Big readable subject, high contrast, minimal text (≤3 words).",
      "3. Make sure the thumbnail promise is paid off in the first 15 seconds.",
      "4. A/B test one variable at a time in the Experiment Engine and keep the confident winner.",
    ].join("\n");
  }
  if (/(playlist|session|funnel|next video|binge)/.test(q)) {
    return head + [
      "To increase legitimate session depth (multiple videos per visit):",
      "1. Order playlists so each video ends on a question the next one answers.",
      "2. Add end screens pointing to the *most relevant* next video, not your newest.",
      "3. Use Shorts as a top-of-funnel that references a specific long-form deep dive.",
      "4. Pin a comment linking the natural 'watch this next' video.",
    ].join("\n");
  }
  if (/(idea|topic|what should i (make|upload)|next video)/.test(q)) {
    return head + [
      "To pick your next topic:",
      "1. Double down on your highest-retention topic — make a sequel or a deeper cut.",
      "2. Turn your best long-form into 2-3 Shorts that tease the full video.",
      "3. Look for an evergreen angle on a proven topic so it earns watch hours for months.",
      "See the Content Ideas tab for 30 concrete, ranked ideas built from your library.",
    ].join("\n");
  }
  if (/(how long|when|reach|4000|4,000|hours|complete)/.test(q)) {
    return head + [
      "Your projected completion is on the Mission Control tab — it's computed from your own trailing daily watch-hour rate (conservative / realistic / aggressive).",
      "The fastest *legitimate* way to pull that date in:",
      "1. Publish consistently — cadence compounds.",
      "2. Improve retention on your top-traffic videos first (they get the most impressions).",
      "3. Build playlists so one viewer watches several videos per session.",
    ].join("\n");
  }
  return head + [
    context.summary ? `Based on your channel:\n${context.summary}\n` : "",
    "Top 3 legitimate moves that usually move watch hours the most:",
    "1. Raise retention on your highest-traffic video (rewrite the first 30 seconds).",
    "2. Build a playlist that chains your best videos into a binge path.",
    "3. Ship one Short that funnels to a proven long-form video.",
    "Ask me about retention, titles, thumbnails, playlists, ideas, or your 4,000-hour timeline.",
  ].filter(Boolean).join("\n");
}

export async function askNova(prompt: string, context: NovaContext = {}): Promise<{
  text: string;
  provider: string;
}> {
  const provider = activeProvider();
  try {
    if (provider === "gemini") return { text: await askGemini(prompt, context), provider };
    if (provider === "openai") return { text: await askOpenAI(prompt, context), provider };
    if (provider === "anthropic") return { text: await askAnthropic(prompt, context), provider };
  } catch (err) {
    return {
      text:
        ruleBasedNova(prompt, context) +
        `\n\n_(AI provider "${provider}" errored — showing rule-based guidance.)_`,
      provider: "fallback",
    };
  }
  return { text: ruleBasedNova(prompt, context), provider: "rule-based" };
}
