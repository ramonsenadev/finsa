import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export interface InvestmentMonthPoint {
  monthRef: string;
  label: string; // "jan", "fev", etc.
  amount: number;
  percentOfIncome: number | null;
}

export interface InvestmentCategoryBreakdown {
  category: string;
  label: string;
  amount: number;
  percent: number;
}

export interface InvestmentEvolutionData {
  // Current month summary
  currentTotal: number;
  percentOfIncome: number | null;
  prevTotal: number | null;
  deltaPercent: number | null;
  hasIncome: boolean;
  // Evolution over months
  months: InvestmentMonthPoint[];
  // Breakdown by type
  breakdown: InvestmentCategoryBreakdown[];
  // Target (if any monthly budget for investments exists)
  targetPercent: number | null;
}

function toNumber(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : Number(d);
}

const MONTH_LABELS: Record<number, string> = {
  1: "jan",
  2: "fev",
  3: "mar",
  4: "abr",
  5: "mai",
  6: "jun",
  7: "jul",
  8: "ago",
  9: "set",
  10: "out",
  11: "nov",
  12: "dez",
};

const CATEGORY_LABELS: Record<string, string> = {
  renda_fixa: "Renda Fixa",
  renda_variavel: "Renda Variável",
  previdencia: "Previdência",
  outro: "Outro",
};

function generateMonthRange(endMonth: string, count: number): string[] {
  const [year, month] = endMonth.split("-").map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return months;
}

function getMonthEnd(monthRef: string): Date {
  const [year, month] = monthRef.split("-").map(Number);
  return new Date(year, month, 1);
}

export async function getInvestmentEvolution(
  userId: string,
  currentMonthRef: string,
  monthCount: number = 6
): Promise<InvestmentEvolutionData> {
  const monthRange = generateMonthRange(currentMonthRef, monthCount);

  // Fetch all active investments for the user
  const investments = await prisma.investment.findMany({
    where: { userId, isActive: true },
  });

  // Fetch all active incomes for the user
  const incomes = await prisma.income.findMany({
    where: { userId, isActive: true },
  });

  // Build month-by-month data
  const months: InvestmentMonthPoint[] = monthRange.map((monthRef) => {
    const end = getMonthEnd(monthRef);
    const monthNum = parseInt(monthRef.split("-")[1]);

    // Sum investments effective before end of this month
    const monthInvestments = investments.filter(
      (inv) => inv.effectiveFrom < end
    );
    const amount = monthInvestments.reduce(
      (sum, inv) => sum + toNumber(inv.amount),
      0
    );

    // Sum incomes effective before end of this month
    const monthIncomes = incomes.filter((inc) => inc.effectiveFrom < end);
    const totalIncome = monthIncomes.reduce(
      (sum, inc) => sum + toNumber(inc.amount),
      0
    );

    const percentOfIncome =
      totalIncome > 0 ? (amount / totalIncome) * 100 : null;

    return {
      monthRef,
      label: MONTH_LABELS[monthNum],
      amount,
      percentOfIncome,
    };
  });

  // Current month
  const currentEnd = getMonthEnd(currentMonthRef);
  const currentInvestments = investments.filter(
    (inv) => inv.effectiveFrom < currentEnd
  );
  const currentTotal = currentInvestments.reduce(
    (sum, inv) => sum + toNumber(inv.amount),
    0
  );

  const currentIncomes = incomes.filter(
    (inc) => inc.effectiveFrom < currentEnd
  );
  const totalIncome = currentIncomes.reduce(
    (sum, inc) => sum + toNumber(inc.amount),
    0
  );
  const hasIncome = incomes.length > 0;
  const percentOfIncome =
    totalIncome > 0 ? (currentTotal / totalIncome) * 100 : null;

  // Previous month
  const prevMonthRef = months.length >= 2 ? months[months.length - 2] : null;
  const prevTotal = prevMonthRef ? prevMonthRef.amount : null;
  const deltaPercent =
    prevTotal != null && prevTotal > 0
      ? ((currentTotal - prevTotal) / prevTotal) * 100
      : null;

  // Breakdown by category (current month)
  const categoryTotals = new Map<string, number>();
  for (const inv of currentInvestments) {
    const cat = inv.category;
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + toNumber(inv.amount));
  }

  const breakdown: InvestmentCategoryBreakdown[] = Array.from(
    categoryTotals.entries()
  )
    .map(([category, amount]) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      amount,
      percent: currentTotal > 0 ? (amount / currentTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    currentTotal,
    percentOfIncome,
    prevTotal,
    deltaPercent,
    hasIncome,
    months,
    breakdown,
    targetPercent: null, // Could be extended with a user-defined target
  };
}
