import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export interface DayCategoryBreakdown {
  categoryId: string;
  name: string;
  amount: number;
}

export interface DailyExpense {
  date: string; // YYYY-MM-DD
  day: number;
  total: number;
  variableTotal: number; // excludes recurring — used for weekday/weekend averages
  isWeekend: boolean;
  breakdown: DayCategoryBreakdown[];
  varBreakdown: { name: string; amount: number }[]; // variable-only, for delta analysis
}

export interface DailyExpenseSummary {
  days: DailyExpense[];
  weekdayAvg: number;
  weekendAvg: number;
  weekendDeltaPercent: number;
  deltaCategories: { name: string; delta: number }[];
}

function toNumber(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : Number(d);
}

import type { RecurrenceFilter } from "./dashboard";

export async function getDailyExpenses(
  userId: string,
  monthRef: string,
  recurrenceFilter: RecurrenceFilter = "all"
): Promise<DailyExpenseSummary> {
  const [year, month] = monthRef.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const recurrenceWhere =
    recurrenceFilter === "recurring"
      ? { isRecurring: true }
      : recurrenceFilter === "variable"
        ? { isRecurring: false }
        : {};

  // Fetch all transactions for the month with category info (excluding bill payments)
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lt: end },
      ...recurrenceWhere,
      OR: [
        { category: null },
        { category: { name: { not: "Pagamento fatura" } } },
      ],
    },
    select: {
      date: true,
      amount: true,
      isRecurring: true,
      categoryId: true,
      category: { select: { id: true, name: true, parentId: true, parent: { select: { id: true, name: true } } } },
    },
  });

  // Group by day — track total (for chart) and variable-only (for averages)
  type DayEntry = {
    total: number;
    variableTotal: number;
    catMap: Map<string, { name: string; amount: number }>;
    varCatMap: Map<string, { name: string; amount: number }>;
  };
  const dayMap = new Map<number, DayEntry>();

  for (const tx of transactions) {
    const day = tx.date.getDate();
    const amount = toNumber(tx.amount);

    if (!dayMap.has(day)) {
      dayMap.set(day, { total: 0, variableTotal: 0, catMap: new Map(), varCatMap: new Map() });
    }
    const entry = dayMap.get(day)!;
    entry.total += amount;
    if (!tx.isRecurring) {
      entry.variableTotal += amount;
    }

    // Use parent category for grouping
    const cat = tx.category;
    if (cat) {
      const catId = cat.parent?.id ?? cat.id;
      const catName = cat.parent?.name ?? cat.name;
      const existing = entry.catMap.get(catId);
      if (existing) {
        existing.amount += amount;
      } else {
        entry.catMap.set(catId, { name: catName, amount });
      }
      // Variable-only category breakdown for delta analysis
      if (!tx.isRecurring) {
        const varExisting = entry.varCatMap.get(catId);
        if (varExisting) {
          varExisting.amount += amount;
        } else {
          entry.varCatMap.set(catId, { name: catName, amount });
        }
      }
    }
  }

  // Build days array for all days in month
  const days: DailyExpense[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const entry = dayMap.get(d);

    const breakdown = entry
      ? Array.from(entry.catMap.values())
          .map((c) => ({ categoryId: c.name, name: c.name, amount: c.amount }))
          .sort((a, b) => b.amount - a.amount)
      : [];

    const varBreakdown = entry
      ? Array.from(entry.varCatMap.values())
          .map((c) => ({ name: c.name, amount: c.amount }))
          .sort((a, b) => b.amount - a.amount)
      : [];

    days.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      total: entry?.total ?? 0,
      variableTotal: entry?.variableTotal ?? 0,
      isWeekend,
      breakdown,
      varBreakdown,
    });
  }

  // Calculate averages using only variable (non-recurring) spending.
  // Recurring expenses (Netflix, rent, etc.) that happen to fall on weekends
  // shouldn't inflate the weekend average — it's meant to show discretionary patterns.
  const weekdays = days.filter((d) => !d.isWeekend);
  const weekends = days.filter((d) => d.isWeekend);
  const weekdayAvg = weekdays.length > 0 ? weekdays.reduce((s, d) => s + d.variableTotal, 0) / weekdays.length : 0;
  const weekendAvg = weekends.length > 0 ? weekends.reduce((s, d) => s + d.variableTotal, 0) / weekends.length : 0;
  const weekendDeltaPercent = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

  // Categories that contribute most to the weekend vs weekday delta (variable only)
  const catWeekday = new Map<string, { name: string; total: number; count: number }>();
  const catWeekend = new Map<string, { name: string; total: number; count: number }>();

  for (const day of days) {
    const target = day.isWeekend ? catWeekend : catWeekday;
    for (const b of day.varBreakdown) {
      const existing = target.get(b.name);
      if (existing) {
        existing.total += b.amount;
      } else {
        target.set(b.name, { name: b.name, total: b.amount, count: 1 });
      }
    }
  }

  // Compute average per-day spend per category, then delta
  const allCatNames = new Set([...catWeekday.keys(), ...catWeekend.keys()]);
  const weekdayCount = weekdays.length || 1;
  const weekendCount = weekends.length || 1;

  const deltaCategories = Array.from(allCatNames)
    .map((name) => {
      const wdAvg = (catWeekday.get(name)?.total ?? 0) / weekdayCount;
      const weAvg = (catWeekend.get(name)?.total ?? 0) / weekendCount;
      return { name, delta: weAvg - wdAvg };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  return { days, weekdayAvg, weekendAvg, weekendDeltaPercent, deltaCategories };
}
