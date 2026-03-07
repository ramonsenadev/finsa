import { prisma } from "@/lib/db";
import { BudgetContent } from "@/components/features/budget/budget-content";

interface BudgetPageProps {
  searchParams: Promise<{ month?: string }>;
}

function getCurrentMonthRef() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  const params = await searchParams;
  const monthRef = params.month || getCurrentMonthRef();

  const [year, month] = monthRef.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: { children: true },
  });

  const budgets = await prisma.monthlyBudget.findMany({
    where: { monthRef },
  });

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      categoryId: { not: null },
    },
    include: { category: true },
  });

  // Aggregate spending by parent category
  const spendingByCategory = new Map<string, number>();

  for (const tx of transactions) {
    if (!tx.category) continue;
    const parentId = tx.category.parentId || tx.category.id;
    const current = spendingByCategory.get(parentId) || 0;
    spendingByCategory.set(parentId, current + Math.abs(Number(tx.amount)));
  }

  const budgetMap = new Map(budgets.map((b) => [b.categoryId, Number(b.amount)]));

  const categoryRows = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    budgetAmount: budgetMap.get(cat.id) || 0,
    spentAmount: spendingByCategory.get(cat.id) || 0,
  }));

  const totalBudget = categoryRows.reduce((sum, c) => sum + c.budgetAmount, 0);
  const totalSpent = categoryRows.reduce((sum, c) => sum + c.spentAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Orçamento</h1>
        <p className="mt-1 text-foreground-secondary">
          Defina limites mensais por categoria e acompanhe seus gastos.
        </p>
      </div>

      <BudgetContent
        monthRef={monthRef}
        categories={categoryRows}
        totalBudget={totalBudget}
        totalSpent={totalSpent}
      />
    </div>
  );
}
