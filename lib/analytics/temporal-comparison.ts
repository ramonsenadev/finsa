import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// ── Types ──────────────────────────────────────────────────────────────

export interface MonthCategoryData {
  monthRef: string;
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  total: number;
}

export interface ComparisonCategory {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  firstMonth: number;
  lastMonth: number;
  deltaAbsolute: number;
  deltaPercent: number | null; // null when firstMonth is 0
  average: number;
  trend: "up" | "down" | "stable";
  monthlyValues: { monthRef: string; total: number }[];
  subcategories: ComparisonCategory[];
}

export interface TemporalComparisonData {
  startMonth: string;
  endMonth: string;
  months: string[];
  /** Chart series: one entry per parent category, with monthly totals */
  series: {
    categoryId: string;
    name: string;
    color: string | null;
    data: { monthRef: string; total: number }[];
    growthPercent: number | null;
  }[];
  /** Variation table rows (parent categories with subcategories) */
  categories: ComparisonCategory[];
}

// ── Helpers ────────────────────────────────────────────────────────────

function toNumber(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : Number(d);
}

function getMonthDateRange(monthRef: string) {
  const [year, month] = monthRef.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

/** Generate array of YYYY-MM strings between start and end (inclusive) */
function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  const [sy, sm] = startMonth.split("-").map(Number);
  const [ey, em] = endMonth.split("-").map(Number);

  let y = sy;
  let m = sm;

  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return months;
}

function computeTrend(first: number, last: number): "up" | "down" | "stable" {
  if (first === 0 && last === 0) return "stable";
  if (first === 0) return "up";
  const delta = ((last - first) / first) * 100;
  if (delta > 5) return "up";
  if (delta < -5) return "down";
  return "stable";
}

function computeDeltaPercent(first: number, last: number): number | null {
  if (first === 0) return last > 0 ? null : null;
  return ((last - first) / first) * 100;
}

// ── Main Query ─────────────────────────────────────────────────────────

export async function getTemporalComparison(
  userId: string,
  startMonth: string,
  endMonth: string,
): Promise<TemporalComparisonData> {
  const months = generateMonthRange(startMonth, endMonth);
  if (months.length === 0) {
    return { startMonth, endMonth, months: [], series: [], categories: [] };
  }

  const { start } = getMonthDateRange(months[0]);
  const { end } = getMonthDateRange(months[months.length - 1]);

  // Fetch all transactions in the range grouped by month+category
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
      categoryId: { not: null },
    },
    select: {
      date: true,
      amount: true,
      categoryId: true,
    },
  });

  // Get all relevant categories with parent info
  const categoryIds = [
    ...new Set(transactions.map((t) => t.categoryId!).filter(Boolean)),
  ];

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    include: { parent: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Aggregate by monthRef + parent category
  const parentAgg = new Map<
    string, // "monthRef|parentId"
    { total: number; name: string; icon: string | null; color: string | null }
  >();
  // Also aggregate by monthRef + subcategory (for expandable rows)
  const subAgg = new Map<
    string, // "monthRef|subcategoryId"
    {
      total: number;
      name: string;
      icon: string | null;
      color: string | null;
      parentId: string;
    }
  >();

  for (const tx of transactions) {
    const catId = tx.categoryId!;
    const cat = catMap.get(catId);
    if (!cat) continue;

    const monthRef = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    const parentCat = cat.parent ?? cat;
    const parentId = parentCat.id;
    const amount = toNumber(tx.amount);

    // Parent aggregation
    const parentKey = `${monthRef}|${parentId}`;
    const existing = parentAgg.get(parentKey);
    if (existing) {
      existing.total += amount;
    } else {
      parentAgg.set(parentKey, {
        total: amount,
        name: parentCat.name,
        icon: parentCat.icon,
        color: parentCat.color,
      });
    }

    // Subcategory aggregation (only if cat has a parent)
    if (cat.parentId) {
      const subKey = `${monthRef}|${catId}`;
      const existingSub = subAgg.get(subKey);
      if (existingSub) {
        existingSub.total += amount;
      } else {
        subAgg.set(subKey, {
          total: amount,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          parentId,
        });
      }
    }
  }

  // Collect unique parent category IDs
  const parentIds = new Set<string>();
  for (const key of parentAgg.keys()) {
    parentIds.add(key.split("|")[1]);
  }

  // Build series for chart
  const series = Array.from(parentIds).map((parentId) => {
    const data = months.map((m) => {
      const key = `${m}|${parentId}`;
      return { monthRef: m, total: parentAgg.get(key)?.total ?? 0 };
    });

    const info = [...parentAgg.values()].find(
      (_, i) => [...parentAgg.keys()][i].endsWith(`|${parentId}`),
    );

    const first = data[0].total;
    const last = data[data.length - 1].total;
    const growthPercent = computeDeltaPercent(first, last);

    return {
      categoryId: parentId,
      name: info?.name ?? "Sem categoria",
      color: info?.color ?? null,
      data,
      growthPercent,
    };
  });

  // Sort series by total descending
  series.sort(
    (a, b) =>
      b.data.reduce((s, d) => s + d.total, 0) -
      a.data.reduce((s, d) => s + d.total, 0),
  );

  // Build variation table
  const comparisonCategories: ComparisonCategory[] = Array.from(parentIds).map(
    (parentId) => {
      const monthlyValues = months.map((m) => ({
        monthRef: m,
        total: parentAgg.get(`${m}|${parentId}`)?.total ?? 0,
      }));

      const first = monthlyValues[0].total;
      const last = monthlyValues[monthlyValues.length - 1].total;
      const average =
        monthlyValues.reduce((s, v) => s + v.total, 0) / monthlyValues.length;

      const info = [...parentAgg.entries()].find(([k]) =>
        k.endsWith(`|${parentId}`),
      )?.[1];

      // Subcategories
      const subCatIds = new Set<string>();
      for (const key of subAgg.keys()) {
        const [, subId] = key.split("|");
        const subData = subAgg.get(key);
        if (subData?.parentId === parentId) {
          subCatIds.add(subId);
        }
      }

      const subcategories: ComparisonCategory[] = Array.from(subCatIds).map(
        (subId) => {
          const subMonthly = months.map((m) => ({
            monthRef: m,
            total: subAgg.get(`${m}|${subId}`)?.total ?? 0,
          }));

          const subFirst = subMonthly[0].total;
          const subLast = subMonthly[subMonthly.length - 1].total;
          const subAvg =
            subMonthly.reduce((s, v) => s + v.total, 0) / subMonthly.length;
          const subInfo = [...subAgg.entries()].find(([k]) =>
            k.endsWith(`|${subId}`),
          )?.[1];

          return {
            categoryId: subId,
            name: subInfo?.name ?? "",
            icon: subInfo?.icon ?? null,
            color: subInfo?.color ?? null,
            firstMonth: subFirst,
            lastMonth: subLast,
            deltaAbsolute: subLast - subFirst,
            deltaPercent: computeDeltaPercent(subFirst, subLast),
            average: subAvg,
            trend: computeTrend(subFirst, subLast),
            monthlyValues: subMonthly,
            subcategories: [],
          };
        },
      );

      subcategories.sort(
        (a, b) =>
          Math.abs(b.deltaPercent ?? 0) - Math.abs(a.deltaPercent ?? 0),
      );

      return {
        categoryId: parentId,
        name: info?.name ?? "",
        icon: info?.icon ?? null,
        color: info?.color ?? null,
        firstMonth: first,
        lastMonth: last,
        deltaAbsolute: last - first,
        deltaPercent: computeDeltaPercent(first, last),
        average,
        trend: computeTrend(first, last),
        monthlyValues,
        subcategories,
      };
    },
  );

  // Sort by delta% descending (nulls at end)
  comparisonCategories.sort((a, b) => {
    const aP = a.deltaPercent ?? -Infinity;
    const bP = b.deltaPercent ?? -Infinity;
    return bP - aP;
  });

  return {
    startMonth,
    endMonth,
    months,
    series,
    categories: comparisonCategories,
  };
}
