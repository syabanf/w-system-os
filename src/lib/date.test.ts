import { describe, it, expect } from "vitest";
import {
  DEMO_TODAY,
  DEMO_YEAR,
  demoNow,
  demoNowISO,
  demoDateInput,
  daysFromNow,
} from "@/lib/date";

describe("demo date helpers", () => {
  it("DEMO_TODAY is Monday 18 May 2026", () => {
    expect(DEMO_TODAY.getFullYear()).toBe(2026);
    expect(DEMO_TODAY.getMonth()).toBe(4); // 0-based → May
    expect(DEMO_TODAY.getDate()).toBe(18);
  });

  it("DEMO_YEAR is 2026", () => {
    expect(DEMO_YEAR).toBe(2026);
  });

  it("demoNow() stays pinned to the demo day", () => {
    const d = demoNow();
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(18);
  });

  it("demoDateInput() is the demo day as yyyy-MM-dd", () => {
    expect(demoDateInput()).toBe("2026-05-18");
  });

  it("demoNowISO() encodes a May 2026 timestamp", () => {
    expect(demoNowISO()).toMatch(/^2026-05/);
  });

  it("daysFromNow counts calendar days from DEMO_TODAY", () => {
    expect(daysFromNow("2026-05-18")).toBe(0);
    expect(daysFromNow("2026-05-25")).toBe(7);
    expect(daysFromNow("2026-05-11")).toBe(-7);
  });
});
