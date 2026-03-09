import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

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

// ─── Types ───────────────────────────────────────────────────────────

export interface CardMonthlyEvolution {
  monthRef: string;
  label: string; // "jan", "fev", etc.
  total: number;
}

export interface CardMonthlySummary {
  total: number;
  average: number;
  maxExpense: {
    description: string;
    amount: number;
    date: Date;
  } | null;
}

export interface CardCategoryBreakdown {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  total: number;
  percent: number;
}

export interface CardImportRecord {
  id: string;
  fileName: string;
  importedAt: Date;
  monthRef: string;
  txCount: number;
  autoCategorizedCount: number;
}

export interface CardTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  isRecurring: boolean;
  installmentCurrent: number | null;
  installmentTotal: number | null;
}

export interface CardTransactionsResult {
  transactions: CardTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Queries ─────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/**
 * Monthly spending evolution for a card (last 12 months with data).
 */
export async function getCardMonthlyEvolution(
  userId: string,
  cardId: string,
  months: number = 12
): Promise<CardMonthlyEvolution[]> {
  // Generate last N month refs
  const now = new Date();
  const monthRefs: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthRefs.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  const firstRange = getMonthDateRange(monthRefs[0]);
  const lastRange = getMonthDateRange(monthRefs[monthRefs.length - 1]);

  const results = await prisma.transaction.groupBy({
    by: ["date"],
    where: {
      userId,
      cardId,
      date: { gte: firstRange.start, lt: lastRange.end },
    },
    _sum: { amount: true },
  });

  // Aggregate by month
  const monthTotals = new Map<string, number>();
  for (const r of results) {
    const d = new Date(r.date);
    const ref = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthTotals.set(ref, (monthTotals.get(ref) ?? 0) + toNumber(r._sum.amount));
  }

  return monthRefs
    .map((ref) => {
      const month = parseInt(ref.split("-")[1], 10);
      return {
        monthRef: ref,
        label: MONTH_LABELS[month - 1],
        total: monthTotals.get(ref) ?? 0,
      };
    })
    .filter((m) => m.total > 0 || monthRefs.indexOf(m.monthRef) >= monthRefs.length - 6);
}

/**
 * Summary for the selected month: total, average, and max expense.
 */
export async function getCardMonthlySummary(
  userId: string,
  cardId: string,
  monthRef: string
): Promise<CardMonthlySummary> {
  const { start, end } = getMonthDateRange(monthRef);

  const [agg, maxTx, allMonthTotals] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, cardId, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.findFirst({
      where: { userId, cardId, date: { gte: start, lt: end } },
      orderBy: { amount: "desc" },
      select: { description: true, amount: true, date: true },
    }),
    // For average: get all months with data
    prisma.transaction.groupBy({
      by: ["date"],
      where: { userId, cardId },
      _sum: { amount: true },
    }),
  ]);

  // Compute monthly averages
  const monthMap = new Map<string, number>();
  for (const r of allMonthTotals) {
    const d = new Date(r.date);
    const ref = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(ref, (monthMap.get(ref) ?? 0) + toNumber(r._sum.amount));
  }
  const monthValues = Array.from(monthMap.values());
  const average = monthValues.length > 0
    ? monthValues.reduce((a, b) => a + b, 0) / monthValues.length
    : 0;

  return {
    total: toNumber(agg._sum.amount),
    average,
    maxExpense: maxTx
      ? {
          description: maxTx.description,
          amount: toNumber(maxTx.amount),
          date: maxTx.date,
        }
      : null,
  };
}

/**
 * Top 5 categories for a card in a given month.
 */
export async function getCardCategoryBreakdown(
  userId: string,
  cardId: string,
  monthRef: string
): Promise<CardCategoryBreakdown[]> {
  const { start, end } = getMonthDateRange(monthRef);

  const groups = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, cardId, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  const categoryIds = groups
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    include: { parent: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Aggregate by parent category
  const parentAgg = new Map<
    string,
    { name: string; icon: string | null; color: string | null; total: number }
  >();

  for (const g of groups) {
    if (!g.categoryId) continue;
    const cat = catMap.get(g.categoryId);
    if (!cat) continue;
    const parentCat = cat.parent ?? cat;
    const existing = parentAgg.get(parentCat.id);
    const amount = toNumber(g._sum.amount);

    if (existing) {
      existing.total += amount;
    } else {
      parentAgg.set(parentCat.id, {
        name: parentCat.name,
        icon: parentCat.icon,
        color: parentCat.color,
        total: amount,
      });
    }
  }

  const sorted = Array.from(parentAgg.entries())
    .map(([categoryId, data]) => ({ categoryId, ...data }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = sorted.reduce((s, c) => s + c.total, 0);

  return sorted.slice(0, 5).map((c) => ({
    ...c,
    percent: grandTotal > 0 ? (c.total / grandTotal) * 100 : 0,
  }));
}

/**
 * Import history for a card.
 */
export async function getCardImports(
  userId: string,
  cardId: string
): Promise<CardImportRecord[]> {
  const imports = await prisma.import.findMany({
    where: { userId, cardId },
    orderBy: { importedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      importedAt: true,
      monthRef: true,
      txCount: true,
      autoCategorizedCount: true,
    },
  });

  return imports;
}

/**
 * Paginated, filterable transactions for a card.
 */
export async function getCardTransactions(
  userId: string,
  cardId: string,
  options: {
    monthRef?: string;
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
    isRecurring?: boolean;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<CardTransactionsResult> {
  const { monthRef, categoryId, minAmount, maxAmount, isRecurring, page = 1, pageSize = 20 } = options;

  const where: Record<string, unknown> = { userId, cardId };

  if (monthRef) {
    const { start, end } = getMonthDateRange(monthRef);
    where.date = { gte: start, lt: end };
  }
  if (categoryId) where.categoryId = categoryId;
  if (isRecurring !== undefined) where.isRecurring = isRecurring;

  // Amount range filter
  if (minAmount !== undefined || maxAmount !== undefined) {
    const amountFilter: Record<string, number> = {};
    if (minAmount !== undefined) amountFilter.gte = minAmount;
    if (maxAmount !== undefined) amountFilter.lte = maxAmount;
    where.amount = amountFilter;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: { include: { parent: true } } },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((t) => {
      const cat = t.category;
      const parentCat = cat?.parent;
      return {
        id: t.id,
        date: t.date,
        description: t.description,
        amount: toNumber(t.amount),
        categoryId: t.categoryId,
        categoryName: parentCat ? `${parentCat.name} › ${cat!.name}` : (cat?.name ?? null),
        categoryIcon: (parentCat ?? cat)?.icon ?? null,
        categoryColor: (parentCat ?? cat)?.color ?? null,
        isRecurring: t.isRecurring,
        installmentCurrent: t.installmentCurrent,
        installmentTotal: t.installmentTotal,
      };
    }),
    total,
    page,
    pageSize,
  };
}

/**
 * Get available months for a card (for filter dropdowns).
 */
export async function getCardAvailableMonths(
  userId: string,
  cardId: string
): Promise<string[]> {
  const transactions = await prisma.transaction.findMany({
    where: { userId, cardId },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
  });

  const months = new Set<string>();
  for (const t of transactions) {
    const d = new Date(t.date);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return Array.from(months).sort().reverse();
}
