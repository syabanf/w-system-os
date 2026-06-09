import { describe, it, expect } from "vitest";
import { formatIDR, formatIDRCompact, formatPercent } from "@/lib/currency";

describe("formatPercent", () => {
  it("formats whole percents", () => {
    expect(formatPercent(85)).toBe("85%");
    expect(formatPercent(0)).toBe("0%");
  });
  it("respects fraction digits", () => {
    expect(formatPercent(85.456, 1)).toBe("85.5%");
    expect(formatPercent(12, 2)).toBe("12.00%");
  });
});

describe("IDR formatters", () => {
  it("formatIDR returns a Rupiah string", () => {
    const out = formatIDR(1_500_000);
    expect(out).toContain("Rp");
    expect(out).toMatch(/\d/);
  });
  it("formatIDRCompact compacts large amounts", () => {
    const out = formatIDRCompact(2_000_000_000);
    expect(out).toContain("Rp");
    expect(out.length).toBeLessThan(formatIDR(2_000_000_000).length);
  });
});
