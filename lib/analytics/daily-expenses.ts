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
  isWeekend: boolean;
  breakdown: DayCategoryBreakdown[];
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

export async function getDailyExpenses(
  userId: string,
  monthRef: string
): Promise<DailyExpenseSummary> {
  const [year, month] = monthRef.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Fetch all transactions for the month with category info
  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: {
      date: true,
      amount: true,
      categoryId: true,
      category: { select: { id: true, name: true, parentId: true, parent: { select: { id: true, name: true } } } },
    },
  });

  // Group by day
  const dayMap = new Map<number, { total: number; catMap: Map<string, { name: string; amount: number }> }>();

  for (const tx of transactions) {
    const day = tx.date.getDate();
    const amount = toNumber(tx.amount);

    if (!dayMap.has(day)) {
      dayMap.set(day, { total: 0, catMap: new Map() });
    }
    const entry = dayMap.get(day)!;
    entry.total += amount;

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

    days.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
      total: entry?.total ?? 0,
      isWeekend,
      breakdown,
    });
  }

  // Calculate averages
  const weekdays = days.filter((d) => !d.isWeekend);
  const weekends = days.filter((d) => d.isWeekend);
  const weekdayAvg = weekdays.length > 0 ? weekdays.reduce((s, d) => s + d.total, 0) / weekdays.length : 0;
  const weekendAvg = weekends.length > 0 ? weekends.reduce((s, d) => s + d.total, 0) / weekends.length : 0;
  const weekendDeltaPercent = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

  // Categories that contribute most to the weekend vs weekday delta
  const catWeekday = new Map<string, { name: string; total: number; count: number }>();
  const catWeekend = new Map<string, { name: string; total: number; count: number }>();

  for (const day of days) {
    const target = day.isWeekend ? catWeekend : catWeekday;
    for (const b of day.breakdown) {
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
