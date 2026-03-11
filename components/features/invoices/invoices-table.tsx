"use client";

import { useState } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { InvoiceActionsMenu } from "./invoice-actions-menu";
import { deleteImport } from "@/app/settings/actions";
import type { InvoiceRow } from "@/app/invoices/actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonthRef(monthRef: string) {
  const [y, m] = monthRef.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatRelativeDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `há ${weeks} semana${weeks > 1 ? "s" : ""}`;
  }
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type GroupedInvoices = {
  monthRef: string;
  monthLabel: string;
  invoices: InvoiceRow[];
  totalAmount: number;
  totalTx: number;
  variation: number | null; // % change vs previous month
};

function groupByMonth(invoices: InvoiceRow[]): GroupedInvoices[] {
  const groups = new Map<string, InvoiceRow[]>();

  for (const inv of invoices) {
    const existing = groups.get(inv.monthRef) ?? [];
    existing.push(inv);
    groups.set(inv.monthRef, existing);
  }

  const sorted = Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthRef, invoices]) => ({
      monthRef,
      monthLabel: formatMonthRef(monthRef),
      invoices,
      totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
      totalTx: invoices.reduce((sum, i) => sum + i.txCount, 0),
      variation: null as number | null,
    }));

  // Calculate variation (sorted is desc, so index 0 is newest)
  for (let i = 0; i < sorted.length - 1; i++) {
    const prevAmount = sorted[i + 1].totalAmount;
    if (prevAmount > 0) {
      sorted[i].variation =
        ((sorted[i].totalAmount - prevAmount) / prevAmount) * 100;
    }
  }

  return sorted;
}

interface InvoicesTableProps {
  invoices: InvoiceRow[];
}

export function InvoicesTable({ invoices: initialInvoices }: InvoicesTableProps) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const groups = groupByMonth(invoices);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const result = await deleteImport(deleteTarget.id);

    if (result.success) {
      setInvoices((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success(
        `Fatura "${deleteTarget.fileName}" excluída com ${deleteTarget.txCount} transações`
      );
    } else {
      toast.error(result.error ?? "Erro ao excluir fatura");
    }

    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mês</TableHead>
            <TableHead>Cartão</TableHead>
            <TableHead className="text-right">Transações</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-foreground-secondary">Importado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <>
              {/* Month separator */}
              <TableRow key={`header-${group.monthRef}`} className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="bg-background-secondary/50 py-2 text-xs font-semibold uppercase tracking-wider text-foreground-secondary"
                >
                  {group.monthLabel}
                  <span className="ml-3 font-normal">
                    {group.totalTx} transações · {formatBRL(group.totalAmount)}
                  </span>
                  {group.variation !== null && (
                    <span
                      className={`ml-2 inline-flex items-center gap-0.5 text-[10px] font-medium ${
                        group.variation > 0 ? "text-error" : "text-success"
                      }`}
                    >
                      {group.variation > 0 ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      {group.variation > 0 ? "+" : ""}
                      {group.variation.toFixed(0)}%
                    </span>
                  )}
                </TableCell>
              </TableRow>

              {/* Invoice rows */}
              {group.invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-foreground-secondary capitalize">
                    {group.monthLabel}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="gap-1 text-xs"
                      style={
                        inv.cardColor
                          ? {
                              borderColor: inv.cardColor + "40",
                              backgroundColor: inv.cardColor + "10",
                              color: inv.cardColor,
                            }
                          : undefined
                      }
                    >
                      {inv.cardColor && (
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: inv.cardColor }}
                        />
                      )}
                      {inv.cardName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inv.txCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatBRL(inv.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge
                      manualPending={inv.manualPendingCount}
                      txCount={inv.txCount}
                    />
                  </TableCell>
                  <TableCell className="text-foreground-secondary text-sm">
                    {formatRelativeDate(inv.importedAt)}
                  </TableCell>
                  <TableCell>
                    <InvoiceActionsMenu
                      importId={inv.id}
                      manualPending={inv.manualPendingCount}
                      onDelete={() => setDeleteTarget(inv)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fatura?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo <strong>{deleteTarget?.fileName}</strong> e suas{" "}
              <strong>{deleteTarget?.txCount} transações</strong> serão
              permanentemente excluídos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
