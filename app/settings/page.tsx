import { prisma } from "@/lib/db";
import { SettingsContent } from "@/components/features/settings/settings-content";

export default async function SettingsPage() {
  const incomes = await prisma.income.findMany({
    orderBy: { createdAt: "desc" },
  });

  const investments = await prisma.investment.findMany({
    orderBy: { createdAt: "desc" },
  });

  const incomeRows = incomes.map((i) => ({
    id: i.id,
    name: i.name,
    amount: Number(i.amount),
    type: i.type,
    isActive: i.isActive,
    effectiveFrom: i.effectiveFrom.toISOString().slice(0, 10),
  }));

  const investmentRows = investments.map((i) => ({
    id: i.id,
    name: i.name,
    amount: Number(i.amount),
    category: i.category,
    isActive: i.isActive,
    effectiveFrom: i.effectiveFrom.toISOString().slice(0, 10),
  }));

  const totalIncome = incomeRows
    .filter((i) => i.isActive)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="mt-1 text-foreground-secondary">
          Renda, investimentos, formatos CSV e preferências.
        </p>
      </div>

      <SettingsContent
        incomes={incomeRows}
        investments={investmentRows}
        totalIncome={totalIncome}
      />
    </div>
  );
}
