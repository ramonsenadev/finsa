"use client";

import { useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { RecategorizePopover } from "@/components/features/transactions/recategorize-popover";
import type { CategoryItem } from "@/components/features/transactions/category-selector";
import type { CardTransactionsResult } from "@/lib/analytics/card-detail";

interface CardTransactionsListProps {
  result: CardTransactionsResult | null;
  categories: CategoryItem[];
  filters: {
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
    isRecurring?: boolean;
  };
  onFiltersChange: (filters: CardTransactionsListProps["filters"]) => void;
  page: number;
  onPageChange: (page: number) => void;
  onRecategorized: () => void;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(date));
}

export function CardTransactionsList({
  result,
  categories,
  filters,
  onFiltersChange,
  page,
  onPageChange,
  onRecategorized,
}: CardTransactionsListProps) {
  const [minAmountInput, setMinAmountInput] = useState("");
  const [maxAmountInput, setMaxAmountInput] = useState("");

  const transactions = result?.transactions ?? [];
  const total = result?.total ?? 0;
  const pageSize = result?.pageSize ?? 20;
  const totalPages = Math.ceil(total / pageSize);

  function handleCategoryFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    onFiltersChange({ ...filters, categoryId: val || undefined });
  }

  function handleRecurringFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    onFiltersChange({
      ...filters,
      isRecurring: val === "" ? undefined : val === "true",
    });
  }

  function handleAmountFilter() {
    onFiltersChange({
      ...filters,
      minAmount: minAmountInput ? parseFloat(minAmountInput) : undefined,
      maxAmount: maxAmountInput ? parseFloat(maxAmountInput) : undefined,
    });
  }

  // Build unique parent categories for filter
  const parentCategories = categories.filter((c) => c.parentId === null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Transações
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-foreground-secondary">
              ({total})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-foreground-secondary">
              Categoria
            </label>
            <select
              value={filters.categoryId ?? ""}
              onChange={handleCategoryFilter}
              className="rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs dark:bg-input/30"
            >
              <option value="">Todas</option>
              {parentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-foreground-secondary">
              Recorrente
            </label>
            <select
              value={filters.isRecurring === undefined ? "" : String(filters.isRecurring)}
              onChange={handleRecurringFilter}
              className="rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs dark:bg-input/30"
            >
              <option value="">Todos</option>
              <option value="true">Recorrentes</option>
              <option value="false">Variáveis</option>
            </select>
          </div>

          <div className="flex items-end gap-1.5">
            <div>
              <label className="mb-1 block text-xs text-foreground-secondary">
                Valor mín.
              </label>
              <CurrencyInput
                value={minAmountInput}
                onValueChange={setMinAmountInput}
                showPrefix={false}
                placeholder="Mín"
                className="h-8 w-24 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground-secondary">
                Valor máx.
              </label>
              <CurrencyInput
                value={maxAmountInput}
                onValueChange={setMaxAmountInput}
                showPrefix={false}
                placeholder="Máx"
                className="h-8 w-24 text-sm"
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleAmountFilter}>
              Filtrar
            </Button>
          </div>
        </div>

        {/* Table */}
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-secondary">
            Nenhuma transação encontrada.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-foreground-secondary whitespace-nowrap">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{tx.description}</span>
                      {tx.installmentTotal && tx.installmentTotal > 1 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tx.installmentCurrent}/{tx.installmentTotal}
                        </Badge>
                      )}
                      {tx.isRecurring && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full bg-recurring/10 px-1.5 py-0.5 text-[10px] font-medium text-recurring"
                          title="Recorrente"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <RecategorizePopover
                      transactionId={tx.id}
                      currentCategoryId={tx.categoryId}
                      currentCategoryName={tx.categoryName}
                      categories={categories}
                      onComplete={onRecategorized}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatBRL(tx.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-foreground-secondary">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
