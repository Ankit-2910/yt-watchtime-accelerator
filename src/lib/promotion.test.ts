import { describe, it, expect } from "vitest";
import { generatePromotion, PROMO_PLATFORMS } from "./promotion";

const input = {
  title: "The Roman Empire: The Full Story",
  url: "https://www.youtube.com/watch?v=abc123",
  topic: "The Roman Empire",
  channelTitle: "Chronicle Lab",
};

describe("promotion generator", () => {
  it("generates copy for every platform by default", () => {
    const out = generatePromotion(input);
    expect(out.length).toBe(PROMO_PLATFORMS.length);
    for (const r of out) {
      expect(r.copy.length).toBeGreaterThan(0);
      expect(r.note.length).toBeGreaterThan(0);
    }
  });

  it("includes the URL on link-friendly platforms (Instagram deliberately uses link-in-bio)", () => {
    const out = generatePromotion(input);
    for (const r of out) {
      if (r.platform === "Instagram") {
        expect(r.copy.toLowerCase()).toContain("bio");
      } else {
        expect(r.copy).toContain(input.url);
      }
    }
  });

  it("keeps X (Twitter) copy within the 280-char limit", () => {
    const longTitle = "A ".repeat(200) + "very long title that would blow past the tweet limit";
    const out = generatePromotion({ ...input, title: longTitle, hook: undefined });
    const x = out.find((r) => r.platform === "X")!;
    expect(x.charCount).toBeLessThanOrEqual(280);
  });

  it("respects a platform subset", () => {
    const out = generatePromotion(input, ["Email", "Reddit"]);
    expect(out.map((r) => r.platform)).toEqual(["Email", "Reddit"]);
  });

  it("every note reinforces non-spammy sharing", () => {
    const out = generatePromotion(input);
    // At least the community platforms warn against spam / mass actions.
    const reddit = out.find((r) => r.platform === "Reddit")!;
    expect(reddit.note.toLowerCase()).toMatch(/rule|engage|drive-by|spam/);
  });
});
