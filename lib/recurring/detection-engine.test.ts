import { describe, it, expect } from "vitest";
import { normalizeTitle } from "./detection-engine";

// ─── Pure helpers (extracted for testing) ──────────────────────────

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

interface SimpleTx {
  title: string;
  amount: number;
  month: string; // YYYY-MM
}

/**
 * Simulates the core detection logic without DB access.
 * Groups transactions by normalized title, checks 3+ months and
 * value variance within tolerance.
 */
function detectFromTransactions(
  transactions: SimpleTx[],
  tolerancePercent: number,
  existingNames: Set<string> = new Set(),
  dismissedTitles: Set<string> = new Set()
): {
  title: string;
  normalizedTitle: string;
  averageAmount: number;
  frequency: number;
  months: string[];
}[] {
  const toleranceFraction = tolerancePercent / 100;

  interface TxGroup {
    title: string;
    amounts: number[];
    months: Set<string>;
  }

  const groups = new Map<string, TxGroup>();

  for (const tx of transactions) {
    const normalized = normalizeTitle(tx.title);
    if (existingNames.has(normalized) || dismissedTitles.has(normalized)) {
      continue;
    }
    const amount = Math.abs(tx.amount);
    if (amount === 0) continue;

    const existing = groups.get(normalized);
    if (existing) {
      existing.amounts.push(amount);
      existing.months.add(tx.month);
    } else {
      groups.set(normalized, {
        title: tx.title,
        amounts: [amount],
        months: new Set([tx.month]),
      });
    }
  }

  const candidates: {
    title: string;
    normalizedTitle: string;
    averageAmount: number;
    frequency: number;
    months: string[];
  }[] = [];

  for (const [normalized, group] of groups) {
    if (group.months.size < 3) continue;

    const mean =
      group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;
    const stdDev = standardDeviation(group.amounts);

    if (mean > 0 && stdDev / mean > toleranceFraction) continue;

    candidates.push({
      title: group.title,
      normalizedTitle: normalized,
      averageAmount: Math.round(mean * 100) / 100,
      frequency: group.months.size,
      months: Array.from(group.months).sort(),
    });
  }

  return candidates;
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("normalizeTitle", () => {
  it("lowercases and trims", () => {
    expect(normalizeTitle("  Netflix.Com  ")).toBe("netflix.com");
  });

  it("removes asterisks", () => {
    expect(normalizeTitle("IFD*IFOOD CLUB")).toBe("ifdifood club");
  });

  it("collapses whitespace", () => {
    expect(normalizeTitle("NU   SEGURO  VIDA")).toBe("nu seguro vida");
  });
});

describe("detectFromTransactions", () => {
  it("detects Netflix.Com appearing in 4 months with same value", () => {
    const transactions: SimpleTx[] = [
      { title: "Netflix.Com", amount: 55.9, month: "2025-10" },
      { title: "Netflix.Com", amount: 55.9, month: "2025-11" },
      { title: "Netflix.Com", amount: 55.9, month: "2025-12" },
      { title: "Netflix.Com", amount: 55.9, month: "2026-01" },
    ];

    const result = detectFromTransactions(transactions, 10);

    expect(result).toHaveLength(1);
    expect(result[0].normalizedTitle).toBe("netflix.com");
    expect(result[0].averageAmount).toBe(55.9);
    expect(result[0].frequency).toBe(4);
    expect(result[0].months).toEqual([
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
  });

  it("does NOT detect supermarket with values varying 50%", () => {
    // G Barbosa with values: 150, 280, 95, 320 — huge variation
    const transactions: SimpleTx[] = [
      { title: "G Barbosa", amount: 150, month: "2025-10" },
      { title: "G Barbosa", amount: 280, month: "2025-11" },
      { title: "G Barbosa", amount: 95, month: "2025-12" },
      { title: "G Barbosa", amount: 320, month: "2026-01" },
    ];

    const result = detectFromTransactions(transactions, 10);

    expect(result).toHaveLength(0);
  });

  it("detects Totalpass appearing in 3 months with 5% variation", () => {
    // Mean ~99.67, stddev ~4.5 → ~4.5% variation (within 10%)
    const transactions: SimpleTx[] = [
      { title: "TOTALPASS", amount: 99.9, month: "2025-10" },
      { title: "TOTALPASS", amount: 104.5, month: "2025-11" },
      { title: "TOTALPASS", amount: 94.6, month: "2025-12" },
    ];

    const result = detectFromTransactions(transactions, 10);

    expect(result).toHaveLength(1);
    expect(result[0].normalizedTitle).toBe("totalpass");
    expect(result[0].frequency).toBe(3);
  });

  it("does NOT detect transactions with only 2 months", () => {
    const transactions: SimpleTx[] = [
      { title: "Spotify", amount: 21.9, month: "2025-11" },
      { title: "Spotify", amount: 21.9, month: "2025-12" },
    ];

    const result = detectFromTransactions(transactions, 10);

    expect(result).toHaveLength(0);
  });

  it("excludes existing recurring names", () => {
    const transactions: SimpleTx[] = [
      { title: "Netflix.Com", amount: 55.9, month: "2025-10" },
      { title: "Netflix.Com", amount: 55.9, month: "2025-11" },
      { title: "Netflix.Com", amount: 55.9, month: "2025-12" },
    ];

    const existing = new Set(["netflix.com"]);
    const result = detectFromTransactions(transactions, 10, existing);

    expect(result).toHaveLength(0);
  });

  it("excludes dismissed titles", () => {
    const transactions: SimpleTx[] = [
      { title: "Netflix.Com", amount: 55.9, month: "2025-10" },
      { title: "Netflix.Com", amount: 55.9, month: "2025-11" },
      { title: "Netflix.Com", amount: 55.9, month: "2025-12" },
    ];

    const dismissed = new Set(["netflix.com"]);
    const result = detectFromTransactions(
      transactions,
      10,
      new Set(),
      dismissed
    );

    expect(result).toHaveLength(0);
  });

  it("respects custom tolerance", () => {
    // Values with ~15% variation
    const transactions: SimpleTx[] = [
      { title: "NuTag Pedagio", amount: 100, month: "2025-10" },
      { title: "NuTag Pedagio", amount: 120, month: "2025-11" },
      { title: "NuTag Pedagio", amount: 80, month: "2025-12" },
    ];

    // With 10% tolerance: should NOT detect (stddev/mean ~16%)
    const result10 = detectFromTransactions(transactions, 10);
    expect(result10).toHaveLength(0);

    // With 20% tolerance: should detect
    const result20 = detectFromTransactions(transactions, 20);
    expect(result20).toHaveLength(1);
  });

  it("handles multiple transactions in same month correctly", () => {
    const transactions: SimpleTx[] = [
      { title: "Netflix.Com", amount: 55.9, month: "2025-10" },
      { title: "Netflix.Com", amount: 55.9, month: "2025-10" }, // duplicate month
      { title: "Netflix.Com", amount: 55.9, month: "2025-11" },
      { title: "Netflix.Com", amount: 55.9, month: "2025-12" },
    ];

    const result = detectFromTransactions(transactions, 10);

    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(3); // 3 distinct months
  });

  it("skips zero-amount transactions", () => {
    const transactions: SimpleTx[] = [
      { title: "Skipped", amount: 0, month: "2025-10" },
      { title: "Skipped", amount: 0, month: "2025-11" },
      { title: "Skipped", amount: 0, month: "2025-12" },
    ];

    const result = detectFromTransactions(transactions, 10);

    expect(result).toHaveLength(0);
  });
});
