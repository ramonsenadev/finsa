"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CardImportRecord } from "@/lib/analytics/card-detail";

interface CardImportsHistoryProps {
  imports: CardImportRecord[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatMonthRef(monthRef: string) {
  const [y, m] = monthRef.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function CardImportsHistory({ imports }: CardImportsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de Imports</CardTitle>
      </CardHeader>
      <CardContent>
        {imports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-8 w-8 text-foreground-secondary mb-2" />
            <p className="text-sm text-foreground-secondary">
              Nenhum import realizado para este cartão.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Mês Ref.</TableHead>
                <TableHead className="text-right">Transações</TableHead>
                <TableHead className="text-right">Auto-categorizadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((imp) => (
                <TableRow key={imp.id}>
                  <TableCell className="text-foreground-secondary">
                    {formatDate(imp.importedAt)}
                  </TableCell>
                  <TableCell className="font-medium">{imp.fileName}</TableCell>
                  <TableCell className="capitalize text-foreground-secondary">
                    {formatMonthRef(imp.monthRef)}
                  </TableCell>
                  <TableCell className="text-right">{imp.txCount}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-foreground">{imp.autoCategorizedCount}</span>
                    <span className="text-foreground-secondary">
                      {" "}/ {imp.txCount}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
