import { describe, it, expect } from "vitest";
import { extractVideoId, parseISODuration } from "./youtube";

describe("extractVideoId", () => {
  it("parses standard watch URLs", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses youtu.be short links", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses shorts + embed URLs", () => {
    expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("accepts a bare video id", () => {
    expect(extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("handles extra query params", () => {
    expect(extractVideoId("https://www.youtube.com/watch?list=abc&v=dQw4w9WgXcQ&t=10s")).toBe("dQw4w9WgXcQ");
  });
  it("returns null for non-YouTube input", () => {
    expect(extractVideoId("https://example.com/video")).toBeNull();
    expect(extractVideoId("not a url")).toBeNull();
  });
});

describe("parseISODuration", () => {
  it("parses hours/minutes/seconds", () => {
    expect(parseISODuration("PT1H2M3S")).toBe(3723);
    expect(parseISODuration("PT4M30S")).toBe(270);
    expect(parseISODuration("PT45S")).toBe(45);
    expect(parseISODuration("PT2H")).toBe(7200);
  });
  it("returns 0 for malformed input", () => {
    expect(parseISODuration("garbage")).toBe(0);
  });
});
