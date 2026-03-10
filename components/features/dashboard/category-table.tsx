"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import { getIconComponent } from "@/components/features/categories/icon-picker";
import type { CategoryBreakdown } from "@/lib/analytics/dashboard";

interface CategoryTableProps {
  data: CategoryBreakdown[];
}

export function CategoryTable({ data }: CategoryTableProps) {
  if (data.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Categoria</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-right">% Renda</TableHead>
          <TableHead className="text-right">% Total</TableHead>
          <TableHead className="text-right">vs. Mês Anterior</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((cat) => {
          const delta =
            cat.previousTotal != null && cat.previousTotal > 0
              ? ((cat.total - cat.previousTotal) / cat.previousTotal) * 100
              : null;

          return (
            <TableRow key={cat.categoryId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {cat.icon && (() => {
                    const Icon = getIconComponent(cat.icon);
                    return <Icon className="h-4 w-4" style={{ color: cat.color ?? undefined }} />;
                  })()}
                  <span className="font-medium">{cat.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatBRL(cat.total)}
              </TableCell>
              <TableCell className="text-right text-foreground-secondary">
                {cat.percentOfIncome != null
                  ? `${cat.percentOfIncome.toFixed(1)}%`
                  : "—"}
              </TableCell>
              <TableCell className="text-right text-foreground-secondary">
                {cat.percentOfTotal.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right">
                {delta != null ? (
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      delta > 0 ? "text-error" : "text-success"
                    }`}
                  >
                    {delta > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-xs text-foreground-secondary">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
