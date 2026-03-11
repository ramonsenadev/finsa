import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  total: number;
  percentOfIncome: number | null;
  percentOfTotal: number;
  previousTotal: number | null;
  budgetAmount: number | null;
}

export interface TopExpense {
  id: string;
  date: Date;
  description: string;
  amount: number;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  isRecurring: boolean;
}

export interface CashFlowData {
  /** Total cash outflow: card bills due this month + manual/debit transactions this month */
  totalOutflow: number;
  /** Sum of card bills due this month (based on card closing/due day cycles) */
  cardBills: number;
  /** Manual/debit transactions from the calendar month */
  manualExpenses: number;
  /** Cash balance: income - outflow - investments */
  cashBalance: number;
}

export interface MonthlyDashboardData {
  monthRef: string;
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  totalCard: number;
  totalManual: number;
  freeBalance: number;
  hasIncome: boolean;
  // Previous month for comparison
  prevTotalIncome: number | null;
  prevTotalExpenses: number | null;
  prevTotalInvestments: number | null;
  prevFreeBalance: number | null;
  // Cash flow (null if no cards have billing cycle configured)
  cashFlow: CashFlowData | null;
  // Breakdowns
  categoryBreakdown: CategoryBreakdown[];
  topExpenses: TopExpense[];
}

function toNumber(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : Number(d);
}

function getPrevMonthRef(monthRef: string): string {
  const [year, month] = monthRef.split("-").map(Number);
  const date = new Date(year, month - 2, 1); // month-1 for 0-indexed, -1 for previous
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthDateRange(monthRef: string) {
  const [year, month] = monthRef.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

/**
 * Compute cash flow for a given month.
 *
 * Cash flow = what actually left your bank account in this month:
 * - Card bills due this month (based on closingDay/dueDay cycle)
 * - Manual/debit transactions from the calendar month
 *
 * For a card with closingDay=15, dueDay=10:
 * - Bill due Jan 10 = statement closed Dec 15 = purchases from Nov 16 to Dec 15
 */
async function computeCashFlow(
  userId: string,
  monthRef: string,
  totalIncome: number,
  totalInvestments: number
): Promise<CashFlowData | null> {
  const [year, month] = monthRef.split("-").map(Number);
  const { start, end } = getMonthDateRange(monthRef);

  // Get cards with billing cycle configured
  const cards = await prisma.card.findMany({
    where: { userId, deletedAt: null, closingDay: { not: null }, dueDay: { not: null } },
    select: { id: true, closingDay: true, dueDay: true },
  });

  if (cards.length === 0) return null;

  let cardBills = 0;

  for (const card of cards) {
    const closingDay = card.closingDay!;
    const dueDay = card.dueDay!;

    // Determine the statement closing date for the bill due this month.
    // If dueDay > closingDay, the statement closed in the same month before the due date.
    // If dueDay <= closingDay, the statement closed in the previous month.
    let closingDate: Date;
    if (dueDay > closingDay) {
      // Closes same month as due: e.g., closes on 5th, due on 15th
      closingDate = new Date(year, month - 1, closingDay);
    } else {
      // Closes previous month: e.g., closes on 15th, due on 10th next month
      closingDate = new Date(year, month - 2, closingDay);
    }

    // Statement period: from previous closing + 1 day to this closing date
    const prevClosingDate = new Date(closingDate);
    prevClosingDate.setMonth(prevClosingDate.getMonth() - 1);
    const periodStart = new Date(prevClosingDate);
    periodStart.setDate(periodStart.getDate() + 1);
    const periodEnd = new Date(closingDate);
    periodEnd.setDate(periodEnd.getDate() + 1); // exclusive end

    const agg = await prisma.transaction.aggregate({
      where: {
        userId,
        cardId: card.id,
        date: { gte: periodStart, lt: periodEnd },
        ...PAYMENT_CATEGORY_FILTER,
      },
      _sum: { amount: true },
    });

    cardBills += toNumber(agg._sum.amount);
  }

  // Manual expenses in the calendar month
  const manualAgg = await prisma.transaction.aggregate({
    where: {
      userId,
      date: { gte: start, lt: end },
      sourceType: "manual",
      ...PAYMENT_CATEGORY_FILTER,
    },
    _sum: { amount: true },
  });
  const manualExpenses = toNumber(manualAgg._sum.amount);

  const totalOutflow = cardBills + manualExpenses;
  const cashBalance = totalIncome - totalOutflow - totalInvestments;

  return { totalOutflow, cardBills, manualExpenses, cashBalance };
}

// Bump this whenever snapshot computation logic changes (filters, aggregation rules, etc.)
// All snapshots computed before this date will be recomputed.
const SNAPSHOT_LOGIC_VERSION = new Date("2026-03-10T13:00:00Z");

// Exclude credit card bill payments from expense calculations.
// These are transfers between accounts, not actual expenses.
const PAYMENT_CATEGORY_FILTER = {
  OR: [
    { category: null },
    { category: { name: { not: "Pagamento fatura" } } },
  ],
};

async function computeMonthTotals(userId: string, monthRef: string) {
  const { start, end } = getMonthDateRange(monthRef);

  const txAgg = await prisma.transaction.aggregate({
    where: { userId, date: { gte: start, lt: end }, ...PAYMENT_CATEGORY_FILTER },
    _sum: { amount: true },
  });

  const cardAgg = await prisma.transaction.aggregate({
    where: { userId, date: { gte: start, lt: end }, sourceType: "card", ...PAYMENT_CATEGORY_FILTER },
    _sum: { amount: true },
  });

  const manualAgg = await prisma.transaction.aggregate({
    where: { userId, date: { gte: start, lt: end }, sourceType: "manual", ...PAYMENT_CATEGORY_FILTER },
    _sum: { amount: true },
  });

  // Income: sum of active incomes effective on or before this month
  const incomes = await prisma.income.findMany({
    where: { userId, isActive: true, effectiveFrom: { lt: end } },
  });
  const totalIncome = incomes.reduce((sum, i) => sum + toNumber(i.amount), 0);

  // Investments: sum of active investments effective on or before this month
  const investments = await prisma.investment.findMany({
    where: { userId, isActive: true, effectiveFrom: { lt: end } },
  });
  const totalInvestments = investments.reduce(
    (sum, i) => sum + toNumber(i.amount),
    0
  );

  const totalExpenses = toNumber(txAgg._sum.amount);
  const totalCard = toNumber(cardAgg._sum.amount);
  const totalManual = toNumber(manualAgg._sum.amount);

  return { totalIncome, totalExpenses, totalInvestments, totalCard, totalManual };
}

async function getOrComputeSnapshot(userId: string, monthRef: string) {
  const { start, end } = getMonthDateRange(monthRef);

  // Check if snapshot exists and is still valid
  const existing = await prisma.monthSnapshot.findUnique({
    where: { userId_monthRef: { userId, monthRef } },
  });

  if (existing) {
    // Invalidate if computation logic changed or if data was updated
    const isLogicStale = existing.computedAt < SNAPSHOT_LOGIC_VERSION;
    const newerTx = isLogicStale
      ? { id: "stale" } // force recompute
      : await prisma.transaction.findFirst({
          where: { userId, date: { gte: start, lt: end }, updatedAt: { gt: existing.computedAt } },
          select: { id: true },
        });
    if (!newerTx) {
      return {
        totalIncome: toNumber(existing.totalIncome),
        totalExpenses: toNumber(existing.totalExpenses),
        totalInvestments: toNumber(existing.totalInvestments),
        totalCard: toNumber(existing.totalCard),
        totalManual: toNumber(existing.totalManual),
      };
    }
  }

  // Compute fresh
  const totals = await computeMonthTotals(userId, monthRef);

  // Upsert snapshot
  await prisma.monthSnapshot.upsert({
    where: { userId_monthRef: { userId, monthRef } },
    update: {
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      totalInvestments: totals.totalInvestments,
      totalCard: totals.totalCard,
      totalManual: totals.totalManual,
      computedAt: new Date(),
    },
    create: {
      userId,
      monthRef,
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      totalInvestments: totals.totalInvestments,
      totalCard: totals.totalCard,
      totalManual: totals.totalManual,
    },
  });

  return totals;
}

export type RecurrenceFilter = "all" | "recurring" | "variable";

export async function getMonthlyDashboard(
  userId: string,
  monthRef: string,
  recurrenceFilter: RecurrenceFilter = "all",
  topN: number = 10
): Promise<MonthlyDashboardData> {
  const prevMonthRef = getPrevMonthRef(monthRef);
  const { start, end } = getMonthDateRange(monthRef);
  const prevRange = getMonthDateRange(prevMonthRef);

  // Recurrence where clause (only applied to expense queries, not income/investments)
  const recurrenceWhere =
    recurrenceFilter === "recurring"
      ? { isRecurring: true }
      : recurrenceFilter === "variable"
        ? { isRecurring: false }
        : {};

  // Current and previous month totals (parallel)
  // Snapshots are always "all" — we compute filtered totals separately when needed
  const [snapshot, prev] = await Promise.all([
    getOrComputeSnapshot(userId, monthRef),
    getOrComputeSnapshot(userId, prevMonthRef),
  ]);

  // If filtering, compute filtered expense totals directly
  let current = snapshot;
  if (recurrenceFilter !== "all") {
    const filteredAgg = await prisma.transaction.aggregate({
      where: { userId, date: { gte: start, lt: end }, ...recurrenceWhere, ...PAYMENT_CATEGORY_FILTER },
      _sum: { amount: true },
    });
    const filteredCardAgg = await prisma.transaction.aggregate({
      where: { userId, date: { gte: start, lt: end }, sourceType: "card", ...recurrenceWhere, ...PAYMENT_CATEGORY_FILTER },
      _sum: { amount: true },
    });
    const filteredManualAgg = await prisma.transaction.aggregate({
      where: { userId, date: { gte: start, lt: end }, sourceType: "manual", ...recurrenceWhere, ...PAYMENT_CATEGORY_FILTER },
      _sum: { amount: true },
    });
    current = {
      ...snapshot,
      totalExpenses: toNumber(filteredAgg._sum.amount),
      totalCard: toNumber(filteredCardAgg._sum.amount),
      totalManual: toNumber(filteredManualAgg._sum.amount),
    };
  }

  // Check if user has any income configured
  const incomeCount = await prisma.income.count({
    where: { userId, isActive: true },
  });
  const hasIncome = incomeCount > 0;

  // Category breakdown: group transactions by parent category (excluding payments)
  const txByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, date: { gte: start, lt: end }, ...recurrenceWhere, ...PAYMENT_CATEGORY_FILTER },
    _sum: { amount: true },
  });

  // Previous month by category
  const prevTxByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, date: { gte: prevRange.start, lt: prevRange.end }, ...recurrenceWhere, ...PAYMENT_CATEGORY_FILTER },
    _sum: { amount: true },
  });
  const prevByCatMap = new Map(
    prevTxByCategory.map((t) => [t.categoryId, toNumber(t._sum.amount)])
  );

  // Fetch category details
  const categoryIds = txByCategory
    .map((t) => t.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    include: { parent: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Budgets for this month
  const budgets = await prisma.monthlyBudget.findMany({
    where: { userId, monthRef },
  });
  const budgetMap = new Map(
    budgets.map((b) => [b.categoryId, toNumber(b.amount)])
  );

  // Aggregate by parent category (macro-category)
  const parentAgg = new Map<
    string,
    { name: string; icon: string | null; color: string | null; total: number; budgetAmount: number | null; previousTotal: number | null }
  >();

  const UNCATEGORIZED_KEY = "__uncategorized__";

  for (const t of txByCategory) {
    const catId = t.categoryId;
    const amount = toNumber(t._sum.amount);
    const prevAmount = prevByCatMap.get(catId) ?? 0;

    // Uncategorized transactions
    if (!catId) {
      const existing = parentAgg.get(UNCATEGORIZED_KEY);
      if (existing) {
        existing.total += amount;
        existing.previousTotal = (existing.previousTotal ?? 0) + prevAmount;
      } else {
        parentAgg.set(UNCATEGORIZED_KEY, {
          name: "Sem categoria",
          icon: "CircleDashed",
          color: "#9CA3AF",
          total: amount,
          budgetAmount: null,
          previousTotal: prevAmount || null,
        });
      }
      continue;
    }

    const cat = catMap.get(catId);
    if (!cat) continue;

    // Use parent category for grouping, or the category itself if it has no parent
    const parentCat = cat.parent ?? cat;
    const parentId = parentCat.id;

    const existing = parentAgg.get(parentId);

    if (existing) {
      existing.total += amount;
      existing.previousTotal = (existing.previousTotal ?? 0) + prevAmount;
    } else {
      parentAgg.set(parentId, {
        name: parentCat.name,
        icon: parentCat.icon,
        color: parentCat.color,
        total: amount,
        budgetAmount: budgetMap.get(parentId) ?? null,
        previousTotal: prevAmount || null,
      });
    }
  }

  const categoryBreakdown: CategoryBreakdown[] = Array.from(parentAgg.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      total: data.total,
      percentOfIncome: hasIncome && current.totalIncome > 0
        ? (data.total / current.totalIncome) * 100
        : null,
      percentOfTotal: current.totalExpenses > 0
        ? (data.total / current.totalExpenses) * 100
        : 0,
      previousTotal: data.previousTotal,
      budgetAmount: data.budgetAmount,
    }))
    .sort((a, b) => b.total - a.total);

  // Top 10 expenses (excluding payments)
  const topTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end }, ...recurrenceWhere, ...PAYMENT_CATEGORY_FILTER },
    orderBy: { amount: "desc" },
    take: topN,
    include: { category: true },
  });

  const topExpenses: TopExpense[] = topTransactions.map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: toNumber(t.amount),
    categoryName: t.category?.name ?? null,
    categoryIcon: t.category?.icon ?? null,
    categoryColor: t.category?.color ?? null,
    isRecurring: t.isRecurring,
  }));

  const freeBalance = current.totalIncome - current.totalExpenses - current.totalInvestments;
  const prevFreeBalance =
    prev.totalIncome > 0 || prev.totalExpenses > 0
      ? prev.totalIncome - prev.totalExpenses - prev.totalInvestments
      : null;

  // Check if prev month has any data
  const hasPrevData = prev.totalExpenses > 0 || prev.totalIncome > 0;

  // Cash flow (only if cards have billing cycles configured)
  const cashFlow = await computeCashFlow(
    userId,
    monthRef,
    current.totalIncome,
    current.totalInvestments
  );

  return {
    monthRef,
    totalIncome: current.totalIncome,
    totalExpenses: current.totalExpenses,
    totalInvestments: current.totalInvestments,
    totalCard: current.totalCard,
    totalManual: current.totalManual,
    freeBalance,
    hasIncome,
    prevTotalIncome: hasPrevData ? prev.totalIncome : null,
    prevTotalExpenses: hasPrevData ? prev.totalExpenses : null,
    prevTotalInvestments: hasPrevData ? prev.totalInvestments : null,
    prevFreeBalance: hasPrevData ? prevFreeBalance : null,
    cashFlow,
    categoryBreakdown,
    topExpenses,
  };
}
