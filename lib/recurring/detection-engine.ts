import { prisma } from "@/lib/db";

// ─── Types ─────────────────────────────────────────────────────────

export interface RecurrenceCandidate {
  title: string;
  normalizedTitle: string;
  averageAmount: number;
  frequency: number; // number of distinct months
  months: string[]; // "YYYY-MM" list
  confidence: number; // 0–1
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
  sourceType: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[*]/g, "");
}

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (val && typeof val === "object" && "toNumber" in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ─── Tolerance ─────────────────────────────────────────────────────

const DEFAULT_TOLERANCE = 10; // percent
const PREF_KEY = "recurring_tolerance";

export async function getRecurringTolerance(userId: string): Promise<number> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId_key: { userId, key: PREF_KEY } },
  });
  if (pref) {
    const val = parseInt(pref.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 100) return val;
  }
  return DEFAULT_TOLERANCE;
}

export async function setRecurringTolerance(
  userId: string,
  tolerance: number
): Promise<void> {
  await prisma.userPreference.upsert({
    where: { userId_key: { userId, key: PREF_KEY } },
    update: { value: String(tolerance) },
    create: { userId, key: PREF_KEY, value: String(tolerance) },
  });
}

// ─── Detection Engine ──────────────────────────────────────────────

const MIN_MONTHS = 3;

export async function detectRecurringPatterns(
  userId: string
): Promise<RecurrenceCandidate[]> {
  const tolerance = await getRecurringTolerance(userId);
  const toleranceFraction = tolerance / 100;

  // 1. Fetch all transactions (card-sourced primarily, but include all)
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    select: {
      description: true,
      originalTitle: true,
      amount: true,
      date: true,
      categoryId: true,
      sourceType: true,
    },
    orderBy: { date: "asc" },
  });

  // 2. Get existing RecurringExpense names (normalized) to exclude
  const existingRecurring = await prisma.recurringExpense.findMany({
    where: { userId },
    select: { name: true },
  });
  const existingNames = new Set(
    existingRecurring.map((r) => normalizeTitle(r.name))
  );

  // 3. Get dismissed titles to exclude
  const dismissed = await prisma.dismissedRecurring.findMany({
    where: { userId },
    select: { normalizedTitle: true },
  });
  const dismissedTitles = new Set(dismissed.map((d) => d.normalizedTitle));

  // 4. Group transactions by normalized title
  interface TxGroup {
    title: string; // original (first seen)
    amounts: number[];
    months: Set<string>;
    categoryId: string | null;
    sourceType: string;
  }

  const groups = new Map<string, TxGroup>();

  for (const tx of transactions) {
    const rawTitle = tx.originalTitle ?? tx.description;
    const normalized = normalizeTitle(rawTitle);

    // Skip already existing or dismissed
    if (existingNames.has(normalized) || dismissedTitles.has(normalized)) {
      continue;
    }

    const amount = Math.abs(toNumber(tx.amount));
    if (amount === 0) continue;

    const monthKey = getMonthKey(tx.date);

    const existing = groups.get(normalized);
    if (existing) {
      existing.amounts.push(amount);
      existing.months.add(monthKey);
      // Use most common categoryId (keep first non-null)
      if (!existing.categoryId && tx.categoryId) {
        existing.categoryId = tx.categoryId;
      }
    } else {
      groups.set(normalized, {
        title: rawTitle,
        amounts: [amount],
        months: new Set([monthKey]),
        categoryId: tx.categoryId,
        sourceType: tx.sourceType,
      });
    }
  }

  // 5. Filter: 3+ distinct months and value variance within tolerance
  const candidates: RecurrenceCandidate[] = [];

  for (const [normalized, group] of groups) {
    if (group.months.size < MIN_MONTHS) continue;

    const mean =
      group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;
    const stdDev = standardDeviation(group.amounts);

    // Check if std dev is within tolerance of the mean
    if (mean > 0 && stdDev / mean > toleranceFraction) continue;

    // Calculate confidence based on consistency and frequency
    const variationScore = mean > 0 ? 1 - stdDev / mean : 1;
    const frequencyScore = Math.min(group.months.size / 6, 1); // max at 6 months
    const confidence = Math.round(variationScore * frequencyScore * 100) / 100;

    const sortedMonths = Array.from(group.months).sort();

    candidates.push({
      title: group.title,
      normalizedTitle: normalized,
      averageAmount: Math.round(mean * 100) / 100,
      frequency: group.months.size,
      months: sortedMonths,
      confidence,
      suggestedCategoryId: group.categoryId,
      suggestedCategoryName: null, // resolved later
      sourceType: group.sourceType,
    });
  }

  // 6. Resolve category names
  if (candidates.length > 0) {
    const categoryIds = [
      ...new Set(
        candidates
          .map((c) => c.suggestedCategoryId)
          .filter((id): id is string => id !== null)
      ),
    ];

    if (categoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: {
          id: true,
          name: true,
          parent: { select: { name: true } },
        },
      });

      const categoryMap = new Map(
        categories.map((c) => [
          c.id,
          c.parent ? `${c.parent.name} › ${c.name}` : c.name,
        ])
      );

      for (const candidate of candidates) {
        if (candidate.suggestedCategoryId) {
          candidate.suggestedCategoryName =
            categoryMap.get(candidate.suggestedCategoryId) ?? null;
        }
      }
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  return candidates;
}
