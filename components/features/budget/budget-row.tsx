"use client";

import { useState, useRef } from "react";

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
  if (!hasBudget) return "bg-gray-200";
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
    <div className="grid grid-cols-[1fr_140px_180px_1fr] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
      {/* Category name */}
      <div className="flex items-center gap-2">
        {category.icon && <span className="text-base">{category.icon}</span>}
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: category.color || "#d1d5db" }}
        />
        <span className="text-sm font-medium">{category.name}</span>
      </div>

      {/* Budget input */}
      <div>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground-secondary">
            R$
          </span>
          <input
            type="number"
            min="0"
            step="100"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            placeholder="0"
            className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-2 text-right text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
          />
        </div>
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
        <div className="h-2 flex-1 rounded-full bg-gray-100">
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
