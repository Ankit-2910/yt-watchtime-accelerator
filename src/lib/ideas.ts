// Content-opportunity + Title Lab engines.
// Deterministic generators derived from the channel's own library so the output
// is grounded in what already works — no invented performance numbers.

import type { ChannelSnapshot, Video } from "./types";
import { byMomentum, mostUndervalued } from "./actions";

export interface ContentIdea {
  title: string;
  topic: string;
  hook: string;
  audience: string;
  suggestedDurationMin: number;
  thumbnailConcept: string;
  seoKeywords: string[];
  playlist: string;
  rationale: string;
  relatedVideo?: string;
  score: number; // 0-100
}

function topicOf(v: Video): string {
  return v.title.split(/[:—-]/)[0].trim();
}

const ANGLES = [
  { kind: "Sequel", prefix: "", suffix: ": What Happened Next", why: "rides proven demand from a video that already performs" },
  { kind: "Deep dive", prefix: "The Untold Story of ", suffix: "", why: "goes deeper for your most engaged viewers, boosting session watch time" },
  { kind: "Explainer", prefix: "How ", suffix: " Actually Worked", why: "search-friendly evergreen angle that earns watch hours for months" },
  { kind: "List", prefix: "5 Things You Didn't Know About ", suffix: "", why: "high-CTR curiosity format that's easy to retain" },
  { kind: "Origin", prefix: "The Real Origin of ", suffix: "", why: "origin stories hook new viewers with clear stakes" },
  { kind: "Comparison", prefix: "", suffix: " vs the World", why: "contrast framing raises curiosity and comments" },
];

/** Generate ~30 grounded ideas ranked by expected legitimate impact. */
export function generateIdeas(channel: ChannelSnapshot): ContentIdea[] {
  const videos = channel.videos;
  if (!videos.length) return [];
  const winners = byMomentum(videos).slice(0, 8);
  const under = mostUndervalued(videos);
  const ideas: ContentIdea[] = [];

  const seeds = [...winners];
  if (under && !seeds.includes(under)) seeds.push(under);

  let i = 0;
  for (const seed of seeds) {
    const topic = topicOf(seed);
    for (const angle of ANGLES) {
      if (ideas.length >= 30) break;
      const isHighRet = seed.stats.avgPercentageViewed > channel.avgRetention;
      const base = 55 + (isHighRet ? 20 : 0) + (angle.kind === "Sequel" ? 10 : 0);
      const score = Math.min(98, base + ((seeds.length - i) % 7));
      ideas.push({
        title: `${angle.prefix}${topic}${angle.suffix}`,
        topic,
        hook: `Open on the single most surprising fact about ${topic} in the first 5 seconds.`,
        audience: `Viewers who watched "${seed.title}" and history/explainer fans`,
        suggestedDurationMin: seed.format === "short" ? 1 : Math.max(8, Math.round(seed.durationSec / 60)),
        thumbnailConcept: `Bold subject on ${topic}, 2-3 word overlay, high contrast, one clear focal point`,
        seoKeywords: keywordsFor(topic),
        playlist: seed.playlist ?? topic,
        rationale: `${angle.kind} that ${angle.why}. Related to a ${isHighRet ? "high-retention" : "solid"} existing video.`,
        relatedVideo: seed.title,
        score,
      });
    }
    i++;
    if (ideas.length >= 30) break;
  }
  return ideas.sort((a, b) => b.score - a.score).slice(0, 30);
}

function keywordsFor(topic: string): string[] {
  const t = topic.toLowerCase();
  return [t, `${t} explained`, `${t} history`, `${t} documentary`, `what happened to ${t}`];
}

// ─────────────────────────────── Title Lab ───────────────────────────────

export interface ScoredTitle {
  text: string;
  category: "curiosity" | "seo" | "emotional" | "documentary" | "shorts";
  ctr: number; // 0-100 potential
  seo: number; // 0-100
  curiosity: number; // 0-100
  clarity: number; // 0-100
  misleadingRisk: number; // 0-100 (lower is better)
}

const TITLE_TEMPLATES: Record<ScoredTitle["category"], (t: string) => string[]> = {
  curiosity: (t) => [
    `Why ${t} Changed Everything`,
    `The ${t} Mystery Nobody Solved`,
    `What Really Happened to ${t}?`,
    `${t}: The Part They Left Out`,
    `The Truth About ${t}`,
  ],
  seo: (t) => [
    `${t} Explained (Full History)`,
    `${t} — Complete Guide`,
    `Everything You Need to Know About ${t}`,
    `${t} Documentary`,
    `A Beginner's Guide to ${t}`,
  ],
  emotional: (t) => [
    `The Heartbreaking End of ${t}`,
    `${t} Will Change How You See History`,
    `I Didn't Expect This About ${t}`,
    `The Rise and Fall of ${t}`,
    `${t}: A Story of Triumph and Loss`,
  ],
  documentary: (t) => [
    `${t}: The Complete Story`,
    `Inside ${t}`,
    `The Age of ${t}`,
    `Chronicles of ${t}`,
    `${t} — A Full Documentary`,
  ],
  shorts: (t) => [
    `${t} in 60 seconds`,
    `The ${t} fact that shocked me`,
    `You won't believe ${t}`,
    `${t}, explained fast`,
    `3 wild facts about ${t}`,
  ],
};

function scoreTitle(text: string, category: ScoredTitle["category"]): ScoredTitle {
  const len = text.length;
  const clarity = Math.max(30, 100 - Math.abs(52 - len) * 1.5);
  const curiosity = /why|mystery|truth|really|didn't|won't|part they/i.test(text) ? 85 : 55;
  const seo = /explained|guide|history|documentary|complete|everything/i.test(text) ? 88 : 45;
  // Misleading risk rises with hyperbole but we never use clickbait lies.
  const misleadingRisk = /shocked|won't believe|you won't/i.test(text) ? 45 : 12;
  const ctr = Math.round(curiosity * 0.5 + (100 - misleadingRisk) * 0.2 + clarity * 0.3);
  return {
    text,
    category,
    ctr,
    seo,
    curiosity,
    clarity: Math.round(clarity),
    misleadingRisk,
  };
}

/** Generate scored titles for a topic across all categories. */
export function generateTitles(topic: string): ScoredTitle[] {
  const clean = topic.trim() || "Your Topic";
  const out: ScoredTitle[] = [];
  (Object.keys(TITLE_TEMPLATES) as ScoredTitle["category"][]).forEach((cat) => {
    for (const text of TITLE_TEMPLATES[cat](clean)) out.push(scoreTitle(text, cat));
  });
  return out.sort((a, b) => b.ctr - a.ctr);
}
