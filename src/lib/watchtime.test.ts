import { describe, it, expect } from "vitest";
import {
  totalWatchMinutes,
  totalWatchHours,
  progress,
  projectedCompletion,
  buildScenarios,
  requiredRate,
  watchHoursPerWeek,
} from "./watchtime";

describe("watch-time math", () => {
  it("computes total watch minutes and hours (spec example)", () => {
    // 100,000 views × 4.5 min = 450,000 min = 7,500 hours
    expect(totalWatchMinutes(100_000, 4.5)).toBe(450_000);
    expect(totalWatchHours(100_000, 4.5)).toBe(7_500);
  });

  it("guards against negative inputs", () => {
    expect(totalWatchMinutes(-5, 4)).toBe(0);
    expect(totalWatchHours(100, -1)).toBe(0);
  });

  it("computes progress with clamping", () => {
    const p = progress(1847, 4000);
    expect(p.remaining).toBe(2153);
    expect(p.percent).toBeCloseTo(46.175, 2);

    const over = progress(5000, 4000);
    expect(over.remaining).toBe(0);
    expect(over.percent).toBe(100);
  });

  it("derives weekly rate from total hours over days", () => {
    expect(watchHoursPerWeek(300, 30)).toBe(70); // 10/day * 7
  });
});

describe("projections", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");

  it("projects a completion date from a daily rate", () => {
    const res = projectedCompletion(100, 10, from);
    expect(res).not.toBeNull();
    expect(res!.daysRemaining).toBe(10);
    expect(res!.date.toISOString().slice(0, 10)).toBe("2026-01-11");
  });

  it("returns null when the rate is zero or negative", () => {
    expect(projectedCompletion(100, 0, from)).toBeNull();
    expect(projectedCompletion(100, -3, from)).toBeNull();
  });

  it("builds conservative/realistic/aggressive scenarios that scale correctly", () => {
    const s = buildScenarios(1000, 20, from);
    const [cons, real, aggr] = s;
    expect(cons.hoursPerDay).toBe(10);
    expect(real.hoursPerDay).toBe(20);
    expect(aggr.hoursPerDay).toBe(40);
    // Aggressive finishes on or before realistic, which finishes on or before conservative.
    expect(aggr.daysRemaining).toBeLessThanOrEqual(real.daysRemaining);
    expect(real.daysRemaining).toBeLessThanOrEqual(cons.daysRemaining);
  });

  it("computes required daily/weekly rate for a deadline", () => {
    const r = requiredRate(1400, 100);
    expect(r.daily).toBe(14);
    expect(r.weekly).toBe(98);
  });
});
