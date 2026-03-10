"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TransactionFilters,
  type FilterValues,
  type CardOption,
  type CategoryOption,
} from "./transaction-filters";
import { TransactionsTable } from "./transactions-table";
import {
  fetchTransactions,
  fetchTransactionsForExport,
  fetchCards,
  fetchAllCategories,
} from "@/app/transactions/actions";
import type { TransactionFilters as QueryFilters } from "@/lib/analytics/transactions";

// ─── URL ↔ Filters sync ─────────────────────────────────────────────

interface FullState {
  filters: FilterValues;
  sortBy: string;
  sortDir: "asc" | "desc";
  page: number;
}

function stateFromParams(params: URLSearchParams): FullState {
  const filters: FilterValues = {};

  if (params.get("dateStart")) filters.dateStart = params.get("dateStart")!;
  if (params.get("dateEnd")) filters.dateEnd = params.get("dateEnd")!;
  if (params.get("cardIds")) filters.cardIds = params.get("cardIds")!.split(",");
  if (params.get("categoryIds")) filters.categoryIds = params.get("categoryIds")!.split(",");
  if (params.get("minAmount")) filters.minAmount = parseFloat(params.get("minAmount")!);
  if (params.get("maxAmount")) filters.maxAmount = parseFloat(params.get("maxAmount")!);
  if (params.get("method")) filters.categorizationMethod = params.get("method") as FilterValues["categorizationMethod"];
  if (params.get("recurring")) filters.isRecurring = params.get("recurring") === "true";
  if (params.get("search")) filters.search = params.get("search")!;

  return {
    filters,
    sortBy: params.get("sort") ?? "date",
    sortDir: (params.get("dir") as "asc" | "desc") ?? "desc",
    page: params.get("page") ? parseInt(params.get("page")!, 10) : 1,
  };
}

function stateToUrl(state: FullState): string {
  const p = new URLSearchParams();

  if (state.filters.dateStart) p.set("dateStart", state.filters.dateStart);
  if (state.filters.dateEnd) p.set("dateEnd", state.filters.dateEnd);
  if (state.filters.cardIds?.length) p.set("cardIds", state.filters.cardIds.join(","));
  if (state.filters.categoryIds?.length) p.set("categoryIds", state.filters.categoryIds.join(","));
  if (state.filters.minAmount !== undefined) p.set("minAmount", String(state.filters.minAmount));
  if (state.filters.maxAmount !== undefined) p.set("maxAmount", String(state.filters.maxAmount));
  if (state.filters.categorizationMethod) p.set("method", state.filters.categorizationMethod);
  if (state.filters.isRecurring !== undefined) p.set("recurring", String(state.filters.isRecurring));
  if (state.filters.search) p.set("search", state.filters.search);
  if (state.sortBy !== "date") p.set("sort", state.sortBy);
  if (state.sortDir !== "desc") p.set("dir", state.sortDir);
  if (state.page > 1) p.set("page", String(state.page));

  const qs = p.toString();
  return qs ? `/transactions?${qs}` : "/transactions";
}

// ─── CSV Export ──────────────────────────────────────────────────────

function downloadCsv(rows: { date: string; description: string; amount: number; category: string; subcategory: string; card: string; categorizationMethod: string; recurring: string }[]) {
  const headers = ["Data", "Descrição", "Valor", "Categoria", "Subcategoria", "Cartão", "Método Categorização", "Recorrente"];
  const csvLines = [
    headers.join(";"),
    ...rows.map((r) =>
      [
        r.date,
        `"${r.description.replace(/"/g, '""')}"`,
        r.amount.toFixed(2).replace(".", ","),
        r.category,
        r.subcategory,
        r.card,
        r.categorizationMethod,
        r.recurring,
      ].join(";")
    ),
  ];

  const bom = "\uFEFF";
  const blob = new Blob([bom + csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────────

export function TransactionsContent() {
  const searchParams = useSearchParams();

  // Local state initialized from URL — this is the source of truth
  const [state, setState] = useState<FullState>(() => stateFromParams(searchParams));

  // Sync URL without triggering Next.js navigation
  const updateState = useCallback((newState: FullState) => {
    setState(newState);
    window.history.replaceState(null, "", stateToUrl(newState));
  }, []);

  // Load cards & categories
  const { data: cards = [] } = useQuery<CardOption[]>({
    queryKey: ["cards-list"],
    queryFn: () => fetchCards(),
  });

  const { data: categories = [] } = useQuery<CategoryOption[]>({
    queryKey: ["categories-list"],
    queryFn: () => fetchAllCategories(),
  });

  // Build query filters
  const queryFilters: QueryFilters = useMemo(
    () => ({
      ...state.filters,
      sortBy: state.sortBy as QueryFilters["sortBy"],
      sortDir: state.sortDir as QueryFilters["sortDir"],
      page: state.page,
      pageSize: 20,
    }),
    [state]
  );

  // Fetch transactions
  const {
    data: result,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["transactions", queryFilters],
    queryFn: () => fetchTransactions(queryFilters),
  });

  function handleFiltersChange(newFilters: FilterValues) {
    updateState({ ...state, filters: newFilters, page: 1 });
  }

  function handleSortChange(newSort: string, newDir: "asc" | "desc") {
    updateState({ ...state, sortBy: newSort, sortDir: newDir, page: 1 });
  }

  function handlePageChange(newPage: number) {
    updateState({ ...state, page: newPage });
  }

  async function handleExportCsv() {
    const rows = await fetchTransactionsForExport(queryFilters);
    downloadCsv(rows);
  }

  return (
    <div className="space-y-4">
      {/* Filters — always visible */}
      <TransactionFilters
        filters={state.filters}
        onFiltersChange={handleFiltersChange}
        cards={cards}
        categories={categories}
      />

      {/* Export button */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!result || result.total === 0}>
              <Download className="mr-1.5 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCsv}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <FileText className="mr-2 h-4 w-4" />
              PDF (em breve)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      {isLoading && !result ? (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : result ? (
        <div className={isFetching ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
          <TransactionsTable
            transactions={result.transactions}
            total={result.total}
            totalAmount={result.totalAmount}
            page={result.page}
            pageSize={result.pageSize}
            sortBy={state.sortBy}
            sortDir={state.sortDir}
            categories={categories}
            onSortChange={handleSortChange}
            onPageChange={handlePageChange}
            onRecategorized={() => refetch()}
          />
        </div>
      ) : null}
    </div>
  );
}
