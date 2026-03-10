"use client";

import { useState, useRef } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { getIconComponent } from "@/components/features/categories/icon-picker";

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  budgetAmount: number;
  spentAmount: number;
}

interface BudgetRowProps {
  category: CategoryRow;
  onBudgetChange: (categoryId: string, amount: number) => void;
  isPending: boolean;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getProgressColor(percentage: number, hasBudget: boolean) {
  if (!hasBudget) return "bg-muted-foreground/30";
  if (percentage > 100) return "bg-error";
  if (percentage >= 80) return "bg-warning";
  return "bg-success";
}

export function BudgetRow({ category, onBudgetChange, isPending }: BudgetRowProps) {
  const [inputValue, setInputValue] = useState(
    category.budgetAmount > 0 ? String(category.budgetAmount) : ""
  );
  const lastSavedRef = useRef(category.budgetAmount);

  const hasBudget = category.budgetAmount > 0;
  const percentage = hasBudget
    ? Math.round((category.spentAmount / category.budgetAmount) * 100)
    : 0;
  const barWidth = hasBudget ? Math.min(percentage, 100) : 0;
  const progressColor = getProgressColor(percentage, hasBudget);

  function handleSave() {
    const numValue = parseFloat(inputValue) || 0;
    if (numValue !== lastSavedRef.current) {
      lastSavedRef.current = numValue;
      onBudgetChange(category.id, numValue);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div className="grid grid-cols-[1fr_140px_180px_1fr] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 transition-colors hover:bg-muted/50">
      {/* Category name */}
      <div className="flex items-center gap-2">
        {category.icon && (() => {
          const Icon = getIconComponent(category.icon);
          return <Icon size={16} style={{ color: category.color || undefined }} className={category.color ? undefined : "text-foreground-secondary"} />;
        })()}
        <span className="text-sm font-medium">{category.name}</span>
      </div>

      {/* Budget input */}
      <div>
        <CurrencyInput
          value={inputValue}
          onValueChange={setInputValue}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className="h-8 text-sm"
        />
      </div>

      {/* Spent */}
      <div className="text-sm text-foreground-secondary">
        {hasBudget ? (
          <>
            {formatCurrency(category.spentAmount)}{" "}
            <span className="text-xs">de {formatCurrency(category.budgetAmount)}</span>
          </>
        ) : (
          <span className="text-xs">{formatCurrency(category.spentAmount)}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        {hasBudget && (
          <span
            className={`min-w-[40px] text-right text-xs font-medium ${
              percentage > 100
                ? "text-error"
                : percentage >= 80
                  ? "text-warning"
                  : "text-foreground-secondary"
            }`}
          >
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}
