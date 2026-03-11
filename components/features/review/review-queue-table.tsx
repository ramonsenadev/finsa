"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "./category-combobox";
import { categorizeTransactions } from "@/app/transactions/review/actions";
import {
  countSameMerchantTransactions,
  recategorizeTransaction,
} from "@/app/transactions/actions";
import { ArrowUpDown, Check, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { formatBRL } from "@/lib/format";

type ReviewTransaction = {
  id: string;
  date: string;
  description: string;
  originalTitle: string;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categorizationMethod: string | null;
  cardName: string | null;
  cardColor: string | null;
  isRecurring: boolean;
  importId: string | null;
  importFileName: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  sourceType: string;
};

type Category = {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
};

function ConfidenceBadge({ method }: { method: string | null }) {
  if (!method || method !== "ai") {
    return (
      <Badge variant="outline" className="text-foreground-secondary">
        —
      </Badge>
    );
  }

  return (
    <Badge className="bg-warning/15 text-warning border-warning/30">
      IA
    </Badge>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(d);
}

// ─── Merchant propagation confirm popover ────────────────────────────

function MerchantConfirmPopover({
  merchantInfo,
  categoryName,
  loading,
  applying,
  onApplyAll,
  onApplyOne,
  onCancel,
  anchorRef,
}: {
  merchantInfo: { count: number; merchant: string } | null;
  categoryName: string | null;
  loading: boolean;
  applying: boolean;
  onApplyAll: () => void;
  onApplyOne: () => void;
  onCancel: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popoverHeight = 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < popoverHeight && rect.top > popoverHeight;
    const left = Math.min(rect.left, window.innerWidth - 320 - 16);

    if (openUp) {
      setPosition({ bottom: window.innerHeight - rect.top + 4, left });
    } else {
      setPosition({ top: rect.bottom + 4, left });
    }
  }, [anchorRef]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onCancel();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [anchorRef, onCancel]);

  const positionStyle: React.CSSProperties = {
    left: position.left,
    ...(position.top != null ? { top: position.top } : {}),
    ...(position.bottom != null ? { bottom: position.bottom } : {}),
  };

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-80 rounded-md border border-border bg-popover p-4 shadow-lg"
      style={positionStyle}
    >
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      ) : (
        <>
          <p className="text-sm text-foreground">
            Alterar categoria para{" "}
            <span className="font-semibold text-accent">{categoryName}</span>
          </p>

          {merchantInfo && merchantInfo.count > 1 && (
            <p className="mt-2 text-sm text-foreground-secondary">
              Encontramos{" "}
              <span className="font-semibold text-foreground">
                {merchantInfo.count}
              </span>{" "}
              transações de{" "}
              <span className="font-medium text-foreground">
                {merchantInfo.merchant}
              </span>
              . Deseja aplicar esta categoria a todas?
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {merchantInfo && merchantInfo.count > 1 && (
              <Button
                size="sm"
                onClick={onApplyAll}
                disabled={applying}
                className="w-full"
              >
                {applying && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Aplicar a todas ({merchantInfo.count})
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onApplyOne}
              disabled={applying}
              className="w-full"
            >
              {applying && (!merchantInfo || merchantInfo.count <= 1) && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {merchantInfo && merchantInfo.count > 1 ? "Apenas esta" : "Aplicar"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function ReviewQueueTable({
  transactions: initialTransactions,
  categories,
  onSortChange,
}: {
  transactions: ReviewTransaction[];
  categories: Category[];
  onSortChange: (field: "date" | "amount" | "description") => void;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeRow, setActiveRow] = useState(0);
  const [openComboboxRow, setOpenComboboxRow] = useState<number | null>(null);
  const [batchComboboxOpen, setBatchComboboxOpen] = useState(false);
  const [categorizedCount, setCategorizedCount] = useState(0);
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);
  const lastSelectedCountRef = useRef(1);
  const batchButtonRef = useRef<HTMLButtonElement>(null);
  const rowButtonEls = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Merchant propagation state
  const [confirmState, setConfirmState] = useState<{
    transactionId: string;
    categoryId: string;
    categoryName: string | null;
    merchantInfo: { count: number; merchant: string } | null;
    loading: boolean;
    applying: boolean;
    anchorIndex: number;
  } | null>(null);

  // Sync with new data from server
  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const totalCount = initialTransactions.length;
  const remainingCount = transactions.length;

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === transactions.length
        ? new Set()
        : new Set(transactions.map((t) => t.id))
    );
  }, [transactions]);

  // Find category name from id
  function getCategoryName(categoryId: string): string | null {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return null;
    if (cat.parentId) {
      const parent = categories.find((c) => c.id === cat.parentId);
      return parent ? `${parent.name} › ${cat.name}` : cat.name;
    }
    return cat.name;
  }

  // Direct categorization (batch or when no merchant propagation needed)
  const handleDirectCategorize = useCallback(
    async (transactionIds: string[], categoryId: string) => {
      setLoading((prev) => {
        const next = new Set(prev);
        transactionIds.forEach((id) => next.add(id));
        return next;
      });

      const selectedTxs = transactions.filter((t) =>
        transactionIds.includes(t.id)
      );
      const isAiAcceptance = selectedTxs.every(
        (t) =>
          t.categorizationMethod === "ai" && t.categoryId === categoryId
      );

      const result = await categorizeTransactions(
        transactionIds,
        categoryId,
        isAiAcceptance
          ? { source: "ai", confidence: 0.85 }
          : { source: "manual", confidence: 1.0 }
      );

      if (result.success) {
        setTransactions((prev) =>
          prev.filter((t) => !transactionIds.includes(t.id))
        );
        setSelected((prev) => {
          const next = new Set(prev);
          transactionIds.forEach((id) => next.delete(id));
          return next;
        });
        setCategorizedCount((c) => c + transactionIds.length);
        setOpenComboboxRow(null);
        setBatchComboboxOpen(false);
        toast.success(
          transactionIds.length === 1
            ? "Transação categorizada"
            : `${transactionIds.length} transações categorizadas`
        );

        setActiveRow((prev) =>
          Math.min(prev, Math.max(0, transactions.length - transactionIds.length - 1))
        );
      }

      setLoading((prev) => {
        const next = new Set(prev);
        transactionIds.forEach((id) => next.delete(id));
        return next;
      });
    },
    [transactions]
  );

  // Single-transaction categorization with merchant propagation check
  async function handleCategorizeWithPropagation(
    transactionId: string,
    categoryId: string,
    anchorIndex: number
  ) {
    setOpenComboboxRow(null);
    setConfirmState({
      transactionId,
      categoryId,
      categoryName: getCategoryName(categoryId),
      merchantInfo: null,
      loading: true,
      applying: false,
      anchorIndex,
    });

    const info = await countSameMerchantTransactions(transactionId);

    if (info.count <= 1) {
      // No other transactions from this merchant — apply directly
      setConfirmState(null);
      await handleDirectCategorize([transactionId], categoryId);
    } else {
      setConfirmState((prev) =>
        prev ? { ...prev, merchantInfo: info, loading: false } : null
      );
    }
  }

  async function handleConfirmApplyAll() {
    if (!confirmState) return;
    const { transactionId, categoryId, merchantInfo } = confirmState;
    setConfirmState((prev) => prev ? { ...prev, applying: true } : null);

    const result = await recategorizeTransaction(transactionId, categoryId, true);

    if (result.success) {
      const affectedIds = new Set(result.matchingIds ?? [transactionId]);
      setTransactions((prev) => prev.filter((t) => !affectedIds.has(t.id)));
      setCategorizedCount((c) => c + affectedIds.size);
      toast.success(
        `Categoria aplicada a ${merchantInfo?.count ?? 1} transações`
      );
    }

    setConfirmState(null);
  }

  async function handleConfirmApplyOne() {
    if (!confirmState) return;
    const { transactionId, categoryId } = confirmState;
    setConfirmState((prev) => prev ? { ...prev, applying: true } : null);

    await handleDirectCategorize([transactionId], categoryId);
    setConfirmState(null);
  }

  // Wrapper for combobox selection — single tx gets propagation, batch goes direct
  const handleCategorize = useCallback(
    async (transactionIds: string[], categoryId: string, anchorIndex?: number) => {
      if (transactionIds.length === 1 && anchorIndex !== undefined) {
        await handleCategorizeWithPropagation(transactionIds[0], categoryId, anchorIndex);
      } else {
        await handleDirectCategorize(transactionIds, categoryId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleDirectCategorize]
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement &&
        e.target.type === "text"
      ) {
        return;
      }

      if (batchComboboxOpen || confirmState) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveRow((r) => Math.min(r + 1, transactions.length - 1));
          setOpenComboboxRow(null);
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveRow((r) => Math.max(r - 1, 0));
          setOpenComboboxRow(null);
          break;
        case "Enter":
          e.preventDefault();
          setOpenComboboxRow((prev) =>
            prev === activeRow ? null : activeRow
          );
          break;
        case " ":
          if (!(e.target instanceof HTMLButtonElement)) {
            e.preventDefault();
            const tx = transactions[activeRow];
            if (tx) toggleSelect(tx.id);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpenComboboxRow(null);
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeRow, transactions, toggleSelect, batchComboboxOpen, confirmState]);

  // Scroll active row into view
  useEffect(() => {
    const container = tableRef.current;
    if (!container) return;
    const row = container.querySelector(`[data-row-index="${activeRow}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [activeRow]);

  // Freeze the displayed count so it doesn't flash "0" before hiding
  if (selected.size > 0) lastSelectedCountRef.current = selected.size;
  const displayCount = selected.size > 0 ? selected.size : lastSelectedCountRef.current;

  if (transactions.length === 0 && categorizedCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-muted/50 py-16 text-foreground-secondary">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-lg font-medium text-foreground">
          Nenhuma transação pendente
        </p>
        <p className="text-sm">
          Todas as transações estão categorizadas.
        </p>
      </div>
    );
  }

  if (transactions.length === 0 && categorizedCount > 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-foreground-secondary">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-lg font-medium text-foreground">
          Revisão concluída!
        </p>
        <p className="text-sm">
          {categorizedCount} transaç{categorizedCount === 1 ? "ão categorizada" : "ões categorizadas"} nesta sessão.
        </p>
      </div>
    );
  }

  return (
    <div ref={tableRef}>
      {/* Header counters */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-foreground-secondary">
          <span className="font-semibold text-foreground">{remainingCount}</span>{" "}
          {remainingCount === 1 ? "transação na fila" : "transações na fila"}
        </div>

        {/* Batch action — always rendered to prevent layout shift */}
        <div className={cn(selected.size === 0 && "invisible")}>
          <Button
            ref={batchButtonRef}
            size="sm"
            onClick={() => setBatchComboboxOpen((v) => !v)}
            className="gap-1.5"
          >
            Categorizar {displayCount} selecionado{displayCount > 1 ? "s" : ""}
          </Button>
          {batchComboboxOpen && selected.size > 0 && (
            <CategoryCombobox
              categories={categories}
              value={null}
              onSelect={(catId) =>
                handleDirectCategorize(Array.from(selected), catId)
              }
              onClose={() => setBatchComboboxOpen(false)}
              anchorRef={batchButtonRef}
              autoFocus
            />
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={
                  transactions.length > 0 &&
                  selected.size === transactions.length
                }
                onCheckedChange={toggleAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => onSortChange("date")}
                className="inline-flex items-center gap-1 hover:text-accent"
              >
                Data
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => onSortChange("description")}
                className="inline-flex items-center gap-1 hover:text-accent"
              >
                Descrição
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>Origem</TableHead>
            <TableHead className="text-right">
              <button
                type="button"
                onClick={() => onSortChange("amount")}
                className="inline-flex items-center gap-1 hover:text-accent"
              >
                Valor
                <ArrowUpDown className="h-3 w-3" />
              </button>
            </TableHead>
            <TableHead>Sugestão</TableHead>
            <TableHead>Confiança</TableHead>
            <TableHead>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx, index) => (
            <TableRow
              key={tx.id}
              data-row-index={index}
              data-state={selected.has(tx.id) ? "selected" : undefined}
              className={cn(
                "cursor-pointer",
                index === activeRow && "bg-accent/5 ring-1 ring-inset ring-accent/20"
              )}
              onClick={() => setActiveRow(index)}
            >
              <TableCell>
                <Checkbox
                  checked={selected.has(tx.id)}
                  onCheckedChange={() => toggleSelect(tx.id)}
                  aria-label={`Selecionar ${tx.description}`}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap text-foreground-secondary">
                {formatDate(tx.date)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{tx.originalTitle}</span>
                  {tx.installmentTotal && tx.installmentTotal > 1 && (
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {tx.installmentCurrent}/{tx.installmentTotal}
                    </Badge>
                  )}
                  {tx.isRecurring && (
                    <span
                      className="inline-flex items-center rounded-full bg-recurring/10 p-1"
                      title="Recorrente"
                    >
                      <RefreshCw className="h-3 w-3 text-recurring" />
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {tx.sourceType === "manual" ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-accent/40 bg-accent/10 text-xs text-accent"
                  >
                    Manual
                  </Badge>
                ) : tx.cardName ? (
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
                ) : null}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                {formatBRL(tx.amount)}
              </TableCell>
              <TableCell>
                {tx.categoryName ? (
                  <span className="text-sm text-foreground-secondary">
                    {tx.categoryName}
                  </span>
                ) : (
                  <span className="text-sm text-foreground-secondary/50">
                    —
                  </span>
                )}
              </TableCell>
              <TableCell>
                <ConfidenceBadge method={tx.categorizationMethod} />
              </TableCell>
              <TableCell>
                {loading.has(tx.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    {/* Accept AI suggestion button */}
                    {tx.categorizationMethod === "ai" && tx.categoryId && (
                      <button
                        type="button"
                        title="Aceitar sugestão da IA"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategorize([tx.id], tx.categoryId!, index);
                        }}
                        className="rounded-md border border-success/30 bg-success/10 px-2 py-1.5 text-sm text-success transition-colors hover:bg-success/20"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      ref={(el) => {
                        if (el) rowButtonEls.current.set(index, el);
                        else rowButtonEls.current.delete(index);
                      }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenComboboxRow((prev) =>
                          prev === index ? null : index
                        );
                        setActiveRow(index);
                      }}
                      className={cn(
                        "rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-colors hover:border-accent/50 dark:bg-input/30",
                        openComboboxRow === index &&
                          "border-ring ring-2 ring-ring"
                      )}
                    >
                      Categorizar
                    </button>
                    {openComboboxRow === index && (
                      <CategoryCombobox
                        categories={categories}
                        value={null}
                        onSelect={(catId) => handleCategorize([tx.id], catId, index)}
                        onClose={() => setOpenComboboxRow(null)}
                        anchorRef={{ current: rowButtonEls.current.get(index) ?? null }}
                        autoFocus
                      />
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Merchant propagation confirm popover */}
      {confirmState && (
        <MerchantConfirmPopover
          merchantInfo={confirmState.merchantInfo}
          categoryName={confirmState.categoryName}
          loading={confirmState.loading}
          applying={confirmState.applying}
          onApplyAll={handleConfirmApplyAll}
          onApplyOne={handleConfirmApplyOne}
          onCancel={() => setConfirmState(null)}
          anchorRef={{ current: rowButtonEls.current.get(confirmState.anchorIndex) ?? null }}
        />
      )}

      {/* Keyboard hints */}
      <div className="mt-4 flex items-center gap-4 text-xs text-foreground-secondary">
        <span>
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↑↓</kbd>{" "}
          navegar
        </span>
        <span>
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">Enter</kbd>{" "}
          abrir seletor
        </span>
        <span>
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">Tab</kbd>{" "}
          confirmar e avançar
        </span>
        <span>
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">Esc</kbd>{" "}
          fechar seletor
        </span>
        <span>
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">Espaço</kbd>{" "}
          selecionar
        </span>
      </div>
    </div>
  );
}
