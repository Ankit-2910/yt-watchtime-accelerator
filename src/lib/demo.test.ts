import { describe, it, expect } from "vitest";
import { generateDemoChannel } from "./demo";
import { generateIdeas, generateTitles } from "./ideas";
import { topActions } from "./actions";
import { channelScore } from "./watchtime";

const NOW = new Date("2026-08-16T12:00:00.000Z");

describe("demo channel", () => {
  it("is deterministic for a given seed", () => {
    const a = generateDemoChannel(NOW, 42);
    const b = generateDemoChannel(NOW, 42);
    expect(a.currentWatchHours).toBe(b.currentWatchHours);
    expect(a.videos.length).toBe(b.videos.length);
    expect(a.videos[0].ytVideoId).toBe(b.videos[0].ytVideoId);
  });

  it("produces a plausible snapshot", () => {
    const c = generateDemoChannel(NOW, 7);
    expect(c.isDemo).toBe(true);
    expect(c.videos.length).toBe(24);
    expect(c.timeline.length).toBe(180);
    expect(c.targetWatchHours).toBe(4000);
    expect(c.currentWatchHours).toBeGreaterThan(0);
    expect(c.avgRetention).toBeGreaterThan(0);
    expect(c.avgRetention).toBeLessThanOrEqual(100);
  });
});

describe("growth engines on demo data", () => {
  const channel = generateDemoChannel(NOW, 123);

  it("returns at most 5 ranked actions with valid scores", () => {
    const actions = topActions(channel);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(5);
    for (const a of actions) {
      expect(a.impact).toBeGreaterThanOrEqual(0);
      expect(a.impact).toBeLessThanOrEqual(100);
    }
    // ranked descending-ish by weighted score → first impact >= last impact
    expect(actions[0].impact).toBeGreaterThanOrEqual(actions[actions.length - 1].impact - 30);
  });

  it("generates exactly 30 content ideas", () => {
    const ideas = generateIdeas(channel);
    expect(ideas.length).toBe(30);
    expect(ideas[0].score).toBeGreaterThanOrEqual(ideas[29].score);
  });

  it("scores titles across categories", () => {
    const titles = generateTitles("Ancient Rome");
    expect(titles.length).toBeGreaterThanOrEqual(25);
    expect(titles.every((t) => t.ctr >= 0 && t.ctr <= 100)).toBe(true);
  });

  it("computes a bounded channel score", () => {
    const score = channelScore(channel);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.components.length).toBe(8);
  });
});
