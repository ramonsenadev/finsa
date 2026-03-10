"use client";

import { useState } from "react";
import {
  FileText,
  Calendar,
  ArrowLeftRight,
  AlertTriangle,
  Tag,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParseResultData } from "./import-wizard";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function StepPreview({
  data,
  isLoading,
  onConfirm,
  onBack,
}: {
  data: ParseResultData;
  isLoading: boolean;
  onConfirm: (skipDuplicates: boolean) => void;
  onBack: () => void;
}) {
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const expenses = data.transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const credits = data.transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const importableCount = skipDuplicates
    ? data.transactions.filter((t) => !t.isDuplicate).length
    : data.transactions.length;

  return (
    <div className="space-y-6">
      {/* Format mismatch warning */}
      {data.formatMismatch && (
        <div className="flex items-start gap-3 rounded-md bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <p className="font-medium text-warning">Formato diferente detectado</p>
            <p className="mt-0.5 text-foreground-secondary">
              O CSV não corresponde ao formato do cartão. Foi usado auto-detecção.
              Verifique o preview abaixo.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          icon={<FileText className="size-4" />}
          label="Transações"
          value={String(data.stats.parsed)}
        />
        <SummaryCard
          icon={<ArrowLeftRight className="size-4" />}
          label="Gastos / Créditos"
          value={`${formatCurrency(expenses)} / ${formatCurrency(Math.abs(credits))}`}
        />
        <SummaryCard
          icon={<Calendar className="size-4" />}
          label="Período"
          value={
            data.stats.dateRange
              ? `${formatDate(data.stats.dateRange.from)} → ${formatDate(data.stats.dateRange.to)}`
              : "—"
          }
        />
        <SummaryCard
          icon={<Tag className="size-4" />}
          label="Categorização"
          value={`${data.categorization.byRules} regras, ${data.categorization.manual} manual`}
        />
      </div>

      {/* Duplicate control */}
      {data.duplicateCount > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-warning/10 px-4 py-3">
          <Checkbox
            id="skip-duplicates"
            checked={skipDuplicates}
            onCheckedChange={(checked) => setSkipDuplicates(checked === true)}
          />
          <label htmlFor="skip-duplicates" className="text-sm cursor-pointer">
            Ignorar {data.duplicateCount} duplicata{data.duplicateCount > 1 ? "s" : ""} encontrada{data.duplicateCount > 1 ? "s" : ""}
          </label>
        </div>
      )}

      {/* Transaction preview table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px] text-right">Valor</TableHead>
              <TableHead className="w-[150px]">Categoria</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.transactions.slice(0, 20).map((tx, i) => (
              <TableRow
                key={i}
                className={tx.isDuplicate ? "opacity-60" : ""}
              >
                <TableCell className="text-foreground-secondary">
                  {formatDate(tx.date)}
                </TableCell>
                <TableCell>
                  <div>
                    <span>{tx.description}</span>
                    {tx.installmentCurrent && tx.installmentTotal && (
                      <span className="ml-2 text-xs text-foreground-secondary">
                        {tx.installmentCurrent}/{tx.installmentTotal}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    tx.amount < 0 ? "text-success" : ""
                  }`}
                >
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell>
                  {tx.categorization ? (
                    <Badge variant="secondary" className="text-xs">
                      {tx.categorization.categoryName}
                    </Badge>
                  ) : (
                    <span className="text-xs text-foreground-secondary">
                      Sem categoria
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {tx.isDuplicate && (
                    <Badge
                      variant="outline"
                      className="border-warning text-warning text-xs"
                    >
                      Duplicata
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.transactions.length > 20 && (
          <div className="border-t border-border px-4 py-2 text-center text-sm text-foreground-secondary">
            Mostrando 20 de {data.transactions.length} transações
          </div>
        )}
      </div>

      {/* Parse errors */}
      {data.errors.length > 0 && (
        <div className="rounded-md bg-error/5 px-4 py-3 text-sm">
          <p className="font-medium text-error mb-1">
            {data.errors.length} aviso{data.errors.length > 1 ? "s" : ""}
          </p>
          <ul className="list-disc pl-4 text-foreground-secondary space-y-0.5">
            {data.errors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress bar during import */}
      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Importando e categorizando transações...
          </div>
          <Progress value={65} className="h-2" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Button>
        <Button
          onClick={() => onConfirm(skipDuplicates)}
          disabled={isLoading || importableCount === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            `Confirmar Import (${importableCount} transações)`
          )}
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-foreground-secondary">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
