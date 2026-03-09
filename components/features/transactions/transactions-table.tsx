"use client";

import { RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { RecategorizePopover } from "@/components/features/transactions/recategorize-popover";
import type { CategoryItem } from "@/components/features/transactions/category-selector";
import type { TransactionRow } from "@/lib/analytics/transactions";

interface TransactionsTableProps {
  transactions: TransactionRow[];
  total: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
  categories: CategoryItem[];
  onSortChange: (sortBy: string, sortDir: "asc" | "desc") => void;
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

function methodBadge(method: string | null) {
  if (!method) return null;
  const labels: Record<string, { text: string; className: string }> = {
    rule: { text: "R", className: "bg-accent/10 text-accent" },
    ai: { text: "IA", className: "bg-warning/10 text-warning" },
    manual: { text: "M", className: "bg-success/10 text-success" },
  };
  const info = labels[method];
  if (!info) return null;
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[10px] font-semibold ${info.className}`}
      title={method === "rule" ? "Regra" : method === "ai" ? "IA" : "Manual"}
    >
      {info.text}
    </span>
  );
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  onSort: (field: string, dir: "asc" | "desc") => void;
  className?: string;
}) {
  const isActive = currentSort === field;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => {
          if (isActive) {
            onSort(field, currentDir === "asc" ? "desc" : "asc");
          } else {
            onSort(field, field === "date" ? "desc" : "asc");
          }
        }}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function TransactionsTable({
  transactions,
  total,
  totalAmount,
  page,
  pageSize,
  sortBy,
  sortDir,
  categories,
  onSortChange,
  onPageChange,
  onRecategorized,
}: TransactionsTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg bg-background-secondary px-4 py-2.5">
        <p className="text-sm text-foreground-secondary">
          Mostrando{" "}
          <span className="font-medium text-foreground">{total}</span>{" "}
          transações
        </p>
        <p className="text-sm">
          Total:{" "}
          <span className="font-semibold text-foreground">
            {formatBRL(totalAmount)}
          </span>
        </p>
      </div>

      {/* Table */}
      {transactions.length === 0 ? (
        <p className="py-12 text-center text-sm text-foreground-secondary">
          Nenhuma transação encontrada.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="Data"
                field="date"
                currentSort={sortBy}
                currentDir={sortDir}
                onSort={onSortChange}
              />
              <SortableHeader
                label="Descrição"
                field="description"
                currentSort={sortBy}
                currentDir={sortDir}
                onSort={onSortChange}
              />
              <TableHead>Cartão</TableHead>
              <TableHead>Categoria</TableHead>
              <SortableHeader
                label="Valor"
                field="amount"
                currentSort={sortBy}
                currentDir={sortDir}
                onSort={onSortChange}
                className="text-right"
              />
              <TableHead className="w-10">Cat.</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const catDisplay = tx.parentCategoryName
                ? `${tx.parentCategoryName} › ${tx.categoryName}`
                : tx.categoryName;

              return (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap text-foreground-secondary">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{tx.description}</span>
                      {tx.installmentTotal && tx.installmentTotal > 1 && (
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {tx.installmentCurrent}/{tx.installmentTotal}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tx.cardName && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-xs"
                        style={
                          tx.cardColor
                            ? {
                                borderColor: tx.cardColor + "40",
                                backgroundColor: tx.cardColor + "10",
                                color: tx.cardColor,
                              }
                            : undefined
                        }
                      >
                        {tx.cardColor && (
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: tx.cardColor }}
                          />
                        )}
                        {tx.cardName}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <RecategorizePopover
                      transactionId={tx.id}
                      currentCategoryId={tx.categoryId}
                      currentCategoryName={catDisplay}
                      categories={categories}
                      onComplete={onRecategorized}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium">
                    {formatBRL(tx.amount)}
                  </TableCell>
                  <TableCell>{methodBadge(tx.categorizationMethod)}</TableCell>
                  <TableCell>
                    {tx.isRecurring && (
                      <span
                        className="inline-flex items-center rounded-full bg-recurring/10 p-1"
                        title="Recorrente"
                      >
                        <RefreshCw className="h-3 w-3 text-recurring" />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
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
            {/* Page number buttons (show up to 5) */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={pageNum === page ? "default" : "outline"}
                  onClick={() => onPageChange(pageNum)}
                  className="min-w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
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
    </div>
  );
}
