import type { InstallmentType } from "@/domain/entities/ProjectTermin";

export interface SchemeProposal {
  installmentNo: number;
  percentage: number;
  installmentType: InstallmentType;
}

const HW_SW = /HW\s*-\s*SW/i;

// Standard term labels for an N-installment scheme — picks sensible defaults.
const DEFAULT_TYPES: Record<number, InstallmentType[]> = {
  1: ["Final"],
  2: ["DP", "Final"],
  3: ["DP", "UAT", "BAST"],
  4: ["DP", "Pekerjaan 50%", "UAT", "BAST"],
  5: [
    "Pekerjaan 25%",
    "Pekerjaan 50%",
    "Pekerjaan 75%",
    "Pekerjaan 100%/Go live",
    "2 Bulan setelah Go live",
  ],
};

/**
 * Parses a payment-scheme string and returns an ordered list of installment
 * proposals — count, percentage, and a sensible default installment type.
 *
 * Accepts shapes like:
 *   "1x (100)"
 *   "2x (50-50)"
 *   "2x (70-30)"
 *   "3x (50-30-20)"
 *   "4x (40-30-20-10)"
 *   "5x (20-25-25-25-5)"
 *   "2x (HW - SW)"  → percentages default to 40/60 and types are HW/SW
 *
 * Returns null when the scheme can't be parsed.
 */
export function parsePaymentScheme(raw: string): SchemeProposal[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Match "Nx (...)"
  const m = trimmed.match(/^(\d+)\s*x\s*\(([^)]+)\)/i);
  if (!m) return null;

  const count = Number(m[1]);
  if (!Number.isFinite(count) || count <= 0) return null;
  const inner = m[2].trim();

  // Hardware / Manpower flavour — common for procurement-style projects.
  if (HW_SW.test(inner) && count === 2) {
    return [
      { installmentNo: 1, percentage: 40, installmentType: "Procurement Hardware" },
      { installmentNo: 2, percentage: 60, installmentType: "Manpower Services" },
    ];
  }

  // Try to extract numeric percentages "70-30", "20-25-25-25-5", "100"
  const parts = inner
    .split(/[-/]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => Number(p))
    .filter((n) => Number.isFinite(n));

  let percentages: number[];
  if (parts.length === count) {
    percentages = parts;
  } else {
    // Fall back to even split.
    const even = Math.floor(100 / count);
    percentages = Array.from({ length: count }, (_, i) =>
      i === count - 1 ? 100 - even * (count - 1) : even,
    );
  }

  const types =
    DEFAULT_TYPES[count] ??
    Array.from({ length: count }, () => "Final" as InstallmentType);

  return percentages.map((pct, i) => ({
    installmentNo: i + 1,
    percentage: pct,
    installmentType: types[i] ?? "Final",
  }));
}

export function applySchemeToAmount(total: number, schemes: SchemeProposal[]): number[] {
  // Allocate amounts so they sum exactly to the total (rounding goes to last).
  const amounts = schemes.map((s) => Math.round((s.percentage / 100) * total));
  const drift = total - amounts.reduce((s, n) => s + n, 0);
  if (drift !== 0 && amounts.length > 0) {
    amounts[amounts.length - 1] += drift;
  }
  return amounts;
}
