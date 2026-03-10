"use client";

import { useState, useEffect, useTransition } from "react";
import {
  RefreshCw,
  Check,
  SkipForward,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCheck,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditRecurringModal } from "./edit-recurring-modal";
import { getIconComponent } from "@/components/features/categories/icon-picker";
import type { CategoryItem } from "@/components/features/transactions/category-selector";
import {
  confirmRecurringSuggestion,
  confirmAllRecurringSuggestions,
  skipRecurringSuggestion,
  toggleRecurringActive,
  updateRecurringExpense,
  deleteRecurringExpense,
  type RecurringExpenseRow,
  type PendingSuggestion,
  type UpdateRecurringData,
} from "@/app/recurring/actions";
import { PAYMENT_METHOD_LABELS } from "@/lib/validations/manual-transaction";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  ...PAYMENT_METHOD_LABELS,
  card: "Cartão",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}


const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface RecurringContentProps {
  initialData: {
    recurring: RecurringExpenseRow[];
    pending: PendingSuggestion[];
    totalFixedExpenses: number;
    totalIncome: number;
    currentMonth: string;
  };
  categories: CategoryItem[];
}

export function RecurringContent({
  initialData,
  categories,
}: RecurringContentProps) {
  const [pending, setPending] = useState(initialData.pending);
  const [recurring, setRecurring] = useState(initialData.recurring);
  const [adjustedAmounts, setAdjustedAmounts] = useState<
    Record<string, string>
  >({});

  // Sync local state when server re-renders with fresh data (e.g. after router.refresh())
  useEffect(() => {
    setPending(initialData.pending);
    setRecurring(initialData.recurring);
  }, [initialData]);
  const [editingRow, setEditingRow] = useState<RecurringExpenseRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { totalFixedExpenses, totalIncome, currentMonth } = initialData;

  const [year, monthNum] = currentMonth.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[monthNum - 1]} ${year}`;

  const incomePercent =
    totalIncome > 0
      ? ((totalFixedExpenses / totalIncome) * 100).toFixed(1)
      : null;

  // ─── Suggestion actions ───────────────────────────────────────────

  function getAmount(id: string, defaultAmount: number): number {
    const adjusted = adjustedAmounts[id];
    if (adjusted !== undefined) return (parseFloat(adjusted) || 0);
    return defaultAmount;
  }

  function handleConfirm(suggestion: PendingSuggestion) {
    const amount = getAmount(suggestion.id, suggestion.expectedAmount);
    startTransition(async () => {
      const result = await confirmRecurringSuggestion(suggestion.id, amount);
      if (result.success) {
        setPending((prev) => prev.filter((p) => p.id !== suggestion.id));
      }
    });
  }

  function handleSkip(id: string) {
    startTransition(async () => {
      const result = await skipRecurringSuggestion(id);
      if (result.success) {
        setPending((prev) => prev.filter((p) => p.id !== id));
      }
    });
  }

  function handleConfirmAll() {
    const items = pending.map((p) => ({
      id: p.id,
      amount: getAmount(p.id, p.expectedAmount),
    }));
    startTransition(async () => {
      const result = await confirmAllRecurringSuggestions(items);
      if (result.success) {
        setPending([]);
      }
    });
  }

  // ─── Table actions ────────────────────────────────────────────────

  function handleToggleActive(id: string) {
    startTransition(async () => {
      const result = await toggleRecurringActive(id);
      if (result.success) {
        setRecurring((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isActive: result.isActive! } : r
          )
        );
        // If deactivated, remove from pending
        if (!result.isActive) {
          setPending((prev) => prev.filter((p) => p.id !== id));
        }
      }
    });
  }

  function handleEdit(row: RecurringExpenseRow) {
    setEditingRow(row);
    setEditModalOpen(true);
  }

  async function handleSaveEdit(id: string, data: UpdateRecurringData) {
    const result = await updateRecurringExpense(id, data);
    if (result.success) {
      setRecurring((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                name: data.name,
                categoryId: data.categoryId,
                expectedAmount: data.expectedAmount,
                dayOfMonth: data.dayOfMonth,
                sourceType: data.sourceType,
              }
            : r
        )
      );
      // Update pending too
      setPending((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: data.name,
                categoryId: data.categoryId,
                expectedAmount: data.expectedAmount,
                dayOfMonth: data.dayOfMonth,
                sourceType: data.sourceType,
              }
            : p
        )
      );
    }
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    const id = deleteId;
    startTransition(async () => {
      const result = await deleteRecurringExpense(id);
      if (result.success) {
        setRecurring((prev) => prev.filter((r) => r.id !== id));
        setPending((prev) => prev.filter((p) => p.id !== id));
        setDeleteId(null);
      }
    });
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Summary card */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-recurring/10">
            <RefreshCw className="h-5 w-5 text-recurring" />
          </div>
          <div>
            <p className="text-sm text-foreground-secondary">
              Total Gastos Fixos
            </p>
            <p className="text-xl font-semibold">
              {formatCurrency(totalFixedExpenses)}/mês
              {incomePercent && (
                <span className="ml-2 text-sm font-normal text-foreground-secondary">
                  ({incomePercent}% da renda)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Suggestion panel */}
      {pending.length > 0 && (
        <div className="rounded-lg border border-recurring/30 bg-recurring/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-recurring" />
              <h2 className="text-base font-semibold">
                Você tem {pending.length} gasto
                {pending.length > 1 ? "s" : ""} recorrente
                {pending.length > 1 ? "s" : ""} pendente
                {pending.length > 1 ? "s" : ""} para {monthLabel}
              </h2>
            </div>
            <Button
              size="sm"
              onClick={handleConfirmAll}
              disabled={isPending}
              className="bg-recurring text-white hover:bg-recurring/90"
            >
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Confirmar todos
            </Button>
          </div>

          <div className="space-y-2">
            {pending.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{suggestion.name}</p>
                  {suggestion.categoryName && (
                    <p className="text-sm text-foreground-secondary">
                      {suggestion.categoryName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <CurrencyInput
                      value={
                        adjustedAmounts[suggestion.id] ??
                        String(suggestion.expectedAmount)
                      }
                      onValueChange={(val) =>
                        setAdjustedAmounts((prev) => ({
                          ...prev,
                          [suggestion.id]: val,
                        }))
                      }
                      className="h-8 text-sm"
                    />
                  </div>

                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-success hover:bg-success/10 hover:text-success"
                          onClick={() => handleConfirm(suggestion)}
                          disabled={isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Confirmar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-foreground-secondary hover:text-foreground"
                          onClick={() => handleSkip(suggestion.id)}
                          disabled={isPending}
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pular este mês</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No pending message */}
      {pending.length === 0 && recurring.some((r) => r.isActive) && (
        <div className="rounded-lg border border-success/20 bg-success/10 p-4">
          <div className="flex items-center gap-2 text-success">
            <Check className="h-5 w-5" />
            <p className="text-sm font-medium">
              Todos os gastos recorrentes de {monthLabel} estão em dia.
            </p>
          </div>
        </div>
      )}

      {/* Recurring expenses table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recorrentes cadastrados</h2>
        {recurring.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <CalendarClock className="mx-auto mb-3 h-10 w-10 text-foreground-secondary/50" />
            <p className="text-foreground-secondary">
              Nenhum gasto recorrente cadastrado.
            </p>
            <p className="mt-1 text-sm text-foreground-secondary">
              Marque um lançamento manual como recorrente para começar.
            </p>
          </div>
        ) : (
          <div className="bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor esperado</TableHead>
                  <TableHead className="text-center">Dia</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurring.map((row) => (
                  <TableRow
                    key={row.id}
                    className={!row.isActive ? "opacity-50" : undefined}
                  >
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      {row.categoryName ? (() => {
                        const Icon = row.categoryIcon ? getIconComponent(row.categoryIcon) : null;
                        return (
                          <span className="inline-flex items-center gap-1.5">
                            {Icon && (
                              <Icon
                                className="h-3.5 w-3.5 shrink-0"
                                style={row.categoryColor ? { color: row.categoryColor } : undefined}
                              />
                            )}
                            {row.parentCategoryName ? (
                              <span>
                                <span className="text-foreground-secondary">{row.parentCategoryName} ›</span>{" "}
                                {row.categoryName}
                              </span>
                            ) : (
                              <span>{row.categoryName}</span>
                            )}
                          </span>
                        );
                      })() : (
                        <span className="text-foreground-secondary">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.expectedAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.dayOfMonth ?? "—"}
                    </TableCell>
                    <TableCell>
                      {SOURCE_TYPE_LABELS[row.sourceType] ?? row.sourceType}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.detectionMethod === "auto"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          row.detectionMethod !== "auto"
                            ? "border-accent/40 bg-accent/10 text-accent"
                            : undefined
                        }
                      >
                        {row.detectionMethod === "auto"
                          ? "Automático"
                          : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={row.isActive}
                        onCheckedChange={() => handleToggleActive(row.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-muted hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(row.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-error/10 hover:text-error transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <EditRecurringModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        recurring={editingRow}
        categories={categories}
        onSave={handleSaveEdit}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recorrente?</AlertDialogTitle>
            <AlertDialogDescription>
              O gasto recorrente será removido permanentemente. Transações já
              criadas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
