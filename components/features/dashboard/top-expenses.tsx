"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import type { TopExpense } from "@/lib/analytics/dashboard";

interface TopExpensesProps {
  data: TopExpense[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
}

export function TopExpenses({ data }: TopExpensesProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-foreground-secondary">
        Nenhuma transação neste período.
      </p>
    );
  }

  return (
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
        {data.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="text-foreground-secondary">
              {formatDate(tx.date)}
            </TableCell>
            <TableCell>
              <span className="font-medium">{tx.description}</span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {tx.categoryColor && (
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: tx.categoryColor }}
                  />
                )}
                {tx.categoryIcon && (
                  <span className="text-sm">{tx.categoryIcon}</span>
                )}
                <span className="text-foreground-secondary">
                  {tx.categoryName ?? "Sem categoria"}
                </span>
                {tx.isRecurring && (
                  <Badge
                    variant="secondary"
                    className="bg-recurring/10 text-recurring text-[10px]"
                  >
                    Recorrente
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatBRL(tx.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
