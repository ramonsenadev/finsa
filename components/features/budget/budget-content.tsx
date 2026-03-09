"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { upsertBudget, copyBudgetFromPreviousMonth } from "@/app/budget/actions";
import { BudgetRow } from "./budget-row";

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  budgetAmount: number;
  spentAmount: number;
}

interface BudgetContentProps {
  monthRef: string;
  categories: CategoryRow[];
  totalBudget: number;
  totalSpent: number;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function navigateMonth(monthRef: string, delta: number) {
  const [year, month] = monthRef.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthRef: string) {
  const [year, month] = monthRef.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function BudgetContent({
  monthRef,
  categories,
  totalBudget,
  totalSpent,
}: BudgetContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const totalBalance = totalBudget - totalSpent;

  function goToMonth(newMonth: string) {
    router.push(`/budget?month=${newMonth}`);
  }

  async function handleCopyPrevious() {
    setCopyMessage(null);
    const result = await copyBudgetFromPreviousMonth(monthRef);
    if ("error" in result) {
      setCopyMessage(result.error as string);
    } else {
      setCopyMessage(`${result.count} orçamentos copiados com sucesso.`);
    }
  }

  async function handleBudgetChange(categoryId: string, amount: number) {
    startTransition(async () => {
      await upsertBudget({ categoryId, monthRef, amount });
    });
  }

  const balanceColor =
    totalBalance >= 0 ? "text-success" : "text-error";

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToMonth(navigateMonth(monthRef, -1))}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-[160px] text-center text-base font-medium capitalize">
            {formatMonthLabel(monthRef)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToMonth(navigateMonth(monthRef, 1))}
          >
            <ChevronRight />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={handleCopyPrevious}>
          Copiar do mês anterior
        </Button>
      </div>

      {copyMessage && (
        <p className="text-sm text-foreground-secondary">{copyMessage}</p>
      )}

      {/* Summary card */}
      <div className="rounded-md border border-border bg-background-secondary p-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div>
            <span className="text-foreground-secondary">Orçamento Total</span>
            <p className="text-lg font-semibold">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-foreground-secondary">Gasto Total</span>
            <p className="text-lg font-semibold">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-foreground-secondary">Saldo</span>
            <p className={`text-lg font-semibold ${balanceColor}`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget list */}
      {totalBudget === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-secondary">
            <PiggyBank className="h-7 w-7 text-foreground-secondary" />
          </div>
          <p className="mt-4 text-base font-medium text-foreground">
            Nenhum orçamento definido
          </p>
          <p className="mt-1 max-w-sm text-center text-sm text-foreground-secondary">
            Defina limites por categoria para acompanhar seus gastos. Clique em qualquer categoria abaixo para começar.
          </p>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-md border border-border">
        <div className="grid min-w-[600px] grid-cols-[1fr_140px_180px_1fr] gap-4 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-foreground-secondary">
          <span>Categoria</span>
          <span>Orçamento</span>
          <span>Gasto Atual</span>
          <span>Progresso</span>
        </div>
        {categories.map((cat) => (
          <BudgetRow
            key={cat.id}
            category={cat}
            onBudgetChange={handleBudgetChange}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4l-4 4 4 4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}
