"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
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

function filtersFromParams(params: URLSearchParams): FilterValues & { sortBy?: string; sortDir?: "asc" | "desc"; page?: number } {
  const f: FilterValues & { sortBy?: string; sortDir?: "asc" | "desc"; page?: number } = {};

  if (params.get("dateStart")) f.dateStart = params.get("dateStart")!;
  if (params.get("dateEnd")) f.dateEnd = params.get("dateEnd")!;
  if (params.get("cardIds")) f.cardIds = params.get("cardIds")!.split(",");
  if (params.get("categoryIds")) f.categoryIds = params.get("categoryIds")!.split(",");
  if (params.get("minAmount")) f.minAmount = parseFloat(params.get("minAmount")!);
  if (params.get("maxAmount")) f.maxAmount = parseFloat(params.get("maxAmount")!);
  if (params.get("method")) f.categorizationMethod = params.get("method") as FilterValues["categorizationMethod"];
  if (params.get("recurring")) f.isRecurring = params.get("recurring") === "true";
  if (params.get("search")) f.search = params.get("search")!;
  if (params.get("sort")) f.sortBy = params.get("sort")!;
  if (params.get("dir")) f.sortDir = params.get("dir") as "asc" | "desc";
  if (params.get("page")) f.page = parseInt(params.get("page")!, 10);

  return f;
}

function filtersToParams(
  filters: FilterValues,
  sortBy: string,
  sortDir: string,
  page: number
): URLSearchParams {
  const p = new URLSearchParams();

  if (filters.dateStart) p.set("dateStart", filters.dateStart);
  if (filters.dateEnd) p.set("dateEnd", filters.dateEnd);
  if (filters.cardIds?.length) p.set("cardIds", filters.cardIds.join(","));
  if (filters.categoryIds?.length) p.set("categoryIds", filters.categoryIds.join(","));
  if (filters.minAmount !== undefined) p.set("minAmount", String(filters.minAmount));
  if (filters.maxAmount !== undefined) p.set("maxAmount", String(filters.maxAmount));
  if (filters.categorizationMethod) p.set("method", filters.categorizationMethod);
  if (filters.isRecurring !== undefined) p.set("recurring", String(filters.isRecurring));
  if (filters.search) p.set("search", filters.search);
  if (sortBy !== "date") p.set("sort", sortBy);
  if (sortDir !== "desc") p.set("dir", sortDir);
  if (page > 1) p.set("page", String(page));

  return p;
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL state
  const urlState = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const { sortBy: urlSort, sortDir: urlDir, page: urlPage, ...filterValues } = urlState;
  const sortBy = urlSort ?? "date";
  const sortDir = urlDir ?? "desc";
  const page = urlPage ?? 1;

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
      ...filterValues,
      sortBy: sortBy as QueryFilters["sortBy"],
      sortDir: sortDir as QueryFilters["sortDir"],
      page,
      pageSize: 20,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams.toString()]
  );

  // Fetch transactions
  const {
    data: result,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["transactions", queryFilters],
    queryFn: () => fetchTransactions(queryFilters),
  });

  // URL update helper
  const updateUrl = useCallback(
    (newFilters: FilterValues, newSort: string, newDir: string, newPage: number) => {
      const params = filtersToParams(newFilters, newSort, newDir, newPage);
      const qs = params.toString();
      router.push(qs ? `/transactions?${qs}` : "/transactions", { scroll: false });
    },
    [router]
  );

  function handleFiltersChange(newFilters: FilterValues) {
    updateUrl(newFilters, sortBy, sortDir, 1); // Reset to page 1 on filter change
  }

  function handleSortChange(newSort: string, newDir: "asc" | "desc") {
    updateUrl(filterValues, newSort, newDir, 1);
  }

  function handlePageChange(newPage: number) {
    updateUrl(filterValues, sortBy, sortDir, newPage);
  }

  async function handleExportCsv() {
    const rows = await fetchTransactionsForExport(queryFilters);
    downloadCsv(rows);
  }

  // Loading state
  if (isLoading && !result) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6">
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <TransactionFilters
        filters={filterValues}
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
      {result && (
        <TransactionsTable
          transactions={result.transactions}
          total={result.total}
          totalAmount={result.totalAmount}
          page={result.page}
          pageSize={result.pageSize}
          sortBy={sortBy}
          sortDir={sortDir}
          categories={categories}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onRecategorized={() => refetch()}
        />
      )}
    </div>
  );
}
