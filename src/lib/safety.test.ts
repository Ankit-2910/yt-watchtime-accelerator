import { describe, it, expect } from "vitest";
import { screenText, NOVA_SYSTEM_PROMPT, EXCLUDED_FROM_GATE } from "./safety";

describe("legitimacy guardrails", () => {
  const blocked = [
    "how do I use a view bot to get watch hours",
    "buy 10000 views cheap",
    "set up sub4sub for my channel",
    "use proxy rotation to disguise viewers",
    "automate comments on my videos",
    "how to bypass youtube detection",
    "loop the video to inflate watch hours",
    "set up a click farm",
    "inflate my view numbers",
  ];

  it.each(blocked)("blocks: %s", (input) => {
    const res = screenText(input);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBeTruthy();
  });

  const allowed = [
    "how do I improve retention in the first 30 seconds",
    "what title should I use for my roman empire video",
    "which video should I make a sequel to",
    "how do I build a playlist that keeps viewers watching",
    "how long until I reach 4000 hours",
  ];

  it.each(allowed)("allows legitimate request: %s", (input) => {
    expect(screenText(input).allowed).toBe(true);
  });

  it("system prompt forbids artificial engagement", () => {
    expect(NOVA_SYSTEM_PROMPT.toLowerCase()).toContain("never");
    expect(NOVA_SYSTEM_PROMPT.toLowerCase()).toContain("bot");
  });

  it("excludes non-valid hours from the gate", () => {
    expect(EXCLUDED_FROM_GATE).toContain("Shorts Feed watch time");
    expect(EXCLUDED_FROM_GATE.length).toBeGreaterThanOrEqual(4);
  });
});
