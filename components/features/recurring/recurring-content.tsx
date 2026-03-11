"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Check,
  X,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCheck,
  CalendarClock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { MonthSelector } from "@/components/ui/month-selector";
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
import { DynamicIcon } from "@/components/features/categories/icon-picker";
import type { CategoryItem } from "@/components/features/transactions/category-selector";
import {
  fetchRecurringPageData,
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
  const [monthRef, setMonthRef] = useState(initialData.currentMonth);
  const [pending, setPending] = useState(initialData.pending);
  const [recurring, setRecurring] = useState(initialData.recurring);
  const [totalFixedExpenses, setTotalFixedExpenses] = useState(initialData.totalFixedExpenses);
  const [totalIncome, setTotalIncome] = useState(initialData.totalIncome);
  const [adjustedAmounts, setAdjustedAmounts] = useState<
    Record<string, string>
  >({});
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);

  // Sync local state when server re-renders with fresh data (e.g. after router.refresh())
  useEffect(() => {
    setPending(initialData.pending);
    setRecurring(initialData.recurring);
    setTotalFixedExpenses(initialData.totalFixedExpenses);
    setTotalIncome(initialData.totalIncome);
    setMonthRef(initialData.currentMonth);
  }, [initialData]);

  const router = useRouter();

  const handleMonthChange = useCallback(async (newMonth: string) => {
    setMonthRef(newMonth);
    setIsLoadingMonth(true);
    setAdjustedAmounts({});
    router.push(`/recurring?month=${newMonth}`);
    const data = await fetchRecurringPageData(newMonth);
    setPending(data.pending);
    setRecurring(data.recurring);
    setTotalFixedExpenses(data.totalFixedExpenses);
    setTotalIncome(data.totalIncome);
    setIsLoadingMonth(false);
  }, [router]);

  const [editingRow, setEditingRow] = useState<RecurringExpenseRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tableExpanded, setTableExpanded] = useState(false);

  const [year, monthNum] = monthRef.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[monthNum - 1]} ${year}`;

  const incomePercent =
    totalIncome > 0
      ? ((totalFixedExpenses / totalIncome) * 100).toFixed(1)
      : null;

  // Auto-expand table when no pending items
  const showTable = tableExpanded || pending.length === 0;

  // ─── Suggestion actions ───────────────────────────────────────────

  function getAmount(id: string, defaultAmount: number): number {
    const adjusted = adjustedAmounts[id];
    if (adjusted !== undefined) return (parseFloat(adjusted) || 0);
    return defaultAmount;
  }

  function handleConfirm(suggestion: PendingSuggestion) {
    const amount = getAmount(suggestion.id, suggestion.expectedAmount);
    startTransition(async () => {
      const result = await confirmRecurringSuggestion(suggestion.id, amount, monthRef);
      if (result.success) {
        setPending((prev) => prev.filter((p) => p.id !== suggestion.id));
        toast.success(`${suggestion.name} confirmado para ${monthLabel}`);
      }
    });
  }

  function handleSkip(id: string, name: string) {
    startTransition(async () => {
      const result = await skipRecurringSuggestion(id, monthRef);
      if (result.success) {
        setPending((prev) => prev.filter((p) => p.id !== id));
        toast(`${name} pulado para ${monthLabel}`, {
          icon: <X className="h-4 w-4 text-foreground-secondary" />,
        });
      }
    });
  }

  function handleConfirmAll() {
    const items = pending.map((p) => ({
      id: p.id,
      amount: getAmount(p.id, p.expectedAmount),
    }));
    startTransition(async () => {
      const result = await confirmAllRecurringSuggestions(items, monthRef);
      if (result.success) {
        setPending([]);
        setConfirmAllOpen(false);
        toast.success(`${items.length} lançamentos confirmados para ${monthLabel}`);
      }
    });
  }

  // ─── Table actions ────────────────────────────────────────────────

  function handleToggleActive(id: string, name: string) {
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
        toast(result.isActive ? `${name} ativado` : `${name} desativado`);
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
                effectiveFrom: data.effectiveFrom,
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
      toast.success("Recorrente atualizado");
    }
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    const id = deleteId;
    const name = recurring.find((r) => r.id === id)?.name;
    startTransition(async () => {
      const result = await deleteRecurringExpense(id);
      if (result.success) {
        setRecurring((prev) => prev.filter((r) => r.id !== id));
        setPending((prev) => prev.filter((p) => p.id !== id));
        setDeleteId(null);
        toast.success(`${name ?? "Recorrente"} excluído`);
      }
    });
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Month selector */}
        <MonthSelector
          monthRef={monthRef}
          onChange={handleMonthChange}
          disableFuture={false}
        />

        {/* Summary card */}
        <div className={`rounded-lg border border-border bg-card p-5 ${isLoadingMonth ? "opacity-60 pointer-events-none" : ""}`}>
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

        {/* Pending suggestions — task-list / inbox style */}
        {pending.length > 0 && (
          <div className={`rounded-lg border-2 border-recurring/40 bg-recurring/5 p-5 ${isLoadingMonth ? "opacity-60 pointer-events-none" : ""}`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-recurring/15">
                  <AlertCircle className="h-4 w-4 text-recurring" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">
                    {pending.length} pendente{pending.length > 1 ? "s" : ""} em {monthLabel}
                  </h2>
                  <p className="text-xs text-foreground-secondary">
                    Confirme ou pule cada gasto recorrente para este mês
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setConfirmAllOpen(true)}
                disabled={isPending}
                className="bg-recurring text-recurring-foreground hover:bg-recurring/90"
              >
                <CheckCheck className="mr-1.5 h-4 w-4" />
                Lançar todos
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

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-success hover:bg-success/10! hover:text-success!"
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
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-foreground-secondary hover:bg-error/10! hover:text-error!"
                          onClick={() => handleSkip(suggestion.id, suggestion.name)}
                          disabled={isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pular este mês</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All caught up */}
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

        {/* Recurring expenses table — collapsible config section */}
        <div>
          <button
            type="button"
            onClick={() => setTableExpanded(!tableExpanded)}
            className="mb-3 flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Gerenciar recorrentes</h2>
              <span className="text-sm text-foreground-secondary">
                ({recurring.length})
              </span>
            </div>
            {pending.length > 0 && (
              tableExpanded ? (
                <ChevronUp className="h-4 w-4 text-foreground-secondary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground-secondary" />
              )
            )}
          </button>

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
          ) : showTable ? (
            <div className="rounded-lg border border-border bg-card">
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
                    <TableHead className="w-25" />
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
                        {row.categoryName ? (
                          <span className="inline-flex items-center gap-1.5">
                            {row.categoryIcon && (
                              <DynamicIcon
                                name={row.categoryIcon}
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
                        ) : (
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
                          onCheckedChange={() => handleToggleActive(row.id, row.name)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-foreground-secondary hover:bg-muted! hover:text-foreground!"
                                onClick={() => handleEdit(row)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-foreground-secondary hover:bg-error/10! hover:text-error!"
                                onClick={() => setDeleteId(row.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </div>

        {/* Edit modal */}
        <EditRecurringModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          recurring={editingRow}
          categories={categories}
          onSave={handleSaveEdit}
        />

        {/* Confirm all dialog */}
        <AlertDialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Lançar gastos fixos de {monthLabel}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esses gastos serão adicionados como transações do mês.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <dl className="space-y-1.5 text-sm">
              {pending.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <dt className="text-foreground">{p.name}</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {formatCurrency(getAmount(p.id, p.expectedAmount))}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center justify-between border-t border-border pt-1 text-sm font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground tabular-nums">
                {formatCurrency(
                  pending.reduce(
                    (sum, p) => sum + getAmount(p.id, p.expectedAmount),
                    0
                  )
                )}
              </span>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAll}
                disabled={isPending}
              >
                Lançar {pending.length} gastos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
    </TooltipProvider>
  );
}
