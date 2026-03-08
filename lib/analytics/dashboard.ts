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

async function computeMonthTotals(userId: string, monthRef: string) {
  const { start, end } = getMonthDateRange(monthRef);

  const txAgg = await prisma.transaction.aggregate({
    where: { userId, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  const cardAgg = await prisma.transaction.aggregate({
    where: { userId, date: { gte: start, lt: end }, sourceType: "card" },
    _sum: { amount: true },
  });

  const manualAgg = await prisma.transaction.aggregate({
    where: { userId, date: { gte: start, lt: end }, sourceType: "manual" },
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
    // Check if any transaction was updated after snapshot was computed
    const newerTx = await prisma.transaction.findFirst({
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

export async function getMonthlyDashboard(
  userId: string,
  monthRef: string
): Promise<MonthlyDashboardData> {
  const prevMonthRef = getPrevMonthRef(monthRef);
  const { start, end } = getMonthDateRange(monthRef);
  const prevRange = getMonthDateRange(prevMonthRef);

  // Current and previous month totals (parallel)
  const [current, prev] = await Promise.all([
    getOrComputeSnapshot(userId, monthRef),
    getOrComputeSnapshot(userId, prevMonthRef),
  ]);

  // Check if user has any income configured
  const incomeCount = await prisma.income.count({
    where: { userId, isActive: true },
  });
  const hasIncome = incomeCount > 0;

  // Category breakdown: group transactions by parent category
  const txByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  // Previous month by category
  const prevTxByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, date: { gte: prevRange.start, lt: prevRange.end } },
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

  for (const t of txByCategory) {
    const catId = t.categoryId;
    if (!catId) continue;
    const cat = catMap.get(catId);
    if (!cat) continue;

    // Use parent category for grouping, or the category itself if it has no parent
    const parentCat = cat.parent ?? cat;
    const parentId = parentCat.id;

    const existing = parentAgg.get(parentId);
    const amount = toNumber(t._sum.amount);
    const prevAmount = prevByCatMap.get(catId) ?? 0;

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

  // Top 10 expenses
  const topTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { amount: "desc" },
    take: 10,
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
    categoryBreakdown,
    topExpenses,
  };
}
