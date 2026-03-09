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
import { ArrowUpDown, Check, CheckCircle2, Loader2 } from "lucide-react";

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
  importId: string | null;
  importFileName: string | null;
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

  // AI-categorized but in review queue means low confidence
  return (
    <Badge className="bg-warning/15 text-warning border-warning/30">
      IA
    </Badge>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function ReviewQueueTable({
  transactions: initialTransactions,
  categories,
  onSortChange,
  sortBy,
  sortDir,
}: {
  transactions: ReviewTransaction[];
  categories: Category[];
  onSortChange: (field: "date" | "amount" | "description") => void;
  sortBy: string;
  sortDir: string;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeRow, setActiveRow] = useState(0);
  const [openComboboxRow, setOpenComboboxRow] = useState<number | null>(null);
  const [batchComboboxOpen, setBatchComboboxOpen] = useState(false);
  const [categorizedCount, setCategorizedCount] = useState(0);
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);

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

  const handleCategorize = useCallback(
    async (transactionIds: string[], categoryId: string) => {
      setLoading((prev) => {
        const next = new Set(prev);
        transactionIds.forEach((id) => next.add(id));
        return next;
      });

      // Determine if this is accepting an AI suggestion or a manual override.
      // If all selected transactions had AI suggestion with the same categoryId,
      // treat as AI acceptance (source='ai'). Otherwise, source='manual'.
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
        // Remove categorized transactions from the list
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

        // Adjust active row if needed
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

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture if focus is inside combobox search input
      if (
        e.target instanceof HTMLInputElement &&
        e.target.type === "text"
      ) {
        return;
      }

      if (batchComboboxOpen) return;

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
  }, [activeRow, transactions, toggleSelect, batchComboboxOpen]);

  // Scroll active row into view
  useEffect(() => {
    const container = tableRef.current;
    if (!container) return;
    const row = container.querySelector(`[data-row-index="${activeRow}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [activeRow]);

  if (transactions.length === 0 && categorizedCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-foreground-secondary">
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
        <div className="flex items-center gap-4 text-sm text-foreground-secondary">
          <span>
            Total na fila:{" "}
            <span className="font-semibold text-foreground">{totalCount}</span>
          </span>
          <span className="text-border">|</span>
          <span>
            Categorizados nesta sessão:{" "}
            <span className="font-semibold text-success">{categorizedCount}</span>
          </span>
          <span className="text-border">|</span>
          <span>
            Restantes:{" "}
            <span className="font-semibold text-foreground">
              {remainingCount}
            </span>
          </span>
        </div>

        {/* Batch action */}
        {selected.size > 0 && (
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setBatchComboboxOpen((v) => !v)}
              className="gap-1.5"
            >
              Categorizar {selected.size} selecionado{selected.size > 1 ? "s" : ""}
            </Button>
            {batchComboboxOpen && (
              <div className="absolute right-0 top-full z-50">
                <CategoryCombobox
                  categories={categories}
                  value={null}
                  onSelect={(catId) =>
                    handleCategorize(Array.from(selected), catId)
                  }
                  onClose={() => setBatchComboboxOpen(false)}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
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
              <TableCell className="text-foreground-secondary">
                {formatDate(tx.date)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{tx.originalTitle}</span>
                  {tx.cardName && (
                    <span className="text-xs text-foreground-secondary">
                      {tx.cardName}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(tx.amount)}
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
                  <div className="relative flex items-center gap-1.5">
                    {/* Accept AI suggestion button */}
                    {tx.categorizationMethod === "ai" && tx.categoryId && (
                      <button
                        type="button"
                        title="Aceitar sugestão da IA"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategorize([tx.id], tx.categoryId!);
                        }}
                        className="rounded-md border border-success/30 bg-success/10 px-2 py-1.5 text-sm text-success transition-colors hover:bg-success/20"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenComboboxRow((prev) =>
                          prev === index ? null : index
                        );
                        setActiveRow(index);
                      }}
                      className={cn(
                        "rounded-md border border-border px-2.5 py-1.5 text-sm transition-colors hover:border-accent/50",
                        openComboboxRow === index &&
                          "border-accent ring-2 ring-accent/20"
                      )}
                    >
                      Categorizar
                    </button>
                    {openComboboxRow === index && (
                      <CategoryCombobox
                        categories={categories}
                        value={null}
                        onSelect={(catId) => handleCategorize([tx.id], catId)}
                        onClose={() => setOpenComboboxRow(null)}
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
