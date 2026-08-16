import { describe, it, expect } from "vitest";
import { parseRetentionResponse } from "./ytdata";

describe("parseRetentionResponse", () => {
  const sample = {
    columnHeaders: [
      { name: "elapsedVideoTimeRatio" },
      { name: "audienceWatchRatio" },
      { name: "relativeRetentionPerformance" },
    ],
    rows: [
      [0, 1.0, 0.5],
      [0.5, 0.6, 0.55],
      [1.0, 0.3, 0.4],
    ],
  };

  it("maps ratios and watch ratios into 0-100 and sorts by elapsed time", () => {
    const { points, relative } = parseRetentionResponse(sample);
    expect(points.map((p) => p.ratio)).toEqual([0, 50, 100]);
    expect(points.map((p) => p.watchRatio)).toEqual([100, 60, 30]);
    expect(relative).toBeCloseTo(0.48, 2);
  });

  it("is robust to column reordering (reads by header name)", () => {
    const reordered = {
      columnHeaders: [
        { name: "audienceWatchRatio" },
        { name: "elapsedVideoTimeRatio" },
      ],
      rows: [
        [0.9, 0.25],
        [1.0, 0.0],
      ],
    };
    const { points } = parseRetentionResponse(reordered);
    expect(points[0]).toMatchObject({ ratio: 0, watchRatio: 100 });
    expect(points[1]).toMatchObject({ ratio: 25, watchRatio: 90 });
  });

  it("returns an empty curve for malformed/empty payloads", () => {
    expect(parseRetentionResponse({}).points).toEqual([]);
    expect(parseRetentionResponse({ columnHeaders: [], rows: [] }).points).toEqual([]);
    expect(parseRetentionResponse({ rows: [[0, 1]] }).points).toEqual([]);
  });
});
